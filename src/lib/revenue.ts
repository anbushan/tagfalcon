import { extractYouTubeVideoId } from "@/lib/youtube";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Rough, publicly-cited creator RPM ranges (USD per 1,000 monetized views) by
 * YouTube video category. Real payouts swing hugely with audience geography,
 * season, and advertiser demand — this is a ballpark, not a quote.
 */
const CATEGORY_RPM_USD: Record<string, [number, number]> = {
  "Film & Animation": [2, 5],
  "Autos & Vehicles": [4, 8],
  Music: [1, 3],
  "Pets & Animals": [2, 4],
  Sports: [2, 5],
  "Travel & Events": [3, 6],
  Gaming: [2, 5],
  "People & Blogs": [2, 5],
  Comedy: [2, 5],
  Entertainment: [2, 5],
  "News & Politics": [3, 7],
  "Howto & Style": [4, 9],
  Education: [6, 12],
  "Science & Technology": [8, 16],
  "Nonprofits & Activism": [2, 5],
};
const DEFAULT_RPM_USD: [number, number] = [2, 6];

// Rough share of views that actually serve a paid ad — ad blockers, skipped
// ads, non-monetized regions/videos, etc. Not derived from real data, just a
// conservative fudge factor to keep this an admittedly-rough estimate.
const MONETIZED_VIEW_SHARE = 0.4;

const RECENT_VIDEO_SAMPLE = 10;
const MS_PER_DAY = 86_400_000;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_REGEX = /https?:\/\/[^\s)]+/gi;
const MAX_SOCIAL_LINKS = 5;

/**
 * YouTube's public Data API doesn't expose a channel's business email —
 * that was removed for spam reasons years ago. The best we can surface
 * honestly is whatever contact info the creator chose to put in their public
 * About description (a lot of channels list a business email and socials
 * there), so we scrape that text rather than fabricate anything.
 */
function extractContactInfo(description: string): { email: string | null; socialLinks: string[] } {
  const email = description.match(EMAIL_REGEX)?.[0] || null;

  const urls = description.match(URL_REGEX) || [];
  const socialLinks: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const url = raw.replace(/[),.\]]+$/, "");
    if (/youtube\.com|youtu\.be/i.test(url) || seen.has(url)) continue;
    seen.add(url);
    socialLinks.push(url);
    if (socialLinks.length >= MAX_SOCIAL_LINKS) break;
  }

  return { email, socialLinks };
}

export type ChannelInputKind = "channelId" | "handle" | "username" | "videoId";
export type ParsedChannelInput = { kind: ChannelInputKind; value: string };

/**
 * Accepts a channel URL (/channel/UC.., /@handle, /c/name, /user/name), a
 * video URL/ID, a bare channel ID, or a bare @handle.
 */
export function parseChannelInput(raw: string): ParsedChannelInput | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) return { kind: "channelId", value: trimmed };
  if (/^@[\w.-]{3,30}$/.test(trimmed)) return { kind: "handle", value: trimmed };

  const videoId = extractYouTubeVideoId(trimmed);
  if (videoId) return { kind: "videoId", value: videoId };

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes("youtube.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]) return { kind: "channelId", value: parts[1] };
    if (parts[0]?.startsWith("@")) return { kind: "handle", value: parts[0] };
    if ((parts[0] === "c" || parts[0] === "user") && parts[1]) return { kind: "username", value: parts[1] };
  } catch {
    return null;
  }
  return null;
}

type ApiError = { apiError: string };
type NotFound = { notFound: true };

