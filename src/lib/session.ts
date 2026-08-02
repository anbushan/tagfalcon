import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Returns the current user's id if they have a valid session AND that id
 * still resolves to a real user (the jwt callback in auth.ts already
 * self-heals dangling ids by clearing them, so checking for presence here
 * is enough — no extra DB round trip needed).
 */
export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  return id || null;
}
