import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to TagFalcon with your Google account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(searchParams.callbackUrl || "/app/generator");
  }

  return <LoginClient />;
}
