"use client";

import { useState } from "react";
import { Users, Clock, Heart, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Info, Target, Wrench, ChevronDown, CalendarClock, DollarSign } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import InsightBarChart from "@/components/charts/InsightBarChart";
import StatTile from "@/components/StatTile";
import ScoreGauge from "@/components/ScoreGauge";
import InfoTooltip from "@/components/InfoTooltip";
import AutocompleteInput from "@/components/AutocompleteInput";
import ChannelAvatar from "@/components/ChannelAvatar";
import { trackEvent, trackError } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";

type FindingImpact = "high" | "medium" | "low" | "info";
type Finding = {
  key: string;
  label: string;
  passed: boolean;
  message: string;
  impact: FindingImpact;
  goodMessage?: string;
  mistake?: string;
  fix?: string;
};
type AuditVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
};
type UploadGap = { label: string; days: number };
type DayBucket = { day: string; avgViews: number; count: number };
type TimeBucket = { bucket: string; avgViews: number; count: number };
type PostingTime = {
  bestDay: string | null;
  bestBucket: string | null;
  dayBreakdown: DayBucket[];
  timeBreakdown: TimeBucket[];
  summary: string | null;
};
type FocusArea = { key: string; label: string; mistake: string; fix: string };
type MonetizationInfo = { meetsSubscriberThreshold: boolean | null; subscribersToGo: number | null; guidance: string[] };

type AuditResult = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgUploadGapDays: number | null;
  gapConsistency: number | null;
  uploadGaps: UploadGap[];
  engagementRate: number;
  viewsTrend: "growing" | "declining" | "steady" | "unknown";
  score: number;
  findings: Finding[];
  focusArea: FocusArea | null;
  monetization: MonetizationInfo;
  postingTime: PostingTime;
  recentVideos: AuditVideo[];
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const SUGGESTIONS = ["https://www.youtube.com/@MrBeast", "@mkbhd", "@veritasium"];

const DAY_FULL: Record<string, string> = {
  Sun: "Sun", Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat",
};

