"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_RECOMMENDED = 15;

const SUGGESTIONS = [
  "how to edit videos on iphone",
  "beginner guitar lessons",
  "home workout routine",
  "react tutorial for beginners",
  "healthy meal prep ideas",
];

export default function HashtagGeneratorPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(overrideQuery?: string) {
    const q = overrideQuery ?? query;
    if (overrideQuery) setQuery(overrideQuery);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/hashtag-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : "Something went wrong. Try again.";
        setError(message);
        trackError(message, { tool: "hashtag_generator" });
        return;
      }
      setHashtags(data.hashtags);
      trackEvent("generate_hashtags", { count: data.hashtags.length });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "hashtag_generator" });
    } finally {
      setLoading(false);
    }
  }

  const recommended = hashtags.slice(0, MAX_RECOMMENDED);
  const extra = hashtags.slice(MAX_RECOMMENDED);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("hashtags.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("hashtags.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder={t("hashtags.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && query.length >= 2 && generate()}
        />
        <button
          onClick={() => generate()}
          disabled={loading || query.length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("hashtags.generating") : t("hashtags.generate")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {hashtags.length === 0 && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400">Try one of these:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => generate(s)}
                className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-yt-border dark:text-gray-400 dark:hover:bg-yt-dark-3"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium">{t("hashtags.recommended")}</p>
          <p className="text-xs text-gray-400">{t("hashtags.recommendedNote")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recommended.map((tag) => (
              <span key={tag} className="rounded-full bg-red-50 px-3 py-1 text-sm text-yt-red dark:bg-red-950 dark:text-red-300">
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(recommended.join(" "))}
            className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-3"
          >
            {t("hashtags.copyAll")}
          </button>

          {extra.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">{t("hashtags.extra")}</p>
              <p className="text-xs text-gray-400">{t("hashtags.extraNote")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {extra.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500 dark:bg-yt-dark-3 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AdSlot slot="8888888888" />
    </main>
  );
}
