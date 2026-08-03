type ApiError = { apiError: string };
type NotFound = { notFound: true };

async function ytFetch(path: string, apiKey: string): Promise<any | ApiError> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.message || `YouTube API returned HTTP ${res.status}` };
  }
  return data;
}

export type ChannelVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
};

export type ChannelWithVideos = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  videos: ChannelVideo[];
};

/** Shared "channel + N most recent uploads with stats" fetch used by tools that need a bigger sample than a single-purpose fetch would. */
export async function fetchChannelWithRecentVideos(
  channelId: string,
  apiKey: string,
  sampleSize = 20
): Promise<ChannelWithVideos | ApiError | NotFound> {
  const channelData = await ytFetch(`/channels?part=snippet,contentDetails&id=${channelId}`, apiKey);
  if ("apiError" in channelData) return channelData;
  const channel = channelData?.items?.[0];
  if (!channel) return { notFound: true };

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let videos: ChannelVideo[] = [];

  if (uploadsPlaylistId) {
    const playlistData = await ytFetch(
      `/playlistItems?part=contentDetails&maxResults=${sampleSize}&playlistId=${uploadsPlaylistId}`,
      apiKey
    );
    if (!("apiError" in playlistData)) {
      const videoIds: string[] = (playlistData?.items || [])
        .map((i: any) => i.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length > 0) {
        const videosData = await ytFetch(`/videos?part=snippet,statistics&id=${videoIds.join(",")}`, apiKey);
        if (!("apiError" in videosData)) {
          videos = (videosData?.items || []).map((v: any) => ({
            videoId: v.id,
            title: v.snippet?.title || "",
            thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || null,
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
            comments: Number(v.statistics?.commentCount || 0),
            publishedAt: v.snippet?.publishedAt || "",
          }));
        }
      }
    }
  }

  return {
    channelId,
    channelTitle: channel.snippet?.title || "Unknown channel",
    channelThumbnail: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || null,
    videos,
  };
}
