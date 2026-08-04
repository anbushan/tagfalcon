"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import InfoTooltip from "@/components/InfoTooltip";
import ChannelAvatar from "@/components/ChannelAvatar";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";
import { TREND_REGIONS, TREND_CATEGORIES, TREND_LANGUAGES, REGION_LANGUAGES } from "@/lib/trends-constants";

type TrendingVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  channelSubscriberCount: number | null;
  thumbnail: string | null;
  views: number;
  likes: number;
  publishedAt: string;
  viewsPerDay: number;
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export default function TrendsResearchPage() {
  const { t } = useLanguage();
  const [region, setRegion] = useState("US");
  const [categoryId, setCategoryId] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getTrends() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/trends-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, categoryId: categoryId || undefined, language: language || undefined }),
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
        trackError(message, { tool: "trends_research" });
        return;
      }
      setResults(data.results);
      trackEvent("trends_research", { region, category: categoryId || "all", language: language || "any" });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "trends_research" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Flame size={22} className="text-yt-red" />
        {t("trends.title")}
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("trends.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <select
          value={region}
          onChange={(e) => {
            const nextRegion = e.target.value;
            setRegion(nextRegion);
            const allowed = REGION_LANGUAGES[nextRegion] ?? [];
            if (language && !allowed.includes(language)) setLanguage("");
          }}
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
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm dark:border-yt-border dark:bg-yt-dark-2"
        >
          {TREND_LANGUAGES.filter((l) => l.code === "" || (REGION_LANGUAGES[region] ?? []).includes(l.code)).map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={getTrends}
          disabled={loading}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("trends.loading") : t("trends.getTrends")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {language && (
        <p className="mt-3 text-xs text-gray-400">{t("trends.languageNote")}</p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((v, i) => (
            <a
              key={v.videoId}
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 rounded-yt border border-gray-200 p-3 hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
            >
              <div className="relative yt-thumb-wrap aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3 sm:w-40">
                {v.thumbnail && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  #{i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <ChannelAvatar src={v.channelThumbnail} name={v.channelTitle} size={16} />
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {v.channelTitle}
                    {v.channelSubscriberCount != null && ` · ${compactNumber.format(v.channelSubscriberCount)} subs`}
                  </p>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  {compactNumber.format(v.views)} {t("trends.views")} · {compactNumber.format(v.viewsPerDay)}{" "}
                  {t("trends.viewsPerDay")}
                  <InfoTooltip text="Total views divided by days since upload — a rough measure of how fast this video is currently gaining momentum." />
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t("trends.empty")}</p>
      )}

      <p className="mt-6 text-xs text-gray-400">{t("trends.disclaimer")}</p>

      <AdSlot slot="9999999999" />
    </main>
  );
}
