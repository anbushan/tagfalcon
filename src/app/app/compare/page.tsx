"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type Side = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgRecentViews: number;
  avgUploadGapDays: number | null;
  engagementRate: number;
  viewsTrend: "growing" | "declining" | "steady" | "unknown";
};

type Result = { a: Side; b: Side };

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export default function ComparePage() {
  const { t } = useLanguage();
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compare() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/channel-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrlA: urlA, channelUrlB: urlB }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error === "INVALID_CHANNEL_URL"
            ? "One of those doesn't look like a valid YouTube channel or video URL."
            : data.error === "CHANNEL_NOT_FOUND"
            ? "Couldn't find one of those channels — check the URLs and try again."
            : data.error === "YOUTUBE_API_ERROR"
            ? `YouTube API error: ${data.detail || "unknown error"}.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "channel_comparison" });
        return;
      }
      setResult(data);
      trackEvent("channel_comparison", { channel_a: data.a.channelId, channel_b: data.b.channelId });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "channel_comparison" });
    } finally {
      setLoading(false);
    }
  }

  const rows: { label: string; format: (s: Side) => string }[] = result
    ? [
        { label: t("compare.subscribers"), format: (s) => (s.subscriberCount != null ? compactNumber.format(s.subscriberCount) : "—") },
        { label: t("compare.totalViews"), format: (s) => compactNumber.format(s.totalViewCount) },
        { label: t("compare.videos"), format: (s) => String(s.videoCount) },
        { label: t("compare.avgRecentViews"), format: (s) => compactNumber.format(s.avgRecentViews) },
        { label: t("compare.uploadGap"), format: (s) => (s.avgUploadGapDays != null ? `${s.avgUploadGapDays.toFixed(1)}d` : "—") },
        { label: t("compare.engagement"), format: (s) => `${(s.engagementRate * 100).toFixed(1)}%` },
        { label: t("compare.trend"), format: (s) => t(`audit.trend_${s.viewsTrend}`) },
      ]
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("compare.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("compare.subtitle")}</p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          className="rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder="Channel A — https://www.youtube.com/@channelname"
          value={urlA}
          onChange={(e) => setUrlA(e.target.value)}
        />
        <input
          className="rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder="Channel B — https://www.youtube.com/@channelname"
          value={urlB}
          onChange={(e) => setUrlB(e.target.value)}
        />
      </div>
      <button
        onClick={compare}
        disabled={loading || urlA.trim().length < 2 || urlB.trim().length < 2}
        className="mt-3 rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
      >
        {loading ? t("compare.comparing") : t("compare.compare")}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            {[result.a, result.b].map((s) => (
              <div key={s.channelId} className="flex items-center gap-3 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
                {s.channelThumbnail && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.channelThumbnail} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <p className="min-w-0 truncate text-sm font-semibold">{s.channelTitle}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:border-yt-border dark:text-gray-400">
                  <th className="py-2"></th>
                  <th className="py-2">{result.a.channelTitle}</th>
                  <th className="py-2">{result.b.channelTitle}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b dark:border-yt-border">
                    <td className="py-2 text-gray-500 dark:text-gray-400">{row.label}</td>
                    <td className="py-2 font-medium">{row.format(result.a)}</td>
                    <td className="py-2 font-medium">{row.format(result.b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
            <p className="text-sm font-medium">{t("compare.avgRecentViews")}</p>
            <InsightBarChart
              data={[
                { name: result.a.channelTitle.length > 16 ? `${result.a.channelTitle.slice(0, 16)}…` : result.a.channelTitle, value: result.a.avgRecentViews },
                { name: result.b.channelTitle.length > 16 ? `${result.b.channelTitle.slice(0, 16)}…` : result.b.channelTitle, value: result.b.avgRecentViews },
              ]}
              height={180}
            />
          </div>

          <p className="mt-3 text-xs text-gray-400">{t("compare.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1616161616" />
    </main>
  );
}
