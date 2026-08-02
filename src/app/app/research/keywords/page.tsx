"use client";

import { useEffect, useState } from "react";
import AdSlot from "@/components/AdSlot";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";
import InsightBarChart from "@/components/charts/InsightBarChart";

type Metrics = { volume: number; difficulty: number; competition: number; viabilityScore: number };
type RelatedRow = Metrics & { keyword: string };
type Workspace = { id: string; name: string };
type SerpResult = { videoId: string; title: string; channelTitle: string; thumbnail: string; publishedAt: string };

const TABS = [
  { key: "overview", label: "Keyword Overview" },
  { key: "explorer", label: "Keyword Explorer" },
  { key: "serp", label: "SERP Explorer" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function toCsv(related: RelatedRow[]): string {
  const header = "keyword,volume,difficulty,competition,viabilityScore";
  const lines = related.map(
    (r) => `"${r.keyword.replace(/"/g, '""')}",${r.volume},${r.difficulty},${r.competition},${r.viabilityScore}`
  );
  return [header, ...lines].join("\n");
}

export default function KeywordResearchPage() {
  const { t } = useLanguage();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [overview, setOverview] = useState<Metrics | null>(null);
  const [related, setRelated] = useState<RelatedRow[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serpResults, setSerpResults] = useState<SerpResult[]>([]);
  const [serpLoading, setSerpLoading] = useState(false);
  const [serpError, setSerpError] = useState<string | null>(null);
  const [serpFetchedFor, setSerpFetchedFor] = useState<string | null>(null);

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
    setSerpFetchedFor(null);
    setSerpResults([]);
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
      setFilterText("");
      trackEvent("keyword_research", { related_count: data.related.length });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "keyword_research" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSerp() {
    if (serpFetchedFor === keyword) return; // already fetched for this keyword
    setSerpLoading(true);
    setSerpError(null);
    try {
      const res = await fetch("/api/tools/serp-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "DAILY_LIMIT_REACHED"
            ? `Daily limit reached on the ${data.plan} plan. Try again tomorrow.`
            : data.error;
        setSerpError(message);
        trackError(message, { tool: "serp_explorer" });
        return;
      }
      setSerpResults(data.results);
      setSerpFetchedFor(keyword);
      trackEvent("serp_explore", { result_count: data.results.length });
    } catch {
      setSerpError("Something went wrong. Try again.");
    } finally {
      setSerpLoading(false);
    }
  }

  function selectTab(tab: TabKey) {
    setActiveTab(tab);
    if (tab === "serp" && overview) fetchSerp();
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("research.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("research.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder={t("research.placeholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
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
                onClick={() => selectTab(tab.key)}
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
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.volume")}</p>
                  <p className="text-xl font-semibold">{overview.volume}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.difficulty")}</p>
                  <p className="text-xl font-semibold">{overview.difficulty}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.competition")}</p>
                  <p className="text-xl font-semibold">{overview.competition}</p>
                </div>
                <div className="rounded-md border p-3 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("research.viability")}</p>
                  <p className="text-xl font-semibold">{overview.viabilityScore}</p>
                </div>
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
          )}

          {/* Keyword Explorer */}
          {activeTab === "explorer" && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
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
                    <th className="py-2">{t("research.volume")}</th>
                    <th className="py-2">{t("research.difficulty")}</th>
                    <th className="py-2">{t("research.viability")}</th>
                    <th className="py-2">{t("research.saveTo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRelated.map((row) => (
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
                  {visibleRelated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No related keywords match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* SERP Explorer */}
          {activeTab === "serp" && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current top-ranking videos for "{keyword}" — see what's already working.
              </p>
              {serpLoading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}
              {serpError && <p className="mt-4 text-sm text-red-600">{serpError}</p>}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {serpResults.map((r, i) => (
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
                      {r.channelTitle} · {new Date(r.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </a>
                ))}
                {!serpLoading && !serpError && serpResults.length === 0 && serpFetchedFor === keyword && (
                  <p className="text-sm text-gray-500">No results found.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <AdSlot slot="2222222222" />
    </main>
  );
}
