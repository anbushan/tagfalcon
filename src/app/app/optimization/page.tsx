"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronDown } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import ScoreGauge from "@/components/ScoreGauge";
import AutocompleteInput from "@/components/AutocompleteInput";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type ChecklistItem = { key: string; label: string; passed: boolean; message: string };
type Details = {
  description: string;
  tags: string[];
  tagCharCount: number;
  hashtags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
};
type Result = {
  videoId: string;
  videoTitle: string;
  videoThumbnail: string | null;
  score: number;
  checklist: ChecklistItem[];
  details: Details;
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const SUGGESTIONS = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=9bZkp7q19f0",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
];

export default function OptimizationPage() {
  const { t } = useLanguage();
  const [videoUrl, setVideoUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? videoUrl;
    if (override) setVideoUrl(override);
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedKey(null);
    try {
      const res = await fetch("/api/tools/video-optimization", {
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
            ? `YouTube API error: ${data.detail || "unknown error"}.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "video_optimization" });
        return;
      }
      setResult(data);
      trackEvent("video_optimization", { score: data.score });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "video_optimization" });
    } finally {
      setLoading(false);
    }
  }

  function renderDetail(item: ChecklistItem, details: Details) {
    switch (item.key) {
      case "title_length":
        return <p className="text-sm">{result?.videoTitle}</p>;
      case "description_length":
        return details.description ? (
          <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{details.description}</p>
        ) : (
          <p className="text-sm text-gray-400">No description set.</p>
        );
      case "tags":
        return details.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {details.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-yt-dark-3">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No tags set.</p>
        );
      case "hashtags":
        return details.hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {details.hashtags.map((tag, i) => (
              <span key={`${tag}-${i}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-yt-red dark:bg-red-950 dark:text-red-300">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hashtags found in the title or description.</p>
        );
      case "engagement":
        return (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
              <p className="font-semibold">{compactNumber.format(details.viewCount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
              <p className="font-semibold">{compactNumber.format(details.likeCount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
              <p className="font-semibold">{compactNumber.format(details.commentCount)}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("optimization.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("optimization.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <AutocompleteInput
          type="video"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={setVideoUrl}
          onPick={(v) => analyze(v)}
          onEnter={() => videoUrl.trim().length >= 5 && analyze()}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || videoUrl.trim().length < 5}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("optimization.analyzing") : t("optimization.analyze")}
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
            {result.videoThumbnail && (
              <div className="yt-thumb-wrap aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.videoThumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{result.videoTitle}</p>
            </div>
            <div className="shrink-0 text-center">
              <ScoreGauge score={result.score} />
              <p className="mt-1 text-xs text-gray-400">{t("optimization.score")}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {result.checklist.map((item) => {
              const isOpen = expandedKey === item.key;
              return (
                <div key={item.key} className="rounded-yt border border-gray-200 dark:border-yt-border">
                  <button
                    onClick={() => setExpandedKey(isOpen ? null : item.key)}
                    className="flex w-full items-center gap-2 p-3 text-left text-sm"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                        item.passed ? "bg-green-500" : "bg-amber-500"
                      }`}
                    >
                      {item.passed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <p className="px-3 pb-3 pl-10 text-xs text-gray-500 dark:text-gray-400">{item.message}</p>
                  {isOpen && (
                    <div className="border-t border-gray-100 p-3 pl-10 dark:border-yt-border">
                      {renderDetail(item, result.details)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-400">{t("optimization.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1010101010" />
    </main>
  );
}
