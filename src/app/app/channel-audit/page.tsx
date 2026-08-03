"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type Finding = { key: string; label: string; passed: boolean; message: string };
type AuditVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
};
type UploadGap = { label: string; days: number };

type AuditResult = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgUploadGapDays: number | null;
  gapConsistency: number | null;
  uploadGaps: UploadGap[];
  engagementRate: number;
  viewsTrend: "growing" | "declining" | "steady" | "unknown";
  score: number;
  findings: Finding[];
  recentVideos: AuditVideo[];
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-yt-red";
}

const SUGGESTIONS = ["https://www.youtube.com/@MrBeast", "@mkbhd", "@veritasium"];

export default function ChannelAuditPage() {
  const { t } = useLanguage();
  const [channelUrl, setChannelUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? channelUrl;
    if (override) setChannelUrl(override);
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedKey(null);
    try {
      const res = await fetch("/api/tools/channel-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error === "INVALID_CHANNEL_URL"
            ? "That doesn't look like a valid YouTube channel or video URL."
            : data.error === "CHANNEL_NOT_FOUND"
            ? "Couldn't find that channel — check the URL and try again."
            : data.error === "YOUTUBE_API_ERROR"
            ? `YouTube API error: ${data.detail || "unknown error"}.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "channel_audit" });
        return;
      }
      setResult(data);
      trackEvent("channel_audit", { channel_id: data.channelId, score: data.score });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "channel_audit" });
    } finally {
      setLoading(false);
    }
  }

  function renderDetail(item: Finding, r: AuditResult) {
    switch (item.key) {
      case "upload_frequency":
        return r.uploadGaps.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("audit.daysBetweenUploads")}</p>
            <InsightBarChart data={r.uploadGaps.map((g) => ({ name: g.label, value: g.days }))} height={180} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not enough recent uploads to chart yet.</p>
        );
      case "upload_consistency":
        return (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("audit.avgGap")}</p>
              <p className="font-semibold">{r.avgUploadGapDays != null ? `${r.avgUploadGapDays.toFixed(1)}d` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("audit.variability")}</p>
              <p className="font-semibold">
                {r.gapConsistency != null
                  ? r.gapConsistency < 0.3
                    ? t("audit.variabilityLow")
                    : r.gapConsistency < 0.6
                    ? t("audit.variabilityMedium")
                    : t("audit.variabilityHigh")
                  : "—"}
              </p>
            </div>
          </div>
        );
      case "engagement":
        return r.recentVideos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:border-yt-border dark:text-gray-400">
                  <th className="py-1.5 pr-2">Video</th>
                  <th className="py-1.5 pr-2">Views</th>
                  <th className="py-1.5 pr-2">Likes</th>
                  <th className="py-1.5 pr-2">Comments</th>
                  <th className="py-1.5">Rate</th>
                </tr>
              </thead>
              <tbody>
                {r.recentVideos.map((v) => (
                  <tr key={v.videoId} className="border-b dark:border-yt-border">
                    <td className="max-w-[200px] truncate py-1.5 pr-2">{v.title}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.views)}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.likes)}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.comments)}</td>
                    <td className="py-1.5">{v.views > 0 ? (((v.likes + v.comments) / v.views) * 100).toFixed(1) : "0.0"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No recent videos to break down.</p>
        );
      case "views_trend": {
        const chronological = [...r.recentVideos].reverse();
        return chronological.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("audit.viewsOverTime")}</p>
            <InsightBarChart
              data={chronological.map((v) => ({
                name: v.title.length > 16 ? `${v.title.slice(0, 16)}…` : v.title,
                value: v.views,
              }))}
              height={180}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not enough recent uploads to chart yet.</p>
        );
      }
      default:
        return null;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("audit.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder="https://www.youtube.com/@channelname"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && channelUrl.trim().length >= 2 && analyze()}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || channelUrl.trim().length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("audit.analyzing") : t("audit.analyze")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!result && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400">Try one of these:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => analyze(s)}
                className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-yt-border dark:text-gray-400 dark:hover:bg-yt-dark-3"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="flex items-center gap-3 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
            {result.channelThumbnail && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.channelThumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <p className="min-w-0 flex-1 truncate text-lg font-semibold">{result.channelTitle}</p>
            <div className="shrink-0 text-center">
              <p className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}</p>
              <p className="text-xs text-gray-400">{t("audit.score")}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("audit.subscribers")} value={result.subscriberCount != null ? compactNumber.format(result.subscriberCount) : "—"} />
            <Stat label={t("audit.uploadGap")} value={result.avgUploadGapDays != null ? `${result.avgUploadGapDays.toFixed(1)}d` : "—"} />
            <Stat label={t("audit.engagement")} value={`${(result.engagementRate * 100).toFixed(1)}%`} />
            <Stat label={t("audit.trend")} value={t(`audit.trend_${result.viewsTrend}`)} />
          </div>

          <div className="mt-4 space-y-2">
            {result.findings.map((item) => {
              const isOpen = expandedKey === item.key;
              return (
                <div key={item.key} className="rounded-yt border border-gray-200 dark:border-yt-border">
                  <button
                    onClick={() => setExpandedKey(isOpen ? null : item.key)}
                    className="flex w-full items-center gap-2 p-3 text-left text-sm"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                        item.passed ? "bg-green-500" : "bg-amber-500"
                      }`}
                    >
                      {item.passed ? "✓" : "!"}
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="px-3 pb-3 pl-10 text-xs text-gray-500 dark:text-gray-400">{item.message}</p>
                  {isOpen && (
                    <div className="border-t border-gray-100 p-3 pl-10 dark:border-yt-border">{renderDetail(item, result)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {result.recentVideos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium">{t("audit.recentVideos")}</p>
              <div className="mt-2 space-y-2">
                {result.recentVideos.map((v) => (
                  <a
                    key={v.videoId}
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-yt border border-gray-200 p-3 hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
                  >
                    <div className="yt-thumb-wrap aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3 sm:w-36">
                      {v.thumbnail && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {compactNumber.format(v.views)} views
                        {v.publishedAt && ` · ${new Date(v.publishedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">{t("audit.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1212121212" />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-yt border border-gray-200 p-3 text-center dark:border-yt-border">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
