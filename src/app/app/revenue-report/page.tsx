"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type RecentVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  views: number;
  publishedAt: string;
};

type Report = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  channelStartDate: string | null;
  channelDescription: string;
  channelCountry: string | null;
  channelCustomUrl: string | null;
  contactEmail: string | null;
  socialLinks: string[];
  category: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgViewsRecent: number;
  estMonthlyViews: number;
  estRevenueLowUsd: number;
  estRevenueHighUsd: number;
  recentVideos: RecentVideo[];
};

function youtubeVideoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeChannelUrl(report: Report) {
  return report.channelCustomUrl
    ? `https://www.youtube.com/${report.channelCustomUrl.replace(/^\/*/, "")}`
    : `https://www.youtube.com/channel/${report.channelId}`;
}

const SUGGESTIONS = ["https://www.youtube.com/@MrBeast", "@mkbhd", "@veritasium", "@NASA"];

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RevenueReportPage() {
  const { t } = useLanguage();
  const [channelUrl, setChannelUrl] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? channelUrl;
    if (override) setChannelUrl(override);
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/tools/revenue-report", {
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
            ? t("revenueReport.invalidUrl")
            : data.error === "CHANNEL_NOT_FOUND"
            ? t("revenueReport.notFound")
            : data.error === "YOUTUBE_API_ERROR"
            ? `YouTube API error: ${data.detail || "unknown error"}. Check the YouTube API key in Configuration.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : data.error === "UNAUTHORIZED"
            ? "Your session expired — refresh the page and sign in again."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "revenue_report" });
        return;
      }
      setReport(data);
      trackEvent("revenue_report", { channel_id: data.channelId });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "revenue_report" });
    } finally {
      setLoading(false);
    }
  }

  const chartData =
    report?.recentVideos.map((v) => ({
      name: v.title.length > 18 ? `${v.title.slice(0, 18)}…` : v.title,
      value: v.views,
    })) ?? [];

  const topVideos = report ? [...report.recentVideos].sort((a, b) => b.views - a.views).slice(0, 3) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("revenueReport.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("revenueReport.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder={t("revenueReport.placeholder")}
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && channelUrl.trim().length >= 2 && analyze()}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || channelUrl.trim().length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("revenueReport.analyzing") : t("revenueReport.analyze")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!report && !loading && (
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

      {report && (
        <div className="mt-6">
          <div className="flex items-center gap-3 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
            {report.channelThumbnail && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.channelThumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <a
                href={youtubeChannelUrl(report)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-lg font-semibold hover:underline"
              >
                {report.channelTitle}
              </a>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {report.category && (
                  <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-yt-dark-3 dark:text-gray-300">
                    {t("revenueReport.category")}: {report.category}
                  </span>
                )}
                {report.channelCountry && (
                  <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-yt-dark-3 dark:text-gray-300">
                    {report.channelCountry}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(report.channelDescription || report.contactEmail || report.socialLinks.length > 0) && (
            <div className="mt-3 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
              <p className="text-sm font-medium">{t("revenueReport.channelInfo")}</p>
              {report.channelDescription && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{report.channelDescription}</p>
              )}
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t("revenueReport.contactInfo")}</p>
                {report.contactEmail || report.socialLinks.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {report.contactEmail && (
                      <a
                        href={`mailto:${report.contactEmail}`}
                        className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-yt-border dark:text-gray-300 dark:hover:bg-yt-dark-3"
                      >
                        {report.contactEmail}
                      </a>
                    )}
                    {report.socialLinks.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[220px] truncate rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-yt-border dark:text-gray-300 dark:hover:bg-yt-dark-3"
                      >
                        {link.replace(/^https?:\/\//, "")}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">{t("revenueReport.noContactInfo")}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t("revenueReport.subscribers")} value={report.subscriberCount != null ? compactNumber.format(report.subscriberCount) : "—"} />
            <Stat label={t("revenueReport.totalViews")} value={compactNumber.format(report.totalViewCount)} />
            <Stat label={t("revenueReport.videos")} value={String(report.videoCount)} />
            <Stat label={t("revenueReport.avgViews")} value={compactNumber.format(report.avgViewsRecent)} />
            <Stat label={t("revenueReport.estMonthlyViews")} value={compactNumber.format(report.estMonthlyViews)} />
            <Stat
              label={t("revenueReport.channelStartDate")}
              value={report.channelStartDate ? new Date(report.channelStartDate).toLocaleDateString() : "—"}
            />
          </div>

          <div className="mt-4 rounded-yt border border-gray-200 bg-gray-50 p-5 text-center dark:border-yt-border dark:bg-yt-dark-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("revenueReport.estMonthlyRevenue")}</p>
            <p className="mt-1 text-3xl font-bold text-yt-red">
              {usd.format(report.estRevenueLowUsd)} – {usd.format(report.estRevenueHighUsd)}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t("revenueReport.disclaimer")}</p>
          </div>

          {topVideos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium">{t("revenueReport.topVideos")}</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {topVideos.map((v) => (
                  <a
                    key={v.videoId}
                    href={youtubeVideoUrl(v.videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="yt-thumb-wrap block aspect-video overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3"
                  >
                    {v.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="mt-4 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
              <p className="text-sm font-medium">{t("revenueReport.recentVideos")}</p>
              <InsightBarChart data={chartData} height={200} />
            </div>
          )}

          {report.recentVideos.length > 0 && (
            <div className="mt-4 space-y-2">
              {report.recentVideos.map((v) => (
                <a
                  key={v.videoId}
                  href={youtubeVideoUrl(v.videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-yt border border-gray-200 p-3 hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
                >
                  <div className="yt-thumb-wrap aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3 sm:w-40">
                    {v.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                    {v.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{v.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {compactNumber.format(v.views)} views
                      {v.publishedAt && ` · ${new Date(v.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <AdSlot slot="7777777777" />
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