async function ytFetch(path: string, apiKey: string): Promise<any | ApiError> {
  const res = await fetch(`${YT_BASE}${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.message || `YouTube API returned HTTP ${res.status}` };
  }
  return data;
}

export async function resolveChannelId(
  input: ParsedChannelInput,
  apiKey: string
): Promise<{ channelId: string } | ApiError | NotFound> {
  if (input.kind === "channelId") return { channelId: input.value };

  if (input.kind === "videoId") {
    const data = await ytFetch(`/videos?part=snippet&id=${input.value}`, apiKey);
    if ("apiError" in data) return data;
    const channelId = data?.items?.[0]?.snippet?.channelId;
    return channelId ? { channelId } : { notFound: true };
  }

  if (input.kind === "handle") {
    const handle = input.value.replace(/^@/, "");
    const data = await ytFetch(`/channels?part=id&forHandle=${encodeURIComponent(handle)}`, apiKey);
    if ("apiError" in data) return data;
    if (data?.items?.[0]?.id) return { channelId: data.items[0].id };
  }

  if (input.kind === "username") {
    const data = await ytFetch(`/channels?part=id&forUsername=${encodeURIComponent(input.value)}`, apiKey);
    if (!("apiError" in data) && data?.items?.[0]?.id) {
      return { channelId: data.items[0].id };
    }
  }

  // Fallback for custom URLs / handles the direct lookups miss.
  const query = input.value.replace(/^@/, "");
  const data = await ytFetch(`/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}`, apiKey);
  if ("apiError" in data) return data;
  const channelId = data?.items?.[0]?.snippet?.channelId || data?.items?.[0]?.id?.channelId;
  return channelId ? { channelId } : { notFound: true };
}

export type RecentVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  views: number;
  publishedAt: string;
};

export type RevenueReportData = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  channelStartDate: string | null;
  channelDescription: string;
  channelCountry: string | null;
  channelCustomUrl: string | null;
  contactEmail: string | null;
  socialLinks: string[];
  category: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgViewsRecent: number;
  estMonthlyViews: number;
  estRevenueLowUsd: number;
  estRevenueHighUsd: number;
  recentVideos: RecentVideo[];
};

export async function buildRevenueReport(
  channelId: string,
  apiKey: string
): Promise<RevenueReportData | ApiError | NotFound> {
  const channelData = await ytFetch(`/channels?part=snippet,statistics,contentDetails&id=${channelId}`, apiKey);
  if ("apiError" in channelData) return channelData;
  const channel = channelData?.items?.[0];
  if (!channel) return { notFound: true };

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let recentVideos: RecentVideo[] = [];
  let categoryTitle: string | null = null;

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
          const items = videosData?.items || [];
          recentVideos = items.map((v: any) => ({
            videoId: v.id,
            title: v.snippet?.title || "",
            description: v.snippet?.description || "",
            thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || null,
            views: Number(v.statistics?.viewCount || 0),
            publishedAt: v.snippet?.publishedAt || "",
          }));

          const categoryCounts = new Map<string, number>();
          for (const v of items) {
            const catId = v.snippet?.categoryId;
            if (catId) categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
          }
          const topCategoryId = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
          if (topCategoryId) {
            const categoryData = await ytFetch(`/videoCategories?part=snippet&id=${topCategoryId}`, apiKey);
            if (!("apiError" in categoryData)) {
              categoryTitle = categoryData?.items?.[0]?.snippet?.title || null;
            }
          }
        }
      }
    }
  }

  const avgViewsRecent =
    recentVideos.length > 0 ? recentVideos.reduce((sum, v) => sum + v.views, 0) / recentVideos.length : 0;

  const channelCreatedAt = channel.snippet?.publishedAt ? new Date(channel.snippet.publishedAt) : null;
  const videoCount = Number(channel.statistics?.videoCount || 0);
  const monthsSinceCreation = channelCreatedAt
    ? Math.max(1, (Date.now() - channelCreatedAt.getTime()) / (MS_PER_DAY * 30))
    : 1;
  const uploadsPerMonthEstimate = Math.min(30, videoCount / monthsSinceCreation);

  const now = Date.now();
  const recentUploadsLast30Days = recentVideos.filter(
    (v) => v.publishedAt && now - new Date(v.publishedAt).getTime() <= 30 * MS_PER_DAY
  ).length;

  const effectiveMonthlyUploads = Math.max(recentUploadsLast30Days, uploadsPerMonthEstimate, videoCount > 0 ? 1 : 0);
  const estMonthlyViews = Math.round(avgViewsRecent * effectiveMonthlyUploads);

  const [rpmLow, rpmHigh] = (categoryTitle && CATEGORY_RPM_USD[categoryTitle]) || DEFAULT_RPM_USD;
  const monetizedMonthlyViews = estMonthlyViews * MONETIZED_VIEW_SHARE;
  const estRevenueLowUsd = Math.round((monetizedMonthlyViews / 1000) * rpmLow);
  const estRevenueHighUsd = Math.round((monetizedMonthlyViews / 1000) * rpmHigh);

  const channelDescription: string = channel.snippet?.description || "";
  const { email: contactEmail, socialLinks } = extractContactInfo(channelDescription);

  return {
    channelId,
    channelTitle: channel.snippet?.title || "Unknown channel",
    channelThumbnail: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || null,
    channelStartDate: channel.snippet?.publishedAt || null,
    channelDescription,
    channelCountry: channel.snippet?.country || null,
    channelCustomUrl: channel.snippet?.customUrl || null,
    contactEmail,
    socialLinks,
    category: categoryTitle,
    subscriberCount: channel.statistics?.hiddenSubscriberCount ? null : Number(channel.statistics?.subscriberCount || 0),
    totalViewCount: Number(channel.statistics?.viewCount || 0),
    videoCount,
    avgViewsRecent: Math.round(avgViewsRecent),
    estMonthlyViews,
    estRevenueLowUsd,
    estRevenueHighUsd,
    recentVideos,
  };
}
