"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";
import { useSidebar } from "@/components/SidebarContext";
import { useLanguage } from "@/components/LanguageProvider";
import Logo from "@/components/Logo";

export default function Header({ title, isAdmin = false }: { title?: string; isAdmin?: boolean }) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = (session?.user?.name || session?.user?.email || "?").charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-yt-border dark:bg-yt-dark sm:px-4">
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-yt-dark-3"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="ml-1 hidden sm:block">
          <Logo markSize={26} />
        </Link>
        {title && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:ml-3">{title}</p>}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <ThemeToggle />
        {!isAdmin && <NotificationBell />}

        <div className="relative ml-1" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="Account menu">
            <Avatar email={session?.user?.email} name={session?.user?.name} size={32} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-yt border border-gray-200 bg-white py-2 shadow-lg dark:border-yt-border dark:bg-yt-dark-2">
              <div className="border-b border-gray-100 px-4 py-2 dark:border-yt-border">
                <p className="truncate text-sm font-medium">{session?.user?.name || "Account"}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
              </div>
              <Link
                href="/app/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-yt-dark-3"
              >
                {t("nav.profile.title")}
              </Link>
              <Link
                href="/app/billing"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-yt-dark-3"
              >
                {t("nav.billing.title")}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-yt-dark-3"
              >
                {t("header.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
