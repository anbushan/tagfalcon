import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { getSetting } from "@/lib/settings";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { z } from "zod";

const bodySchema = z.object({ keyword: z.string().min(2).max(100) });

async function fetchRelatedKeywords(keyword: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    keyword
  )}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data[1] as string[]) || [];
}

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

  const cacheKey = `kw:${keyword.trim().toLowerCase()}`;
  const result = await cached(cacheKey, 60 * 60 * 12, async () => {
    const related = await fetchRelatedKeywords(keyword);
    const resultCount = await fetchSearchResultCount(keyword);
    const overview = scoreKeyword(related.length, resultCount);

    const relatedWithMetrics = await Promise.all(
      related.slice(0, 25).map(async (kw) => {
        const rc = await fetchSearchResultCount(kw);
        return { keyword: kw, ...scoreKeyword(3, rc) };
      })
    );

    return { overview, related: relatedWithMetrics };
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
