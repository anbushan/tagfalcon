"use client";

import { useState } from "react";
import AdSlot from "@/components/AdSlot";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

export default function TagGeneratorPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUGGESTIONS = [
    "how to edit videos on iphone",
    "beginner guitar lessons",
    "home workout routine",
    "react tutorial for beginners",
    "healthy meal prep ideas",
    "travel vlog tips",
  ];

  async function generateTags(overrideQuery?: string) {
    const q = overrideQuery ?? query;
    if (overrideQuery) setQuery(overrideQuery);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/tag-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, source: "youtube" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error;
        setError(message);
        trackError(message, { tool: "tag_generator" });
        return;
      }
      setTags(data.tags);
      trackEvent("generate_tags", { tag_count: data.tags.length });
    } catch (e) {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "tag_generator" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("generator.title")}</h1>
      <p className="mt-1 text-sm text-gray-600">{t("generator.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder={t("generator.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => generateTags()}
          disabled={loading || query.length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("generator.generating") : t("generator.generate")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {tags.length === 0 && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400">Try one of these:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => generateTags(s)}
                className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-red-50 px-3 py-1 text-sm text-yt-red dark:bg-red-950 dark:text-red-300">
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(tags.join(", "))}
            className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {t("generator.copyAll")}
          </button>
        </div>
      )}

      <AdSlot slot="1111111111" />
    </main>
  );
}
