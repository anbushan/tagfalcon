import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { fetchYouTubeSuggestions, fetchYouTubeSearchTags } from "@/lib/youtube-suggestions";
import { buildHashtags } from "@/lib/hashtags";
import { z } from "zod";

const bodySchema = z.object({ query: z.string().min(2).max(100) });

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { query } = parsed.data;

  try {
    await checkAndIncrementUsage(userId, "hashtagGenCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const cacheKey = `hashtags:${query.trim().toLowerCase()}`;
  const hashtags = await cached(cacheKey, 60 * 60 * 24, async () => {
    const [suggestions, videoTags] = await Promise.all([
      fetchYouTubeSuggestions(query),
      fetchYouTubeSearchTags(query),
    ]);
    return buildHashtags(query, suggestions, videoTags);
  });

  await prisma.hashtagGeneration.create({ data: { userId, query, hashtagsJson: hashtags } });

  return NextResponse.json({ hashtags });
}
