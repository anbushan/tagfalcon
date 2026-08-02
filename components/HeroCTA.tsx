"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import GoogleStartFreeButton from "@/components/GoogleStartFreeButton";

export default function HeroCTA() {
  const { data: session, status } = useSession();

  if (status === "authenticated" && session) {
    return (
      <Link
        href="/app/generator"
        className="rounded-full bg-yt-red px-6 py-3 font-medium text-white hover:bg-yt-red-dark"
      >
        Go to app
      </Link>
    );
  }

  return <GoogleStartFreeButton />;
}
