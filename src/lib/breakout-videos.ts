import { fetchChannelWithRecentVideos } from "@/lib/channel-videos";

type ApiError = { apiError: string };
type NotFound = { notFound: true };

export type BreakoutVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  ratio: number; // views / channel average
  publishedAt: string;
  status: "breakout" | "underperformer" | "typical";
};

export type BreakoutData = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  avgViews: number;
  videos: BreakoutVideo[];
};

const BREAKOUT_RATIO = 1.5;
const UNDERPERFORM_RATIO = 0.5;

export async function fetchBreakoutVideos(channelId: string, apiKey: string): Promise<BreakoutData | ApiError | NotFound> {
  const result = await fetchChannelWithRecentVideos(channelId, apiKey, 20);
  if ("apiError" in result) return result;
  if ("notFound" in result) return result;

  const avgViews = result.videos.length > 0 ? result.videos.reduce((s, v) => s + v.views, 0) / result.videos.length : 0;

  const videos: BreakoutVideo[] = result.videos
    .map((v) => {
      const ratio = avgViews > 0 ? v.views / avgViews : 0;
      const status: BreakoutVideo["status"] =
        ratio >= BREAKOUT_RATIO ? "breakout" : ratio <= UNDERPERFORM_RATIO ? "underperformer" : "typical";
      return {
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        views: v.views,
        ratio: Math.round(ratio * 100) / 100,
        publishedAt: v.publishedAt,
        status,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  return {
    channelId: result.channelId,
    channelTitle: result.channelTitle,
    channelThumbnail: result.channelThumbnail,
    avgViews: Math.round(avgViews),
    videos,
  };
}
