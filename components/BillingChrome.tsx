"use client";

import { useLanguage } from "@/components/LanguageProvider";
import ManageBillingButton from "@/components/ManageBillingButton";
import InsightBarChart from "@/components/charts/InsightBarChart";

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
        {hasActiveSub ? (
          <ManageBillingButton />
        ) : (
          <span
            title="Paid plans are coming soon"
            className="cursor-not-allowed rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-500 dark:bg-yt-dark-3 dark:text-gray-500"
          >
            Coming soon
          </span>
        )}
      </div>
      {renewsAt && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Renews {renewsAt}</p>}
    </div>
  );
}

export function BillingUsageGrid({
  tagsToday,
  tagsLimit,
  keywordSearches,
  keywordLimit,
  rankChecks,
  rankLimit,
}: {
  tagsToday: number;
  tagsLimit: number | string;
  keywordSearches: number;
  keywordLimit: number | string;
  rankChecks: number;
  rankLimit: number | string;
}) {
  const { t } = useLanguage();

  const pct = (used: number, limit: number | string) =>
    typeof limit === "number" && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const chartData = [
    { name: t("billing.tagsToday"), value: pct(tagsToday, tagsLimit) },
    { name: t("billing.keywordSearches"), value: pct(keywordSearches, keywordLimit) },
    { name: t("billing.rankChecks"), value: pct(rankChecks, rankLimit) },
  ];
  const barColors = chartData.map((d) => (d.value >= 90 ? "#FF0000" : d.value >= 60 ? "#F59E0B" : "#9CA3AF"));

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-yt border border-gray-200 p-3 text-center dark:border-yt-border">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("billing.tagsToday")}</p>
          <p className="text-lg font-semibold">
            {tagsToday} / {tagsLimit}
          </p>
        </div>
        <div className="rounded-yt border border-gray-200 p-3 text-center dark:border-yt-border">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("billing.keywordSearches")}</p>
          <p className="text-lg font-semibold">
            {keywordSearches} / {keywordLimit}
          </p>
        </div>
        <div className="rounded-yt border border-gray-200 p-3 text-center dark:border-yt-border">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("billing.rankChecks")}</p>
          <p className="text-lg font-semibold">
            {rankChecks} / {rankLimit}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
        <p className="text-sm font-medium">Today's usage (% of daily limit)</p>
        <InsightBarChart data={chartData} colorByIndex={barColors} height={180} />
      </div>
    </>
  );
}
