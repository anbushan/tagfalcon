"use client";

import { useState } from "react";
import { Users, Eye, Film, CalendarDays } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import StatTile from "@/components/StatTile";
import ChannelAvatar from "@/components/ChannelAvatar";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";
import { TREND_REGIONS, TREND_CATEGORIES } from "@/lib/trends-constants";

type TopCreator = {
  channelId: string;
  title: string;
  thumbnail: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  channelStartDate: string | null;
  country: string | null;
  description: string;
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const RANK_BADGES: { emoji: string; className: string }[] = [
  { emoji: "🥇", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { emoji: "🥈", className: "bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300" },
  { emoji: "🥉", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
];

function subscriberBadge(count: number | null): { label: string; className: string } | null {
  if (count == null) return null;
  if (count >= 1_000_000) {
    return { label: "1M+ subs", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  }
  if (count >= 100_000) {
    return { label: "100K+ subs", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  }
  return null;
}

export default function TopCreatorsPage() {
  const { t } = useLanguage();
  const [region, setRegion] = useState("US");
  const [categoryId, setCategoryId] = useState("");
  const [results, setResults] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getTopCreators() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/top-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, categoryId: categoryId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error === "YOUTUBE_API_ERROR"
            ? `YouTube API error: ${data.detail || "unknown error"}.`
            : data.error === "YOUTUBE_API_NOT_CONFIGURED"
            ? "YouTube API isn't configured yet. Ask an admin to set it up in Configuration."
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "top_creators" });
        return;
      }
      setResults(data.results);
      trackEvent("top_creators", { region, category: categoryId || "all" });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "top_creators" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("topCreators.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("topCreators.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm dark:border-yt-border dark:bg-yt-dark-2"
        >
          {TREND_REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm dark:border-yt-border dark:bg-yt-dark-2"
        >
          {TREND_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={getTopCreators}
          disabled={loading}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("topCreators.loading") : t("topCreators.getCreators")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c, i) => {
            const rank = RANK_BADGES[i];
            const subBadge = subscriberBadge(c.subscriberCount);
            return (
            <a
              key={c.channelId}
              href={`https://www.youtube.com/channel/${c.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-yt border border-gray-200 p-4 hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
            >
              <div className="flex items-center gap-3">
                {rank ? (
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${rank.className}`}>
                    {rank.emoji}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
                )}
                <ChannelAvatar src={c.thumbnail} name={c.title} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  {c.country && <p className="text-xs text-gray-400">{c.country}</p>}
                </div>
              </div>

              {subBadge && (
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${subBadge.className}`}>
                  {subBadge.label}
                </span>
              )}

              {c.description && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{c.description}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatTile icon={Users} label={t("topCreators.subscribers")} value={c.subscriberCount != null ? compactNumber.format(c.subscriberCount) : "—"} />
                <StatTile icon={Eye} label={t("topCreators.totalViews")} value={compactNumber.format(c.totalViewCount)} />
                <StatTile icon={Film} label={t("topCreators.videos")} value={String(c.videoCount)} />
                <StatTile
                  icon={CalendarDays}
                  label={t("topCreators.startDate")}
                  value={c.channelStartDate ? new Date(c.channelStartDate).toLocaleDateString() : "—"}
                />
              </div>
            </a>
            );
          })}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t("topCreators.empty")}</p>
      )}

      <p className="mt-6 text-xs text-gray-400">{t("topCreators.disclaimer")}</p>

      <AdSlot slot="1818181818" />
    </main>
  );
}
