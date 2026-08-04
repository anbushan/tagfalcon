import { fetchChannelWithRecentVideos, type ChannelVideo } from "@/lib/channel-videos";

const MS_PER_DAY = 86_400_000;
const SAMPLE_SIZE = 20;

type ApiError = { apiError: string };
type NotFound = { notFound: true };

export type AuditVideo = ChannelVideo;
export type UploadGap = { label: string; days: number };

export type FindingImpact = "high" | "medium" | "low" | "info";

export type AuditFinding = {
  key: string;
  label: string;
  passed: boolean;
  message: string;
  impact: FindingImpact;
  /** Plain-language "what's working" copy, set when passed. */
  goodMessage?: string;
  /** Plain-language "what went wrong" copy, set when failed and actionable. */
  mistake?: string;
  /** Concrete next action, set when failed and actionable (views_trend is informational only). */
  fix?: string;
};

export type FocusArea = { key: string; label: string; mistake: string; fix: string };

export type MonetizationInfo = {
  /** null when the subscriber count is hidden, so eligibility can't be judged at all. */
  meetsSubscriberThreshold: boolean | null;
  subscribersToGo: number | null;
  guidance: string[];
};

const YPP_SUBSCRIBER_THRESHOLD = 1000;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL: Record<string, string> = {
  Sun: "Sundays", Mon: "Mondays", Tue: "Tuesdays", Wed: "Wednesdays",
  Thu: "Thursdays", Fri: "Fridays", Sat: "Saturdays",
};
const TIME_BUCKETS = [
  { name: "Night (12–6am UTC)", start: 0, end: 6 },
  { name: "Morning (6am–12pm UTC)", start: 6, end: 12 },
  { name: "Afternoon (12–6pm UTC)", start: 12, end: 18 },
  { name: "Evening (6pm–12am UTC)", start: 18, end: 24 },
];

export type DayBucket = { day: string; avgViews: number; count: number };
export type TimeBucket = { bucket: string; avgViews: number; count: number };

export type PostingTime = {
  bestDay: string | null;
  bestBucket: string | null;
  dayBreakdown: DayBucket[];
  timeBreakdown: TimeBucket[];
  summary: string | null;
};

export type ChannelAuditData = {
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
  findings: AuditFinding[];
  focusArea: FocusArea | null;
  monetization: MonetizationInfo;
  postingTime: PostingTime;
  recentVideos: AuditVideo[];
};

// Failed findings ranked by how much they typically move growth; ties broken
// by this same left-to-right order. views_trend is deliberately excluded —
// it's a symptom of the other three, not something to "fix" on its own.
const IMPACT_RANK: Record<string, number> = { upload_frequency: 3, engagement: 3, upload_consistency: 2, views_trend: 0 };
const PRIORITY_ORDER = ["upload_frequency", "engagement", "upload_consistency", "views_trend"];

