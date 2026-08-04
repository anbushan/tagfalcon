"use client";

import { useEffect, useState } from "react";
import { Search, Gauge, Users2, Target } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";
import InsightBarChart from "@/components/charts/InsightBarChart";
import InsightPieChart from "@/components/charts/InsightPieChart";
import StatTile from "@/components/StatTile";
import InfoTooltip from "@/components/InfoTooltip";
import AutocompleteInput from "@/components/AutocompleteInput";
import StudioPreview from "@/components/StudioPreview";

type Metrics = { volume: number; difficulty: number; competition: number; viabilityScore: number };
type RelatedRow = Metrics & { keyword: string };
type Workspace = { id: string; name: string };
type SerpResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
};

const TABS = [
  { key: "overview", label: "Keyword Overview" },
  { key: "explorer", label: "Keyword Explorer" },
  { key: "serp", label: "SERP Explorer" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const SERP_SUB_TABS = ["videos", "patterns", "channels", "titles"] as const;
type SerpSubTabKey = (typeof SERP_SUB_TABS)[number];

const STOPWORDS = new Set([
  "the", "a", "an", "to", "of", "in", "on", "for", "and", "is", "how", "you", "your",
  "this", "that", "with", "from", "at", "by", "or", "are", "it", "be", "as", "i", "my",
  "we", "our", "vs", "video", "new", "2024", "2025", "2026",
]);

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function toCsv(related: RelatedRow[]): string {
  const header = "keyword,volume,difficulty,competition,viabilityScore";
  const lines = related.map(
    (r) => `"${r.keyword.replace(/"/g, '""')}",${r.volume},${r.difficulty},${r.competition},${r.viabilityScore}`
  );
  return [header, ...lines].join("\n");
}

function channelBreakdown(serp: SerpResult[]) {
  const counts = new Map<string, number>();
  for (const v of serp) counts.set(v.channelTitle, (counts.get(v.channelTitle) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function titleWordFrequency(serp: SerpResult[]) {
  const counts = new Map<string, number>();
  for (const v of serp) {
    const words = v.title.toLowerCase().match(/[a-z0-9']+/g) || [];
    for (const w of words) {
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
}

function computePatterns(serp: SerpResult[]) {
  const n = serp.length || 1;
  const withNumber = serp.filter((v) => /\d/.test(v.title)).length;
  const withSeparator = serp.filter((v) => /[|()[\]:]/.test(v.title)).length;
  const withQuestion = serp.filter((v) => v.title.includes("?")).length;
  const avgTitleLength = serp.reduce((s, v) => s + v.title.length, 0) / n;
  const avgTagCount = serp.reduce((s, v) => s + v.tags.length, 0) / n;
  return {
    pctWithNumber: Math.round((withNumber / n) * 100),
    pctWithSeparator: Math.round((withSeparator / n) * 100),
    pctWithQuestion: Math.round((withQuestion / n) * 100),
    avgTitleLength: Math.round(avgTitleLength),
    avgTagCount: Math.round(avgTagCount * 10) / 10,
  };
}

function computeEngagement(serp: SerpResult[]) {
  const n = serp.length || 1;
  const avgViews = serp.reduce((s, v) => s + v.views, 0) / n;
  const avgLikes = serp.reduce((s, v) => s + v.likes, 0) / n;
  const avgComments = serp.reduce((s, v) => s + v.comments, 0) / n;
  const rates = serp.filter((v) => v.views > 0).map((v) => (v.likes + v.comments) / v.views);
  const avgEngagementRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
  return { avgViews, avgLikes, avgComments, avgEngagementRate };
}

function rankingLandscape(serp: SerpResult[]) {
  const uniqueChannels = new Set(serp.map((v) => v.channelTitle)).size;
  const total = serp.length || 1;
  const ratio = uniqueChannels / total;
  const label = ratio >= 0.8 ? "Wide open" : ratio >= 0.5 ? "Moderate competition" : "Dominated by a few channels";
  return { uniqueChannels, total, label };
}

export default function KeywordResearchPage() {
  const { t } = useLanguage();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [serpSubTab, setSerpSubTab] = useState<SerpSubTabKey>("videos");

  const [overview, setOverview] = useState<Metrics | null>(null);
  const [related, setRelated] = useState<RelatedRow[]>([]);
  const [serp, setSerp] = useState<SerpResult[]>([]);
  const [serpError, setSerpError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Metrics>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [explorerPage, setExplorerPage] = useState(1);
  const EXPLORER_PAGE_SIZE = 10;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [savedKeyword, setSavedKeyword] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) => setWorkspaces((d.lists || []).map((l: any) => ({ id: l.id, name: l.name }))));
  }, []);

  const SUGGESTIONS = [
    "beginner guitar lessons",
    "healthy meal prep",
    "home workout routine",
    "react tutorial",
    "travel vlog tips",
    "productivity hacks",
  ];

  async function research(overrideKeyword?: string) {
    const kw = overrideKeyword ?? keyword;
    if (overrideKeyword) setKeyword(overrideKeyword);
    setLoading(true);
    setError(null);
    setSerp([]);
    setSerpError(null);
    try {
      const res = await fetch("/api/tools/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error;
        setError(message);
        trackError(message, { tool: "keyword_research" });
        return;
      }
      setOverview(data.overview);
      setRelated(data.related);
      setSerp(data.serp || []);
      setSerpError(data.serpError || null);
      setFilterText("");
      trackEvent("keyword_research", { related_count: data.related.length });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "keyword_research" });
    } finally {
      setLoading(false);
    }
  }

  async function importToWorkspace(row: RelatedRow, workspaceId: string) {
    if (!workspaceId) return;
    await fetch(`/api/workspaces/${workspaceId}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: row.keyword, metrics: row }),
    });
    trackEvent("save_keyword_to_workspace", { keyword: row.keyword });
    setSavedKeyword(row.keyword);
    setTimeout(() => setSavedKeyword(null), 1500);
  }

  function exportCsv() {
    const csv = toCsv(visibleRelated);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${keyword || "keywords"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleRelated = related.filter((r) =>
    r.keyword.toLowerCase().includes(filterText.toLowerCase())
  );

  const sortedRelated = [...visibleRelated].sort((a, b) =>
    sortDir === "asc" ? a[sortColumn] - b[sortColumn] : b[sortColumn] - a[sortColumn]
  );
  const explorerTotalPages = Math.max(1, Math.ceil(sortedRelated.length / EXPLORER_PAGE_SIZE));
  const explorerPageClamped = Math.min(explorerPage, explorerTotalPages);
  const pagedRelated = sortedRelated.slice(
    (explorerPageClamped - 1) * EXPLORER_PAGE_SIZE,
    explorerPageClamped * EXPLORER_PAGE_SIZE
  );

  function toggleSort(column: keyof Metrics) {
    if (sortColumn === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDir("desc");
    }
    setExplorerPage(1);
  }

  const explorerStats = {
    totalKeywords: related.length,
    totalVolume: related.reduce((s, r) => s + r.volume, 0),
    avgDifficulty: related.length ? Math.round(related.reduce((s, r) => s + r.difficulty, 0) / related.length) : 0,
    avgCompetition: related.length
      ? Number((related.reduce((s, r) => s + r.competition, 0) / related.length).toFixed(2))
      : 0,
    avgViability: related.length ? Math.round(related.reduce((s, r) => s + r.viabilityScore, 0) / related.length) : 0,
  };
  const explorerChartData = [...related]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)
    .map((r) => ({ name: r.keyword.length > 14 ? `${r.keyword.slice(0, 14)}…` : r.keyword, value: r.volume }));
  const explorerChannelPie = channelBreakdown(serp)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const topRelatedByVolume = [...related].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const contentIdeas = [...related].sort((a, b) => b.viabilityScore - a.viabilityScore).slice(0, 3);
  const engagement = computeEngagement(serp);
  const landscape = rankingLandscape(serp);
  const channels = channelBreakdown(serp);
  const wordFreq = titleWordFrequency(serp);
  const patterns = computePatterns(serp);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("research.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("research.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <AutocompleteInput
          type="keyword"
          placeholder={t("research.placeholder")}
          value={keyword}
          onChange={setKeyword}
          onPick={(v) => research(v)}
          onEnter={() => keyword.length >= 2 && research()}
        />
        <button
          onClick={() => research()}
          disabled={loading || keyword.length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("research.researching") : t("research.research")}
        </button>
      </div>

      {!overview && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400">Try one of these:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => research(s)}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-yt-border dark:text-gray-400 dark:hover:bg-yt-dark-2"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {overview && (
        <>
          <div className="mt-6 flex gap-1 border-b dark:border-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  activeTab === tab.key
                    ? "border-gray-900 font-medium dark:border-blue-500"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Keyword Overview */}
          {activeTab === "overview" && (
            <div className="mt-6 space-y-6">
              <div>
                <div className="grid grid-cols-4 gap-4">
                  <StatTile
                    icon={Search}
                    label={t("research.volume")}
                    value={overview.volume}
                    tooltip="Rough estimate of how often people search this keyword, based on search breadth signals — not exact YouTube search volume."
                  />
                  <StatTile
                    icon={Gauge}
                    label={t("research.difficulty")}
                    value={overview.difficulty}
                    tone={overview.difficulty >= 70 ? "bad" : overview.difficulty >= 40 ? "warn" : "good"}
                    tooltip="How hard it'd be to rank for this keyword — higher means more competition from established channels."
                  />
                  <StatTile
                    icon={Users2}
                    label={t("research.competition")}
                    value={overview.competition}
                    tooltip="How concentrated the top results are among a few channels vs. spread across many."
                  />
                  <StatTile
                    icon={Target}
                    label={t("research.viability")}
                    value={overview.viabilityScore}
                    tone={overview.viabilityScore >= 70 ? "good" : overview.viabilityScore >= 40 ? "warn" : "bad"}
                    tooltip="A combined score balancing search volume against difficulty — higher means a better opportunity for a new video."
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Metrics are estimates derived from search breadth, not exact YouTube analytics.
                </p>
                <div className="mt-4 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
                  <InsightBarChart
                    data={[
                      { name: t("research.volume"), value: overview.volume },
                      { name: t("research.difficulty"), value: overview.difficulty },
                      { name: t("research.viability"), value: overview.viabilityScore },
                    ]}
                    colorByIndex={["#9CA3AF", "#FF0000", "#111827"]}
                    height={200}
                  />
                </div>
              </div>

              {serp.length > 0 && (
                <>
                  <section>
                    <h2 className="text-sm font-semibold">{t("research.engagementSnapshot")}</h2>
                    <p className="text-xs text-gray-400">{t("research.engagementSnapshotNote")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-md border p-3 text-center dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.avgViews")}</p>
                        <p className="text-lg font-semibold">{compactNumber.format(engagement.avgViews)}</p>
                      </div>
                      <div className="rounded-md border p-3 text-center dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.avgLikes")}</p>
                        <p className="text-lg font-semibold">{compactNumber.format(engagement.avgLikes)}</p>
                      </div>
                      <div className="rounded-md border p-3 text-center dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.avgEngagementRate")}</p>
                        <p className="text-lg font-semibold">{(engagement.avgEngagementRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-sm font-semibold">{t("research.rankingLandscape")}</h2>
                    <div className="mt-2 rounded-md border p-3 dark:border-gray-700">
                      <p className="text-lg font-semibold">
                        {landscape.uniqueChannels} / {landscape.total} {t("research.uniqueChannels")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{landscape.label}</p>
                    </div>
                  </section>
                </>
              )}

              {topRelatedByVolume.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold">{t("research.topRelatedKeywords")}</h2>
                  <div className="mt-2 divide-y rounded-md border text-sm dark:divide-gray-800 dark:border-gray-700">
                    {topRelatedByVolume.map((r) => (
                      <div key={r.keyword} className="flex items-center justify-between px-3 py-2">
                        <span>{r.keyword}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("research.volume")} {r.volume}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {serp.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold">{t("research.topRankingVideos")}</h2>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {serp.slice(0, 3).map((v, i) => (
                      <a
                        key={v.videoId}
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <div className="yt-thumb-wrap relative aspect-video w-full overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3">
                          {v.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                          )}
                          <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            #{i + 1}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug group-hover:text-yt-red">
                          {v.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{v.channelTitle}</p>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {contentIdeas.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold">{t("research.contentIdeasPreview")}</h2>
                  <p className="text-xs text-gray-400">{t("research.contentIdeasNote")}</p>
                  <div className="mt-2 space-y-2">
                    {contentIdeas.map((idea) => (
                      <div key={idea.keyword} className="rounded-md border p-3 text-sm dark:border-gray-700">
                        <p className="font-medium">💡 {idea.keyword}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t("research.viability")} {idea.viabilityScore} · {t("research.volume")} {idea.volume} ·{" "}
                          {t("research.difficulty")} {idea.difficulty}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <StudioPreview
                highlight={["title", "description"]}
                sampleTitle={keyword}
                sampleDescription={
                  topRelatedByVolume.length > 0
                    ? `${keyword} — a closer look.\n\nAlso covering: ${topRelatedByVolume.map((r) => r.keyword).join(", ")}`
                    : undefined
                }
                note="Work your keyword and its top related terms naturally into the title and the first couple lines of the description — that's what YouTube actually reads for relevance."
              />
            </div>
          )}

          {/* Keyword Explorer */}
          {activeTab === "explorer" && (
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.totalKeywords")}</p>
                  <p className="text-lg font-semibold">{explorerStats.totalKeywords}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.totalVolume")}</p>
                  <p className="text-lg font-semibold">{compactNumber.format(explorerStats.totalVolume)}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.difficulty")}</p>
                  <p className="text-lg font-semibold">{explorerStats.avgDifficulty}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.competition")}</p>
                  <p className="text-lg font-semibold">{explorerStats.avgCompetition}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.viability")}</p>
                  <p className="text-lg font-semibold">{explorerStats.avgViability}</p>
                </div>
              </div>

              {explorerChartData.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border lg:col-span-2">
                    <p className="text-sm font-medium">{t("research.volumeByKeyword")}</p>
                    <InsightBarChart data={explorerChartData} height={220} />
                  </div>
                  {explorerChannelPie.length > 0 && (
                    <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border">
                      <p className="text-sm font-medium">{t("research.channelShare")}</p>
                      <InsightPieChart data={explorerChannelPie} height={220} />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <input
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setExplorerPage(1);
                  }}
                  placeholder="Filter related keywords..."
                  className="w-64 rounded-md border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
                <button onClick={exportCsv} className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                  {t("research.exportCsv")}
                </button>
              </div>

              <div className="overflow-x-auto">
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="py-2">{t("research.relatedKeywords")}</th>
                    {(["volume", "difficulty", "viabilityScore"] as const).map((col) => (
                      <th key={col} className="py-2">
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200">
                            {t(`research.${col === "viabilityScore" ? "viability" : col}`)}
                            {sortColumn === col && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                          </button>
                          {col === "viabilityScore" && (
                            <InfoTooltip text="Balances search volume against difficulty — higher means a better opportunity for a new video." />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="py-2">{t("research.saveTo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRelated.map((row) => (
                    <tr key={row.keyword} className="border-b dark:border-gray-800">
                      <td className="py-2">{row.keyword}</td>
                      <td className="py-2">{row.volume}</td>
                      <td className="py-2">{row.difficulty}</td>
                      <td className="py-2">{row.viabilityScore}</td>
                      <td className="py-2">
                        <select
                          defaultValue=""
                          disabled={workspaces.length === 0}
                          onChange={(e) => importToWorkspace(row, e.target.value)}
                          className="rounded-md border px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        >
                          <option value="" disabled>
                            {workspaces.length === 0 ? "No workspaces" : "Choose..."}
                          </option>
                          {workspaces.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                        {savedKeyword === row.keyword && (
                          <span className="ml-2 text-xs text-green-600">Saved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagedRelated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No related keywords match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

              {explorerTotalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-gray-500">
                    Page {explorerPageClamped} of {explorerTotalPages} · {sortedRelated.length} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExplorerPage((p) => Math.max(1, p - 1))}
                      disabled={explorerPageClamped <= 1}
                      className="rounded-md border px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setExplorerPage((p) => Math.min(explorerTotalPages, p + 1))}
                      disabled={explorerPageClamped >= explorerTotalPages}
                      className="rounded-md border px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SERP Explorer */}
          {activeTab === "serp" && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current top-ranking videos for "{keyword}" — see what's already working.
              </p>

              <div className="mt-4 flex gap-1 border-b dark:border-gray-800">
                {SERP_SUB_TABS.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSerpSubTab(sub)}
                    className={`-mb-px border-b-2 px-3 py-1.5 text-xs ${
                      serpSubTab === sub
                        ? "border-gray-900 font-medium dark:border-blue-500"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {t(`research.serpTabs.${sub}`)}
                  </button>
                ))}
              </div>

              {serp.length === 0 && serpError && (
                <p className="mt-4 text-sm text-red-600">Couldn't load ranking videos: {serpError}</p>
              )}
              {serp.length === 0 && !serpError && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No results found.</p>
              )}

              {serp.length > 0 && serpSubTab === "videos" && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serp.map((r, i) => (
                    <a
                      key={r.videoId}
                      href={`https://www.youtube.com/watch?v=${r.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="yt-thumb-wrap relative aspect-video w-full overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3">
                        {r.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          #{i + 1}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-yt-red">
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {r.channelTitle} · {compactNumber.format(r.views)} views ·{" "}
                        {new Date(r.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </a>
                  ))}
                </div>
              )}

              {serp.length > 0 && serpSubTab === "titles" && (
                <div className="mt-4">
                  <p className="text-sm font-medium">{t("research.commonWords")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {wordFreq.map(([word, count]) => (
                      <span key={word} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-yt-dark-3">
                        {word} × {count}
                      </span>
                    ))}
                    {wordFreq.length === 0 && (
                      <p className="text-xs text-gray-400">No repeated words across these titles.</p>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {serp.map((r, i) => (
                      <div key={r.videoId} className="rounded-md border p-3 text-sm dark:border-gray-700">
                        <p>#{i + 1} {r.title}</p>
                        <p className="mt-1 text-xs text-gray-400">{r.title.length} characters</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serp.length > 0 && serpSubTab === "channels" && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {landscape.uniqueChannels} unique channels out of {landscape.total} results — {landscape.label}.
                  </p>
                  <div className="mt-2 divide-y rounded-md border text-sm dark:divide-gray-800 dark:border-gray-700">
                    {channels.map(([channelTitle, count]) => (
                      <div key={channelTitle} className="flex items-center justify-between px-3 py-2">
                        <span>{channelTitle}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{count} video{count > 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serp.length > 0 && serpSubTab === "patterns" && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3 text-center dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.pctWithNumber")}</p>
                    <p className="text-lg font-semibold">{patterns.pctWithNumber}%</p>
                  </div>
                  <div className="rounded-md border p-3 text-center dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.pctWithSeparator")}</p>
                    <p className="text-lg font-semibold">{patterns.pctWithSeparator}%</p>
                  </div>
                  <div className="rounded-md border p-3 text-center dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.pctWithQuestion")}</p>
                    <p className="text-lg font-semibold">{patterns.pctWithQuestion}%</p>
                  </div>
                  <div className="rounded-md border p-3 text-center dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.avgTitleLength")}</p>
                    <p className="text-lg font-semibold">{patterns.avgTitleLength}</p>
                  </div>
                  <div className="rounded-md border p-3 text-center dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.avgTagCount")}</p>
                    <p className="text-lg font-semibold">{patterns.avgTagCount}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AdSlot slot="2222222222" />
    </main>
  );
}
