"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const TAB_KEYS = [
  "tags",
  "keywords",
  "ranks",
  "revenue",
  "trends",
  "optimization",
  "audit",
  "hashtags",
  "uploadTime",
  "compare",
  "breakout",
  "topCreators",
] as const;

export function HistoryTitle() {
  const { t } = useLanguage();
  return <h1 className="text-2xl font-bold">{t("history.title")}</h1>;
}

export function HistoryTabs({ activeTab }: { activeTab: string }) {
  const { t } = useLanguage();
  return (
    <div className="mt-6 flex flex-wrap gap-2 border-b">
      {TAB_KEYS.map((key) => (
        <Link
          key={key}
          href={`/app/history?tab=${key}`}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${
            activeTab === key ? "border-gray-900 font-medium" : "border-transparent text-gray-500"
          }`}
        >
          {t(`history.tabs.${key}`)}
        </Link>
      ))}
    </div>
  );
}

export function HistorySearchInput({ tab, defaultValue }: { tab: string; defaultValue?: string }) {
  const { t } = useLanguage();
  return (
    <form className="mt-4" action="/app/history">
      <input type="hidden" name="tab" value={tab} />
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={t("history.searchPlaceholder")}
        className="w-72 rounded-md border px-3 py-2 text-sm"
      />
    </form>
  );
}

export function HistoryEmptyState({ hasQuery }: { hasQuery: boolean }) {
  const { t } = useLanguage();
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      {hasQuery ? "No results match your search." : t("history.empty")}
    </p>
  );
}
