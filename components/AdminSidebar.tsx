"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";

const NAV_ITEMS = [
  {
    href: "/admin/overview",
    title: "Overview",
    icon: <path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/users",
    title: "Users",
    icon: <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/subscriptions",
    title: "Subscriptions",
    icon: <path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM3 10h18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/plans",
    title: "Plans",
    icon: <path d="M20 12V8H6a2 2 0 010-4h12v4M4 6v12a2 2 0 002 2h14v-4M18 12a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/content",
    title: "Content",
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/audit-log",
    title: "Audit log",
    icon: <path d="M12 8v4l3 3M21 12a9 9 0 11-9-9 9 9 0 019 9z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/feedback",
    title: "Feedback",
    icon: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/notifications",
    title: "Notifications",
    icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/admin/config",
    title: "Configuration",
    icon: <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close, collapsed } = useSidebar();

  return (
    <>
      {isOpen && (
        <div onClick={close} className="fixed inset-0 z-40 bg-black/30 lg:hidden" aria-hidden="true" />
      )}
      <nav
        className={`yt-scroll fixed inset-y-0 left-0 z-50 top-14 overflow-y-auto bg-white pb-6 pt-2 transition-[transform,width] duration-200 dark:bg-yt-dark lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:border-r lg:border-gray-200 lg:dark:border-yt-border ${
          isOpen ? "translate-x-0 w-64 border-r border-gray-200 shadow-lg dark:border-yt-border" : "-translate-x-full"
        } ${collapsed ? "lg:w-[72px]" : "lg:w-56"}`}
      >
        {!collapsed && (
          <p className="px-4 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-gray-400">Admin</p>
        )}
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  title={collapsed ? item.title : undefined}
                  className={`flex items-center rounded-lg text-sm transition-colors ${
                    collapsed ? "flex-col gap-1 px-1 py-3 text-center" : "gap-3 px-3 py-2"
                  } ${
                    active
                      ? "bg-gray-100 font-medium dark:bg-yt-dark-3"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-yt-dark-3"
                  }`}
                >
                  <svg width={collapsed ? 20 : 18} height={collapsed ? 20 : 18} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                    {item.icon}
                  </svg>
                  <span className={collapsed ? "text-[9px] leading-tight" : ""}>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/app/generator"
          onClick={close}
          className={`mt-4 flex items-center rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-yt-dark-3 ${
            collapsed ? "flex-col gap-1 px-1 py-3 text-center" : "gap-3 px-3 py-2 mx-2"
          }`}
        >
          <svg width={collapsed ? 20 : 18} height={collapsed ? 20 : 18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={collapsed ? "text-[9px] leading-tight" : ""}>Back to app</span>
        </Link>
      </nav>
    </>
  );
}
