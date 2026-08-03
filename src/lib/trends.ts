import { TREND_CATEGORIES } from "@/lib/trends-constants";

const MS_PER_DAY = 86_400_000;

export type TrendingVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  publishedAt: string;
  viewsPerDay: number;
};

type ApiError = { apiError: string };

export function categoryName(categoryId?: string): string | null {
  if (!categoryId) return null;
  return TREND_CATEGORIES.find((c) => c.id === categoryId)?.name || null;
}

/**
 * YouTube's trending chart has no language parameter, and `search.list`
 * returns zero results without a `q` term (verified — not documented, but
 * real), so there's no API-level way to filter trending-by-language. Instead
 * we detect script from the title for languages with a distinct Unicode
 * block. Latin-script languages (English, Spanish, French, ...) aren't
 * included here since there's no reliable way to tell them apart from a
 * title string alone without a real language-detection library.
 */
const SCRIPT_RANGES: Record<string, RegExp> = {
  hi: /[ऀ-ॿ]/, // Devanagari
  ta: /[஀-௿]/, // Tamil
  ja: /[぀-ヿ一-鿿]/, // Hiragana/Katakana/Kanji
  ko: /[가-힯]/, // Hangul
  ar: /[؀-ۿ]/, // Arabic
};

function matchesLanguage(title: string, language: string): boolean {
  const pattern = SCRIPT_RANGES[language];
  return pattern ? pattern.test(title) : true;
}

function toTrendingVideos(items: any[]): TrendingVideo[] {
  const now = Date.now();
  return items.map((v) => {
    const views = Number(v.statistics?.viewCount || 0);
    const publishedAt = v.snippet?.publishedAt || "";
    const daysSincePublished = publishedAt ? Math.max(1, (now - new Date(publishedAt).getTime()) / MS_PER_DAY) : 1;
    return {
      videoId: v.id,
      title: v.snippet?.title || "",
      channelTitle: v.snippet?.channelTitle || "",
      thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || null,
      views,
      likes: Number(v.statistics?.likeCount || 0),
      publishedAt,
      viewsPerDay: Math.round(views / daysSincePublished),
    };
  });
}

export async function fetchTrendingVideos(
  region: string,
  categoryId: string | undefined,
  language: string | undefined,
  apiKey: string
): Promise<TrendingVideo[] | ApiError> {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    regionCode: region,
    // Fetch the max page size when filtering by language, since the filter
    // narrows the set down after the fact.
    maxResults: language ? "50" : "20",
    key: apiKey,
  });
  if (categoryId) params.set("videoCategoryId", categoryId);

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.message || `YouTube API returned HTTP ${res.status}` };
  }

  let videos = toTrendingVideos(data?.items || []);
  if (language) videos = videos.filter((v) => matchesLanguage(v.title, language));
  return videos.slice(0, 20);
}
