import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { getSetting } from "@/lib/settings";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { fetchRelatedKeywords } from "@/lib/keyword-suggest";
import { z } from "zod";

const bodySchema = z.object({ keyword: z.string().min(2).max(100) });

export type SerpResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
};

async function fetchSearchResultCount(keyword: string): Promise<number> {
  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return 0;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(
    keyword
  )}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.pageInfo?.totalResults ?? 0;
}

type SerpFetchResult = SerpResult[] | { apiError: string };

/**
 * Top-ranking videos for the keyword, enriched with tags and engagement
 * stats — one search.list call to get ranking order, one batched videos.list
 * call to fill in the details search results don't carry (tags, statistics).
 */
async function fetchSerp(keyword: string): Promise<SerpFetchResult> {
  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return { apiError: "YouTube API isn't configured yet." };

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
    keyword
  )}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json().catch(() => null);
  if (!searchRes.ok) {
    return { apiError: searchData?.error?.message || `YouTube API returned HTTP ${searchRes.status}` };
  }
  const orderedIds: string[] = (searchData.items || []).map((i: any) => i.id.videoId).filter(Boolean);
  if (orderedIds.length === 0) return [];

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${orderedIds.join(
    ","
  )}&key=${apiKey}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json().catch(() => null);
  if (!videosRes.ok) {
    return { apiError: videosData?.error?.message || `YouTube API returned HTTP ${videosRes.status}` };
  }
  const byId = new Map((videosData.items || []).map((v: any) => [v.id, v]));

  return orderedIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((v: any) => ({
      videoId: v.id,
      title: v.snippet?.title || "",
      channelTitle: v.snippet?.channelTitle || "",
      thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || "",
      publishedAt: v.snippet?.publishedAt || "",
      tags: (v.snippet?.tags as string[]) || [],
      views: Number(v.statistics?.viewCount || 0),
      likes: Number(v.statistics?.likeCount || 0),
      comments: Number(v.statistics?.commentCount || 0),
    }));
}

/**
 * NOTE: these are *estimates* derived from autocomplete breadth and result
 * counts, not exact YouTube analytics. Always label them as estimates in the UI.
 */
function scoreKeyword(relatedCount: number, resultCount: number) {
  const volume = Math.min(100, relatedCount * 8 + Math.log10(resultCount + 1) * 5);
  const difficulty = Math.min(100, Math.log10(resultCount + 1) * 12);
  const competition = Math.min(1, resultCount / 5_000_000);
  const viabilityScore = Math.max(0, Math.round(volume - difficulty * 0.6));
  return {
    volume: Math.round(volume),
    difficulty: Math.round(difficulty),
    competition: Number(competition.toFixed(2)),
    viabilityScore,
  };
}

/**
 * Scores a related keyword without spending a search.list call on it (that
 * API is 100 quota units/call — doing this for 25 related terms burned 2,500
 * units on a single "Research" click and was a likely cause of the SERP tab
 * silently going empty once quota ran out). Instead, decay the main
 * keyword's already-fetched result count by rank in the (free) autocomplete
 * list — a rough but zero-cost stand-in for "how competitive is this term."
 */
function estimateRelatedScore(rank: number, baseResultCount: number) {
  const decayedResultCount = baseResultCount * Math.pow(0.85, rank);
  return scoreKeyword(3, decayedResultCount);
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { keyword } = parsed.data;

  try {
    await checkAndIncrementUsage(userId, "keywordSearchCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const cacheKey = `kwfull:v2:${keyword.trim().toLowerCase()}`;
  const result = await cached(cacheKey, 60 * 30, async () => {
    const [related, resultCount, serpResult] = await Promise.all([
      fetchRelatedKeywords(keyword),
      fetchSearchResultCount(keyword),
      fetchSerp(keyword),
    ]);
    const overview = scoreKeyword(related.length, resultCount);

    const relatedWithMetrics = related
      .slice(0, 25)
      .map((kw, i) => ({ keyword: kw, ...estimateRelatedScore(i, resultCount) }));

    const serp = Array.isArray(serpResult) ? serpResult : [];
    const serpError = Array.isArray(serpResult) ? null : serpResult.apiError;

    return { overview, related: relatedWithMetrics, serp, serpError };
  });

  await prisma.keywordSearch.create({
    data: {
      userId,
      keyword,
      volume: result.overview.volume,
      difficulty: result.overview.difficulty,
      competition: result.overview.competition,
      viabilityScore: result.overview.viabilityScore,
      relatedJson: result.related,
    },
  });

  return NextResponse.json(result);
}
