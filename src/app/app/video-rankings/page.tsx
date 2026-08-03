"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type RankResult = { keyword: string; source: "title" | "tag"; position: number | null };

const SUGGESTIONS = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=9bZkp7q19f0",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
];

export default function VideoRankingsPage() {
  const { t } = useLanguage();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [results, setResults] = useState<RankResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? videoUrl;
    if (override) setVideoUrl(override);
    setLoading(true);
    setError(null);
    setResults([]);
    setVideoTitle(null);
    setVideoId(null);
    try {
      const res = await fetch("/api/tools/rank-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error === "INVALID_VIDEO_URL"
            ? "That doesn't look like a valid YouTube video URL."
            : data.error === "VIDEO_NOT_FOUND"
            ? "Couldn't find that video — check the URL and try again."
            : data.error === "YOUTUBE_API_ERROR"
            ? `YouTube API error: ${data.detail || "unknown error"}. Check the YouTube API key in Configuration.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : data.error === "UNAUTHORIZED"
            ? "Your session expired — refresh the page and sign in again."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "rank_checker" });
        return;
      }
      setVideoId(data.videoId);
      setVideoTitle(data.videoTitle);
      setResults(data.results);
      trackEvent("check_rank", { candidate_count: data.results.length });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "rank_checker" });
    } finally {
      setLoading(false);
    }
  }

  const chartData = results.map((r) => ({
    name: r.keyword.length > 18 ? `${r.keyword.slice(0, 18)}…` : r.keyword,
    // Invert so a higher bar = better rank; unranked shows as 0
    value: r.position ? Math.max(1, 51 - r.position) : 0,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("rankings.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Paste a video URL — we'll pull its title and tags and check where it ranks for each.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || videoUrl.trim().length < 5}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("rankings.checking") : t("rankings.check")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!videoTitle && !loading && (
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

      {videoTitle && (
        <div className="mt-6">
          <div className="flex gap-3 rounded-yt border border-gray-200 p-3 dark:border-yt-border">
            {videoId && (
              <div className="yt-thumb-wrap aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ranking analysis for</p>
              <p className="line-clamp-2 text-sm font-medium leading-snug">{videoTitle}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:border-yt-border dark:text-gray-400">
                  <th className="py-2">{t("rankings.rank")}</th>
                  <th className="py-2">{t("rankings.keyword")}</th>
                  <th className="py-2">{t("rankings.source")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.keyword} className="border-b dark:border-yt-border">
                    <td className="py-2">
                      {r.position ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-yt-red dark:bg-red-950">
                          #{r.position}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-yt-dark-3">
                          {t("rankings.notFound")}
                        </span>
                      )}
                    </td>
                    <td className="py-2">{r.keyword}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {r.source === "title" ? t("rankings.sourceTitle") : t("rankings.sourceTag")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.length > 0 && (
            <div className="mt-4 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
              <p className="text-sm font-medium">Rank strength by keyword</p>
              <p className="text-xs text-gray-400">Taller bar = better ranking position</p>
              <InsightBarChart data={chartData} height={180} />
            </div>
          )}
        </div>
      )}

      <AdSlot slot="3333333333" />
    </main>
  );
}
