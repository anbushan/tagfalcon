"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleStartFreeButton from "@/components/GoogleStartFreeButton";

const LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export default function MarketingHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur dark:border-yt-border dark:bg-yt-dark/95 sm:px-6">
      <Link href="/">
        <Logo markSize={26} />
      </Link>

      <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300 md:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-yt-red">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session ? (
          <Link
            href="/app/generator"
            className="rounded-full bg-yt-red px-4 py-1.5 text-sm font-medium text-white hover:bg-yt-red-dark"
          >
            Go to app
          </Link>
        ) : (
          <GoogleStartFreeButton label="Sign in" className="!px-4 !py-1.5 !text-sm" />
        )}
      </div>
    </header>
  );
}