export async function fetchChannelAuditData(
  channelId: string,
  apiKey: string
): Promise<ChannelAuditData | ApiError | NotFound> {
  const result = await fetchChannelWithRecentVideos(channelId, apiKey, SAMPLE_SIZE);
  if ("apiError" in result) return result;
  if ("notFound" in result) return result;

  const recentVideos = result.videos;

  // Oldest-to-newest for gap/trend/posting-time math.
  const chronological = [...recentVideos]
    .filter((v) => v.publishedAt)
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  const uploadGaps: UploadGap[] = [];
  for (let i = 1; i < chronological.length; i++) {
    const days =
      (new Date(chronological[i].publishedAt).getTime() - new Date(chronological[i - 1].publishedAt).getTime()) /
      MS_PER_DAY;
    const title = chronological[i].title;
    uploadGaps.push({ label: title.length > 20 ? `${title.slice(0, 20)}…` : title, days: Math.round(days * 10) / 10 });
  }

  let avgUploadGapDays: number | null = null;
  if (uploadGaps.length > 0) {
    avgUploadGapDays = uploadGaps.reduce((sum, g) => sum + g.days, 0) / uploadGaps.length;
  }

  let gapConsistency: number | null = null;
  if (uploadGaps.length >= 2) {
    const mean = avgUploadGapDays!;
    const variance = uploadGaps.reduce((s, g) => s + (g.days - mean) ** 2, 0) / uploadGaps.length;
    const stdDev = Math.sqrt(variance);
    gapConsistency = mean > 0 ? stdDev / mean : null;
  }
  const gapMin = uploadGaps.length > 0 ? Math.min(...uploadGaps.map((g) => g.days)) : null;
  const gapMax = uploadGaps.length > 0 ? Math.max(...uploadGaps.map((g) => g.days)) : null;

  const totalViews = recentVideos.reduce((sum, v) => sum + v.views, 0);
  const totalLikesComments = recentVideos.reduce((sum, v) => sum + v.likes + v.comments, 0);
  const engagementRate = totalViews > 0 ? totalLikesComments / totalViews : 0;

  let viewsTrend: ChannelAuditData["viewsTrend"] = "unknown";
  if (chronological.length >= 4) {
    const mid = Math.floor(chronological.length / 2);
    const olderAvg = chronological.slice(0, mid).reduce((s, v) => s + v.views, 0) / mid;
    const newerAvg = chronological.slice(mid).reduce((s, v) => s + v.views, 0) / (chronological.length - mid);
    if (newerAvg > olderAvg * 1.15) viewsTrend = "growing";
    else if (newerAvg < olderAvg * 0.85) viewsTrend = "declining";
    else viewsTrend = "steady";
  }

  const findings: AuditFinding[] = [];

  const freqPassed = avgUploadGapDays != null && avgUploadGapDays <= 14;
  findings.push({
    key: "upload_frequency",
    label: "Upload frequency",
    passed: freqPassed,
    impact: "high",
    message:
      avgUploadGapDays == null
        ? "Not enough recent uploads to measure a posting cadence yet."
        : `Uploading roughly every ${avgUploadGapDays.toFixed(1)} days — ${
            freqPassed ? "a solid, active cadence." : "less than biweekly; more frequent uploads tend to compound growth."
          }`,
    goodMessage:
      avgUploadGapDays != null
        ? `You're uploading roughly every ${avgUploadGapDays.toFixed(1)} days — frequent enough to stay in the habit-forming zone for subscribers.`
        : undefined,
    mistake:
      avgUploadGapDays != null
        ? `You're going about ${avgUploadGapDays.toFixed(1)} days between uploads. Long gaps make it harder for YouTube to keep recommending you, and viewers forget to check back.`
        : undefined,
    fix: "Aim to publish at least every 1–2 weeks — a lower-effort video on a regular day beats a long gap.",
  });

  const consistencyPassed = gapConsistency != null && gapConsistency < 0.6;
  findings.push({
    key: "upload_consistency",
    label: "Upload consistency",
    passed: consistencyPassed,
    impact: "medium",
    message:
      gapConsistency == null
        ? "Not enough recent uploads to judge consistency yet."
        : consistencyPassed
        ? "Upload schedule is fairly regular — that helps subscribers know when to expect new content."
        : "Upload gaps vary a lot — a more predictable schedule tends to build stronger viewer habits.",
    goodMessage:
      gapConsistency != null
        ? "Your upload schedule is fairly predictable — that helps build a habit with your audience."
        : undefined,
    mistake:
      gapMin != null && gapMax != null
        ? `Your gaps between uploads swing from ${gapMin.toFixed(0)} to ${gapMax.toFixed(0)} days instead of following a rhythm, so subscribers can't predict when to expect your next video.`
        : undefined,
    fix: "Pick a repeatable schedule (e.g. \"every Tuesday\") and stick to it, even if that means fewer uploads overall.",
  });

  const engagementPassed = engagementRate >= 0.02;
  findings.push({
    key: "engagement",
    label: "Engagement rate",
    passed: engagementPassed,
    impact: "high",
    message:
      totalViews === 0
        ? "Not enough views yet to judge engagement."
        : `${(engagementRate * 100).toFixed(1)}% of views turn into a like or comment — ${
            engagementPassed ? "healthy engagement." : "below the ~2% rough benchmark; stronger CTAs might help."
          }`,
    goodMessage:
      totalViews > 0
        ? `${(engagementRate * 100).toFixed(1)}% of views turn into a like or comment — healthy engagement that helps the algorithm trust your content.`
        : undefined,
    mistake:
      totalViews > 0
        ? `Only ${(engagementRate * 100).toFixed(1)}% of viewers like or comment, below the ~2% rough benchmark — that's a signal YouTube uses when deciding who to recommend your videos to.`
        : undefined,
    fix: "Ask a direct question in the video and pin a comment, and make sure your first 15 seconds earn a like-worthy hook.",
  });

  const trendPassed = viewsTrend === "growing" || viewsTrend === "steady";
  findings.push({
    key: "views_trend",
    label: "Views trend",
    passed: trendPassed,
    impact: "info",
    message:
      viewsTrend === "unknown"
        ? "Not enough recent uploads to detect a views trend yet."
        : viewsTrend === "growing"
        ? "Recent uploads are trending toward more views than older ones — good momentum."
        : viewsTrend === "steady"
        ? "Views are holding steady across recent uploads."
        : "Recent uploads are trending toward fewer views than older ones — worth revisiting title/thumbnail strategy.",
    goodMessage:
      viewsTrend === "growing"
        ? "Recent uploads are outperforming older ones — whatever you're doing lately (topics, hooks, thumbnails) is working, keep it up."
        : viewsTrend === "steady"
        ? "Views are holding steady across recent uploads — stable, but check the findings above for room to grow."
        : undefined,
    mistake:
      viewsTrend === "declining"
        ? "Your last few uploads are getting fewer views than your earlier ones. This is usually a symptom of the upload frequency, consistency, or engagement issues above rather than a separate problem on its own."
        : undefined,
    // No standalone fix — declining views point back at the other findings.
  });

  const score = Math.round((findings.filter((f) => f.passed).length / findings.length) * 100);

  const failedActionable = findings
    .filter((f) => !f.passed && f.impact !== "info" && f.mistake && f.fix)
    .sort((a, b) => IMPACT_RANK[b.key] - IMPACT_RANK[a.key] || PRIORITY_ORDER.indexOf(a.key) - PRIORITY_ORDER.indexOf(b.key));
  const focusArea: FocusArea | null = failedActionable[0]
    ? { key: failedActionable[0].key, label: failedActionable[0].label, mistake: failedActionable[0].mistake!, fix: failedActionable[0].fix! }
    : null;

  // Monetization guidance — the only eligibility signal derivable from public
  // data is the 1,000-subscriber bar. Watch-hours and Shorts-views thresholds
  // (and real approval status) are private, so the copy points at YouTube
  // Studio for those rather than pretending to know them.
  const subscriberCount = result.subscriberCount;
  const meetsSubscriberThreshold = subscriberCount == null ? null : subscriberCount >= YPP_SUBSCRIBER_THRESHOLD;
  const subscribersToGo =
    subscriberCount != null && subscriberCount < YPP_SUBSCRIBER_THRESHOLD
      ? YPP_SUBSCRIBER_THRESHOLD - subscriberCount
      : null;
  const monetization: MonetizationInfo =
    meetsSubscriberThreshold === false
      ? {
          meetsSubscriberThreshold,
          subscribersToGo,
          guidance: [
            `${subscribersToGo!.toLocaleString()} more subscribers to reach the 1,000 needed for monetization eligibility.`,
            "Also need 4,000 public watch hours in the past 12 months, or 10M Shorts views in the past 90 days — check your exact progress in YouTube Studio's Earn tab, since that's private data this tool can't see.",
            "Turn on 2-Step Verification and make sure your channel follows YouTube's monetization policies before applying.",
            focusArea
              ? `Fastest lever right now: ${focusArea.fix}`
              : "Upload consistently and focus on watch time — that's what moves both thresholds fastest.",
          ],
        }
      : meetsSubscriberThreshold === true
      ? {
          meetsSubscriberThreshold,
          subscribersToGo: null,
          guidance: [
            "You clear the 1,000-subscriber bar — if you haven't already, apply for the YouTube Partner Program from YouTube Studio (we can't see your real approval status from here).",
            focusArea
              ? `Biggest opportunity to grow further: ${focusArea.fix}`
              : "Keep an eye on the findings above — they're the main levers for more views.",
            "Try YouTube Shorts for extra discovery — they're weighted differently in recommendations than long-form videos.",
            "Test thumbnails and titles with the Video Optimization tool to get more clicks out of the views you're already getting.",
          ],
        }
      : {
          meetsSubscriberThreshold: null,
          subscribersToGo: null,
          guidance: ["Your subscriber count is hidden, so eligibility can't be checked here — see YouTube Studio's Earn tab for your real status."],
        };

  // Posting-time recommendation, derived from the same video sample.
  const timedVideos = recentVideos.filter((v) => v.publishedAt);
  const dayTotals = DAY_NAMES.map(() => ({ views: 0, count: 0 }));
  const bucketTotals = TIME_BUCKETS.map(() => ({ views: 0, count: 0 }));
  for (const v of timedVideos) {
    const d = new Date(v.publishedAt);
    const day = d.getUTCDay();
    const hour = d.getUTCHours();
    dayTotals[day].views += v.views;
    dayTotals[day].count += 1;
    const bucketIndex = TIME_BUCKETS.findIndex((b) => hour >= b.start && hour < b.end);
    if (bucketIndex !== -1) {
      bucketTotals[bucketIndex].views += v.views;
      bucketTotals[bucketIndex].count += 1;
    }
  }
  const dayBreakdown: DayBucket[] = DAY_NAMES.map((day, i) => ({
    day,
    avgViews: dayTotals[i].count > 0 ? Math.round(dayTotals[i].views / dayTotals[i].count) : 0,
    count: dayTotals[i].count,
  }));
  const timeBreakdown: TimeBucket[] = TIME_BUCKETS.map((b, i) => ({
    bucket: b.name,
    avgViews: bucketTotals[i].count > 0 ? Math.round(bucketTotals[i].views / bucketTotals[i].count) : 0,
    count: bucketTotals[i].count,
  }));
  const bestDayEntry = dayBreakdown.filter((d) => d.count > 0).sort((a, b) => b.avgViews - a.avgViews)[0];
  const bestBucketEntry = timeBreakdown.filter((b) => b.count > 0).sort((a, b) => b.avgViews - a.avgViews)[0];
  const bestDay = bestDayEntry?.day || null;
  const bestBucket = bestBucketEntry?.bucket || null;
  const postingTime: PostingTime = {
    bestDay,
    bestBucket,
    dayBreakdown,
    timeBreakdown,
    summary:
      bestDay && bestBucket
        ? `${DAY_FULL[bestDay] || bestDay}, ${bestBucket.replace(/\s*\(.*\)/, "")} tend to get you the most views.`
        : null,
  };

  return {
    channelId: result.channelId,
    channelTitle: result.channelTitle,
    channelThumbnail: result.channelThumbnail,
    subscriberCount: result.subscriberCount,
    totalViewCount: result.totalViewCount,
    videoCount: result.videoCount,
    avgUploadGapDays,
    gapConsistency,
    uploadGaps,
    engagementRate,
    viewsTrend,
    score,
    findings,
    focusArea,
    monetization,
    postingTime,
    recentVideos,
  };
}
