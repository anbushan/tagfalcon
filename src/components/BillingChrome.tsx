"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent } from "@/lib/analytics";

export function BillingTitle() {
  const { t } = useLanguage();
  return <h1 className="text-2xl font-bold">{t("billing.title")}</h1>;
}

export function BillingPlanCard({
  planName,
  hasActiveSub,
  renewsAt,
}: {
  planName: string;
  hasActiveSub: boolean;
  renewsAt: string | null;
}) {
  const { t } = useLanguage();
  return (
    <div className="mt-6 rounded-yt border border-gray-200 p-5 dark:border-yt-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("billing.currentPlan")}</p>
          <p className="text-lg font-semibold">{planName}</p>
        </div>
        <Link
          href="/pricing"
          onClick={() => trackEvent(hasActiveSub ? "click_change_plan" : "click_upgrade")}
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-3"
        >
          {hasActiveSub ? t("billing.manage") : t("billing.upgrade")}
        </Link>
      </div>
      {renewsAt && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Active until {renewsAt} — purchases don't auto-renew, come back here to extend it.
        </p>
      )}
    </div>
  );
}

export type UsageMetric = { key: string; used: number; limit: number | string };

export function BillingUsageGrid({ metrics }: { metrics: UsageMetric[] }) {
  const { t } = useLanguage();

  const pct = (used: number, limit: number | string) =>
    typeof limit === "number" && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const chartData = metrics.map((m) => ({ name: t(`billing.${m.key}`), value: pct(m.used, m.limit) }));
  const barColors = chartData.map((d) => (d.value >= 90 ? "#FF0000" : d.value >= 60 ? "#F59E0B" : "#9CA3AF"));

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-yt border border-gray-200 p-3 text-center dark:border-yt-border">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(`billing.${m.key}`)}</p>
            <p className="text-lg font-semibold">
              {m.used} / {m.limit}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
        <p className="text-sm font-medium">Today's usage (% of daily limit)</p>
        <InsightBarChart data={chartData} colorByIndex={barColors} height={180} />
      </div>
    </>
  );
}
