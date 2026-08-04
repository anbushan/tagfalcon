const MAX_CARDS = 20;

type ApiError = { apiError: string };

async function ytFetch(path: string, apiKey: string): Promise<any | ApiError> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.message || `YouTube API returned HTTP ${res.status}` };
  }
  return data;
}

export type TopCreator = {
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

/**
 * Not an official YouTube "top creators" leaderboard — YouTube has no such
 * public endpoint. Instead: sources today's most popular videos for a
 * region/category (same signal Trends Research uses), dedupes the channels
 * behind them, and ranks those channels by subscriber count. Honest label:
 * "channels behind today's most popular videos here, ranked by subscribers."
 */
export async function fetchTopCreators(
  region: string,
  categoryId: string | undefined,
  apiKey: string
): Promise<TopCreator[] | ApiError> {
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    regionCode: region,
    maxResults: "50",
  });
  if (categoryId) params.set("videoCategoryId", categoryId);

  const videosData = await ytFetch(`/videos?${params.toString()}`, apiKey);
  if ("apiError" in videosData) return videosData;

  const channelIds = [
    ...new Set((videosData?.items || []).map((v: any) => v.snippet?.channelId).filter(Boolean)),
  ] as string[];
  if (channelIds.length === 0) return [];

  const channelsData = await ytFetch(`/channels?part=snippet,statistics&id=${channelIds.join(",")}`, apiKey);
  if ("apiError" in channelsData) return channelsData;

  const creators: TopCreator[] = (channelsData?.items || []).map((c: any) => ({
    channelId: c.id,
    title: c.snippet?.title || "Unknown channel",
    thumbnail: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url || null,
    subscriberCount: c.statistics?.hiddenSubscriberCount ? null : Number(c.statistics?.subscriberCount || 0),
    totalViewCount: Number(c.statistics?.viewCount || 0),
    videoCount: Number(c.statistics?.videoCount || 0),
    channelStartDate: c.snippet?.publishedAt || null,
    country: c.snippet?.country || null,
    description: (c.snippet?.description || "").slice(0, 200),
  }));

  return creators
    .sort((a, b) => (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0))
    .slice(0, MAX_CARDS);
}
