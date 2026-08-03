const RECENT_VIDEO_SAMPLE = 10;
const MS_PER_DAY = 86_400_000;

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

export type AuditVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
};

export type AuditFinding = { key: string; label: string; passed: boolean; message: string };

export type UploadGap = { label: string; days: number };

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
  recentVideos: AuditVideo[];
};

export async function fetchChannelAuditData(
  channelId: string,
  apiKey: string
): Promise<ChannelAuditData | ApiError | NotFound> {
  const channelData = await ytFetch(`/channels?part=snippet,statistics,contentDetails&id=${channelId}`, apiKey);
  if ("apiError" in channelData) return channelData;
  const channel = channelData?.items?.[0];
  if (!channel) return { notFound: true };

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let recentVideos: AuditVideo[] = [];

  if (uploadsPlaylistId) {
    const playlistData = await ytFetch(
      `/playlistItems?part=contentDetails&maxResults=${RECENT_VIDEO_SAMPLE}&playlistId=${uploadsPlaylistId}`,
      apiKey
    );
    if (!("apiError" in playlistData)) {
      const videoIds: string[] = (playlistData?.items || [])
        .map((i: any) => i.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length > 0) {
        const videosData = await ytFetch(`/videos?part=snippet,statistics&id=${videoIds.join(",")}`, apiKey);
        if (!("apiError" in videosData)) {
          recentVideos = (videosData?.items || []).map((v: any) => ({
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

  // Oldest-to-newest for gap/trend math.
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

  findings.push({
    key: "upload_frequency",
    label: "Upload frequency",
    passed: avgUploadGapDays != null && avgUploadGapDays <= 14,
    message:
      avgUploadGapDays == null
        ? "Not enough recent uploads to measure a posting cadence yet."
        : `Uploading roughly every ${avgUploadGapDays.toFixed(1)} days — ${
            avgUploadGapDays <= 14 ? "a solid, active cadence." : "less than biweekly; more frequent uploads tend to compound growth."
          }`,
  });

  findings.push({
    key: "upload_consistency",
    label: "Upload consistency",
    passed: gapConsistency != null && gapConsistency < 0.6,
    message:
      gapConsistency == null
        ? "Not enough recent uploads to judge consistency yet."
        : gapConsistency < 0.6
        ? "Upload schedule is fairly regular — that helps subscribers know when to expect new content."
        : "Upload gaps vary a lot — a more predictable schedule tends to build stronger viewer habits.",
  });

  findings.push({
    key: "engagement",
    label: "Engagement rate",
    passed: engagementRate >= 0.02,
    message:
      totalViews === 0
        ? "Not enough views yet to judge engagement."
        : `${(engagementRate * 100).toFixed(1)}% of views turn into a like or comment — ${
            engagementRate >= 0.02 ? "healthy engagement." : "below the ~2% rough benchmark; stronger CTAs might help."
          }`,
  });

  findings.push({
    key: "views_trend",
    label: "Views trend",
    passed: viewsTrend === "growing" || viewsTrend === "steady",
    message:
      viewsTrend === "unknown"
        ? "Not enough recent uploads to detect a views trend yet."
        : viewsTrend === "growing"
        ? "Recent uploads are trending toward more views than older ones — good momentum."
        : viewsTrend === "steady"
        ? "Views are holding steady across recent uploads."
        : "Recent uploads are trending toward fewer views than older ones — worth revisiting title/thumbnail strategy.",
  });

  const score = Math.round((findings.filter((f) => f.passed).length / findings.length) * 100);

  return {
    channelId,
    channelTitle: channel.snippet?.title || "Unknown channel",
    channelThumbnail: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || null,
    subscriberCount: channel.statistics?.hiddenSubscriberCount ? null : Number(channel.statistics?.subscriberCount || 0),
    totalViewCount: Number(channel.statistics?.viewCount || 0),
    videoCount: Number(channel.statistics?.videoCount || 0),
    avgUploadGapDays,
    gapConsistency,
    uploadGaps,
    engagementRate,
    viewsTrend,
    score,
    findings,
    recentVideos,
  };
}
