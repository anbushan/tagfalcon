"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";
import { useLanguage } from "@/components/LanguageProvider";

const NAV_ITEMS = [
  {
    href: "/app/generator",
    key: "generator",
    icon: (
      <path
        d="M7 7h.01M3 7l7-4 7 4v6l-7 4-7-4V7z M10 21l7-4V7"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/research/keywords",
    key: "research",
    icon: (
      <path
        d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/video-rankings",
    key: "rankings",
    icon: (
      <path
        d="M3 17l5-5 4 4 8-8M21 8V3h-5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/trends",
    key: "trends",
    icon: (
      <path
        d="M3 17l6-6 4 4 8-8M17 7h4v4"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/optimization",
    key: "optimization",
    icon: (
      <path
        d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/channel-audit",
    key: "audit",
    icon: (
      <path
        d="M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m-6 0H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/upload-time",
    key: "uploadTime",
    icon: (
      <path
        d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/compare",
    key: "compare",
    icon: (
      <path
        d="M8 3v18M16 3v18M4 3h4M4 21h4M16 3h4M16 21h4"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/breakout-videos",
    key: "breakout",
    icon: (
      <path
        d="M12 2l2.9 6.9L22 9.2l-5.5 5 1.6 7.6L12 18l-6.1 3.8L7.5 14 2 9.2l7.1-.3L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/hashtag-generator",
    key: "hashtags",
    icon: (
      <path
        d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/revenue-report",
    key: "revenue",
    icon: (
      <path
        d="M12 2v20M17 5.5a4 4 0 00-4-2h-1.5a3.5 3.5 0 000 7H13a3.5 3.5 0 010 7h-2a4 4 0 01-4-2"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/research/keywords/workspaces",
    key: "workspaces",
    icon: (
      <path
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/history",
    key: "history",
    icon: (
      <path
        d="M12 8v4l3 3M21 12a9 9 0 11-9-9 9 9 0 019 9z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/billing",
    key: "billing",
    icon: (
      <path
        d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM3 10h18"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen, close, collapsed } = useSidebar();
  const { t } = useLanguage();

  return (
    <>
      {isOpen && (
        <div onClick={close} className="fixed inset-0 z-40 bg-black/30 lg:hidden" aria-hidden="true" />
      )}
      <nav
        className={`yt-scroll fixed inset-y-0 left-0 z-50 top-14 overflow-y-auto bg-white pb-6 pt-2 transition-[transform,width] duration-200 dark:bg-yt-dark lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:border-r lg:border-gray-200 lg:dark:border-yt-border ${
          isOpen ? "translate-x-0 w-64 border-r border-gray-200 shadow-lg dark:border-yt-border" : "-translate-x-full"
        } ${collapsed ? "lg:w-[72px]" : "lg:w-60"}`}
      >
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  title={collapsed ? t(`nav.${item.key}.title`) : undefined}
                  className={`flex items-center rounded-lg text-sm transition-colors ${
                    collapsed ? "flex-col gap-1 px-1 py-4 text-center" : "gap-5 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-gray-100 font-medium dark:bg-yt-dark-3"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-yt-dark-3"
                  }`}
                >
                  <svg
                    width={collapsed ? 22 : 20}
                    height={collapsed ? 22 : 20}
                    viewBox="0 0 24 24"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </svg>
                  <span className={collapsed ? "text-[10px] leading-tight" : "font-medium"}>
                    {t(`nav.${item.key}.title`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
