type ApiError = { apiError: string };
type NotFound = { notFound: true };

export type VideoForOptimization = {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export async function fetchVideoForOptimization(
  videoId: string,
  apiKey: string
): Promise<VideoForOptimization | ApiError | NotFound> {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.message || `YouTube API returned HTTP ${res.status}` };
  }
  const item = data?.items?.[0];
  if (!item) return { notFound: true };

  return {
    videoId,
    title: item.snippet?.title || "",
    description: item.snippet?.description || "",
    tags: (item.snippet?.tags as string[]) || [],
    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
    viewCount: Number(item.statistics?.viewCount || 0),
    likeCount: Number(item.statistics?.likeCount || 0),
    commentCount: Number(item.statistics?.commentCount || 0),
  };
}

export type ChecklistItem = {
  key: string;
  label: string;
  passed: boolean;
  message: string;
};

export function extractHashtags(text: string): string[] {
  return text.match(/#[\p{L}\p{N}_]+/gu) || [];
}

/**
 * Rule-of-thumb SEO checks, not a real ranking-factor audit — YouTube
 * doesn't publish its actual algorithm weights. Thresholds here are rough
 * industry-common guidance (title/description length, tag budget usage,
 * hashtag count, engagement rate), meant to catch obvious gaps.
 */
export function computeOptimizationChecklist(video: {
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
}): ChecklistItem[] {
  const titleLen = video.title.length;
  const descLen = video.description.length;
  const tagCharCount = video.tags.join(",").length;
  const hashtagCount = extractHashtags(`${video.title} ${video.description}`).length;
  const engagementRate = video.viewCount > 0 ? (video.likeCount + video.commentCount) / video.viewCount : 0;

  return [
    {
      key: "title_length",
      label: "Title length",
      passed: titleLen >= 20 && titleLen <= 70,
      message:
        titleLen < 20
          ? `Only ${titleLen} characters — short titles give search less to match on. Aim for 40-70.`
          : titleLen > 70
          ? `${titleLen} characters — it may get truncated in search/suggested. Aim for 40-70.`
          : `${titleLen} characters — a good length for search and click-through.`,
    },
    {
      key: "description_length",
      label: "Description length",
      passed: descLen >= 250,
      message:
        descLen < 250
          ? `Only ${descLen} characters — a longer description (250+) gives YouTube's search more context.`
          : `${descLen} characters — good amount of context for search.`,
    },
    {
      key: "tags",
      label: "Tags",
      passed: video.tags.length >= 5 && tagCharCount >= 200,
      message:
        video.tags.length === 0
          ? "No tags set — tags help catch misspellings and related searches."
          : video.tags.length < 5 || tagCharCount < 200
          ? `${video.tags.length} tags using ${tagCharCount}/500 characters — room to add more relevant tags.`
          : `${video.tags.length} tags using ${tagCharCount}/500 characters — solid tag coverage.`,
    },
    {
      key: "hashtags",
      label: "Hashtags",
      passed: hashtagCount >= 1 && hashtagCount <= 15,
      message:
        hashtagCount === 0
          ? "No hashtags found — 3 to 15 relevant hashtags add extra discovery surfaces."
          : hashtagCount > 15
          ? `${hashtagCount} hashtags — YouTube ignores ALL hashtags on a video once you pass 15. Trim this down.`
          : `${hashtagCount} hashtags — within YouTube's usable range.`,
    },
    {
      key: "engagement",
      label: "Engagement rate",
      passed: engagementRate >= 0.02,
      message:
        video.viewCount === 0
          ? "Not enough views yet to judge engagement."
          : `${(engagementRate * 100).toFixed(1)}% of viewers liked or commented — ${
              engagementRate >= 0.02
                ? "healthy engagement."
                : "below the ~2% rough benchmark; a stronger call-to-action might help."
            }`,
    },
  ];
}
