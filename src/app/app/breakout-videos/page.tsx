"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type Video = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  ratio: number;
  publishedAt: string;
  status: "breakout" | "underperformer" | "typical";
};

type Result = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  avgViews: number;
  videos: Video[];
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const SUGGESTIONS = ["https://www.youtube.com/@MrBeast", "@mkbhd", "@veritasium"];

function statusBadge(status: Video["status"], t: (key: string) => string) {
  if (status === "breakout")
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">{t("breakout.statusBreakout")}</span>;
  if (status === "underperformer")
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-yt-red dark:bg-red-950">{t("breakout.statusUnderperformer")}</span>;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-yt-dark-3">{t("breakout.statusTypical")}</span>;
}

export default function BreakoutVideosPage() {
  const { t } = useLanguage();
  const [channelUrl, setChannelUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? channelUrl;
    if (override) setChannelUrl(override);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/breakout-videos", {
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
        trackError(message, { tool: "breakout_videos" });
        return;
      }
      setResult(data);
      trackEvent("breakout_videos", { channel_id: data.channelId });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "breakout_videos" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("breakout.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("breakout.subtitle")}</p>

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
          {loading ? t("breakout.analyzing") : t("breakout.analyze")}
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
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.channelThumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{result.channelTitle}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("breakout.avgViews")}: {compactNumber.format(result.avgViews)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {result.videos.map((v) => (
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
                  <div className="flex items-center gap-2">
                    {statusBadge(v.status, t)}
                    <span className="text-xs text-gray-400">{v.ratio}× {t("breakout.average")}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {compactNumber.format(v.views)} views
                    {v.publishedAt && ` · ${new Date(v.publishedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-400">{t("breakout.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1717171717" />
    </main>
  );
}
