import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// No PrismaAdapter here on purpose: the adapter expects NextAuth's own
// User/Account/Session/VerificationToken shapes, which don't match our
// custom User model (role, status, usage relations, etc). Instead we
// upsert into our own `users` table in the signIn callback and carry
// id/role through the JWT. Google is the only provider — no password auth.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
          googleId: account.providerAccountId,
          emailVerifiedAt: new Date(),
        },
        create: {
          email: user.email,
          name: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
          googleId: account.providerAccountId,
          emailVerifiedAt: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in `user` is the provider profile; look up our own
      // row (by email) to get our internal id/role/status onto the token.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl;
        }
        return token; // fresh sign-in, nothing else to reconcile this pass
      }

      // Every other request reuses a cached JWT. If the database was reset,
      // reseeded, or the user was deleted while this cookie is still
      // around, token.id can point at a row that no longer exists —
      // everything downstream (usage tracking, workspace creation, etc.)
      // then fails on a foreign key violation instead of a clean
      // "please sign in again". Self-heal by re-checking existence and
      // wiping the identity claims if the row is gone, so the app's auth
      // guards correctly treat this as signed-out rather than silently
      // passing along a dangling id.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (!dbUser) {
          delete token.id;
          delete token.role;
          delete token.status;
          delete token.planSlug;
          delete token.name;
          delete token.picture;
          return token;
        }

        if (trigger === "update") {
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }

        // Refresh the plan slug periodically so an upgrade/downgrade is
        // reflected without forcing a full re-login.
        if (trigger === "update" || !token.planSlug) {
          const activeSub = await prisma.subscription.findFirst({
            where: { userId: dbUser.id, status: "active" },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
          });
          token.planSlug = activeSub?.plan.slug ?? "free";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // token.id is intentionally cleared above when the underlying user
        // no longer exists — propagate that as "no id" rather than handing
        // out a dangling one. Callers must treat a missing id as signed-out.
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).planSlug = token.planSlug;
      }
      return session;
    },
  },
};
