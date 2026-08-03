import { fetchChannelWithRecentVideos } from "@/lib/channel-videos";

type ApiError = { apiError: string };
type NotFound = { notFound: true };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_BUCKETS = [
  { name: "Night (12–6am UTC)", start: 0, end: 6 },
  { name: "Morning (6am–12pm UTC)", start: 6, end: 12 },
  { name: "Afternoon (12–6pm UTC)", start: 12, end: 18 },
  { name: "Evening (6pm–12am UTC)", start: 18, end: 24 },
];

export type DayBucket = { day: string; avgViews: number; count: number };
export type TimeBucket = { bucket: string; avgViews: number; count: number };

export type UploadTimeData = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  bestDay: string | null;
  bestBucket: string | null;
  dayBreakdown: DayBucket[];
  timeBreakdown: TimeBucket[];
  sampleSize: number;
};

export async function fetchUploadTimeData(channelId: string, apiKey: string): Promise<UploadTimeData | ApiError | NotFound> {
  const result = await fetchChannelWithRecentVideos(channelId, apiKey, 30);
  if ("apiError" in result) return result;
  if ("notFound" in result) return result;

  const videos = result.videos.filter((v) => v.publishedAt);

  const dayTotals = DAY_NAMES.map(() => ({ views: 0, count: 0 }));
  const bucketTotals = TIME_BUCKETS.map(() => ({ views: 0, count: 0 }));

  for (const v of videos) {
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

  return {
    channelId: result.channelId,
    channelTitle: result.channelTitle,
    channelThumbnail: result.channelThumbnail,
    bestDay: bestDayEntry?.day || null,
    bestBucket: bestBucketEntry?.bucket || null,
    dayBreakdown,
    timeBreakdown,
    sampleSize: videos.length,
  };
}