export default function ChannelAuditPage() {
  const { t } = useLanguage();
  const [channelUrl, setChannelUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  async function analyze(override?: string) {
    const target = override ?? channelUrl;
    if (override) setChannelUrl(override);
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedKey(null);
    try {
      const res = await fetch("/api/tools/channel-audit", {
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
        trackError(message, { tool: "channel_audit" });
        return;
      }
      setResult(data);
      trackEvent("channel_audit", { channel_id: data.channelId, score: data.score });
    } catch {
      setError("Something went wrong. Try again.");
      trackError("network_error", { tool: "channel_audit" });
    } finally {
      setLoading(false);
    }
  }

  function renderDetail(item: Finding, r: AuditResult) {
    switch (item.key) {
      case "upload_frequency":
        return r.uploadGaps.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("audit.daysBetweenUploads")}</p>
            <InsightBarChart data={r.uploadGaps.map((g) => ({ name: g.label, value: g.days }))} height={180} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not enough recent uploads to chart yet.</p>
        );
      case "upload_consistency":
        return (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("audit.avgGap")}</p>
              <p className="font-semibold">{r.avgUploadGapDays != null ? `${r.avgUploadGapDays.toFixed(1)}d` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("audit.variability")}</p>
              <p className="font-semibold">
                {r.gapConsistency != null
                  ? r.gapConsistency < 0.3
                    ? t("audit.variabilityLow")
                    : r.gapConsistency < 0.6
                    ? t("audit.variabilityMedium")
                    : t("audit.variabilityHigh")
                  : "—"}
              </p>
            </div>
          </div>
        );
      case "engagement":
        return r.recentVideos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:border-yt-border dark:text-gray-400">
                  <th className="py-1.5 pr-2">Video</th>
                  <th className="py-1.5 pr-2">Views</th>
                  <th className="py-1.5 pr-2">Likes</th>
                  <th className="py-1.5 pr-2">Comments</th>
                  <th className="py-1.5">Rate</th>
                </tr>
              </thead>
              <tbody>
                {r.recentVideos.map((v) => (
                  <tr key={v.videoId} className="border-b dark:border-yt-border">
                    <td className="max-w-[200px] truncate py-1.5 pr-2">{v.title}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.views)}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.likes)}</td>
                    <td className="py-1.5 pr-2">{compactNumber.format(v.comments)}</td>
                    <td className="py-1.5">{v.views > 0 ? (((v.likes + v.comments) / v.views) * 100).toFixed(1) : "0.0"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No recent videos to break down.</p>
        );
      case "views_trend": {
        const chronological = [...r.recentVideos].reverse();
        return chronological.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("audit.viewsOverTime")}</p>
            <InsightBarChart
              data={chronological.map((v) => ({
                name: v.title.length > 16 ? `${v.title.slice(0, 16)}…` : v.title,
                value: v.views,
              }))}
              height={180}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not enough recent uploads to chart yet.</p>
        );
      }
      default:
        return null;
    }
  }

  function findingIcon(item: Finding) {
    if (item.passed) return { Icon: CheckCircle2, bg: "bg-green-500" };
    if (item.impact === "info") return { Icon: Info, bg: "bg-gray-400" };
    return { Icon: AlertTriangle, bg: "bg-amber-500" };
  }

  const trendIcon = result
    ? result.viewsTrend === "growing"
      ? TrendingUp
      : result.viewsTrend === "declining"
      ? TrendingDown
      : Minus
    : Minus;
  const trendTone: "good" | "warn" | "bad" | "neutral" =
    result?.viewsTrend === "growing" ? "good" : result?.viewsTrend === "declining" ? "bad" : "neutral";
  const freqFinding = result?.findings.find((f) => f.key === "upload_frequency");
  const engagementFinding = result?.findings.find((f) => f.key === "engagement");

  const pt = result?.postingTime;
  const dayColors = pt?.dayBreakdown.map((d) => (d.day === pt.bestDay ? "#16a34a" : "#9ca3af"));
  const timeColors = pt?.timeBreakdown.map((b) => (b.bucket === pt.bestBucket ? "#16a34a" : "#9ca3af"));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("audit.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <AutocompleteInput
          type="channel"
          placeholder="https://www.youtube.com/@channelname"
          value={channelUrl}
          onChange={setChannelUrl}
          onPick={(v) => analyze(v)}
          onEnter={() => channelUrl.trim().length >= 2 && analyze()}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || channelUrl.trim().length < 2}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {loading ? t("audit.analyzing") : t("audit.analyze")}
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
            <ChannelAvatar src={result.channelThumbnail} name={result.channelTitle} size={64} />
            <p className="min-w-0 flex-1 truncate text-lg font-semibold">{result.channelTitle}</p>
            <div className="shrink-0 text-center">
              <ScoreGauge score={result.score} />
              <p className="mt-1 text-xs text-gray-400">{t("audit.score")}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Users} label={t("audit.subscribers")} value={result.subscriberCount != null ? compactNumber.format(result.subscriberCount) : "—"} />
            <StatTile
              icon={Clock}
              label={t("audit.uploadGap")}
              value={result.avgUploadGapDays != null ? `${result.avgUploadGapDays.toFixed(1)}d` : "—"}
              tone={freqFinding?.passed ? "good" : "warn"}
              tooltip="Average number of days between your most recent uploads. Shorter, regular gaps tend to help the algorithm keep recommending you."
            />
            <StatTile
              icon={Heart}
              label={t("audit.engagement")}
              value={`${(result.engagementRate * 100).toFixed(1)}%`}
              tone={engagementFinding?.passed ? "good" : "warn"}
              tooltip="Share of views that turn into a like or comment. ~2% is a rough healthy benchmark."
            />
            <StatTile
              icon={trendIcon}
              label={t("audit.trend")}
              value={t(`audit.trend_${result.viewsTrend}`)}
              tone={trendTone}
              tooltip="Whether your most recent uploads are getting more or fewer views than your older ones."
            />
          </div>

          {result.focusArea && (
            <div className="mt-4 flex gap-3 rounded-yt border-l-4 border-yt-red bg-red-50 p-4 dark:bg-red-950/20">
              <Target size={20} className="mt-0.5 shrink-0 text-yt-red" />
              <div>
                <p className="text-sm font-semibold text-yt-red">{t("audit.focusTitle")}: {result.focusArea.label}</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{result.focusArea.mistake}</p>
                <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Wrench size={15} className="mt-0.5 shrink-0" />
                  {result.focusArea.fix}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-yt border border-gray-200 p-4 dark:border-yt-border">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <DollarSign size={16} className={result.monetization.meetsSubscriberThreshold ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"} />
              {t("audit.monetizationTitle")}
            </p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {result.monetization.meetsSubscriberThreshold === true
                ? t("audit.monetizationEligible")
                : result.monetization.meetsSubscriberThreshold === false
                ? t("audit.monetizationNotEligible")
                : t("audit.monetizationUnknown")}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              {result.monetization.guidance.map((line, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-sm font-medium">{t("audit.mistakesWins")}</p>
          <div className="mt-2 space-y-2">
            {result.findings.map((item) => {
              const isOpen = expandedKey === item.key;
              const { Icon, bg } = findingIcon(item);
              return (
                <div key={item.key} className="rounded-yt border border-gray-200 dark:border-yt-border">
                  <button
                    onClick={() => setExpandedKey(isOpen ? null : item.key)}
                    className="flex w-full items-center gap-2 p-3 text-left text-sm"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${bg}`}>
                      <Icon size={12} />
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className="px-3 pb-3 pl-10 text-xs text-gray-500 dark:text-gray-400">
                    <p>{item.passed ? item.goodMessage || item.message : item.mistake || item.message}</p>
                    {!item.passed && item.fix && (
                      <p className="mt-1.5 flex items-start gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <Wrench size={12} className="mt-0.5 shrink-0" />
                        <span>{t("audit.howToFix")}: {item.fix}</span>
                      </p>
                    )}
                  </div>
                  {isOpen && (
                    <div className="border-t border-gray-100 p-3 pl-10 dark:border-yt-border">{renderDetail(item, result)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {pt && (pt.bestDay || pt.bestBucket) && (
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock size={16} className="text-gray-400" />
                {t("audit.bestTime")}
                <InfoTooltip text="Based on which of your recent uploads' publish day/time got the most views. A small sample can make one video skew a bucket, so treat this as a starting point, not a guarantee." />
              </p>
              {pt.summary && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{pt.summary}</p>}
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t("audit.bestTimeByDay")}</p>
                  <InsightBarChart
                    data={pt.dayBreakdown.map((d) => ({ name: DAY_FULL[d.day] || d.day, value: d.avgViews }))}
                    height={160}
                    colorByIndex={dayColors}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t("audit.bestTimeByHour")}</p>
                  <InsightBarChart
                    data={pt.timeBreakdown.map((b) => ({ name: b.bucket.replace(/\s*\(.*\)/, ""), value: b.avgViews }))}
                    height={160}
                    colorByIndex={timeColors}
                  />
                </div>
              </div>
            </div>
          )}
          {pt && !pt.bestDay && !pt.bestBucket && (
            <p className="mt-5 text-sm text-gray-400">{t("audit.bestTimeUnknown")}</p>
          )}

          {result.recentVideos.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium">{t("audit.recentVideos")}</p>
              <div className="mt-2 space-y-2">
                {result.recentVideos.map((v) => (
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
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {compactNumber.format(v.views)} views
                        {v.publishedAt && ` · ${new Date(v.publishedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">{t("audit.disclaimer")}</p>
        </div>
      )}

      <AdSlot slot="1212121212" />
    </main>
  );
}
