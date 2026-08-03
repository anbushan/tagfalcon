"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type DayBucket = { day: string; avgViews: number; count: number };
type TimeBucket = { bucket: string; avgViews: number; count: number };

type Result = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  bestDay: string | null;
  bestBucket: string | null;
  dayBreakdown: DayBucket[];
  timeBreakdown: TimeBucket[];
  sampleSize: number;
};

const SUGGESTIONS = ["https://www.youtube.com/@MrBeast", "@mkbhd", "@veritasium"];

export default function UploadTimePage() {
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
      const res = await fetch("/api/tools/upload-time", {
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
        trackError(message, { tool: "upload_time" });
        return;
      }
      setResult(data);
      trackEvent("upload_time", { channel_id: data.channelId });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "upload_time" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("uploadTime.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("uploadTime.subtitle")}</p>

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
          {loading ? t("uploadTime.analyzing") : t("uploadTime.analyze")}
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
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-yt border border-gray-200 bg-gray-50 p-4 text-center dark:border-yt-border dark:bg-yt-dark-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("uploadTime.bestDay")}</p>
              <p className="mt-1 text-2xl font-bold text-yt-red">{result.bestDay ?? "—"}</p>
            </div>
            <div className="rounded-yt border border-gray-200 bg-gray-50 p-4 text-center dark:border-yt-border dark:bg-yt-dark-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("uploadTime.bestTime")}</p>
              <p className="mt-1 text-lg font-bold text-yt-red">{result.bestBucket ?? "—"}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border">
              <p className="text-sm font-medium">{t("uploadTime.byDay")}</p>
              <InsightBarChart data={result.dayBreakdown.map((d) => ({ name: d.day, value: d.avgViews }))} height={200} />
            </div>
            <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border">
              <p className="text-sm font-medium">{t("uploadTime.byTime")}</p>
              <InsightBarChart
                data={result.timeBreakdown.map((b) => ({ name: b.bucket.split(" ")[0], value: b.avgViews }))}
                height={200}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400">{t("uploadTime.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1515151515" />
    </main>
  );
}
