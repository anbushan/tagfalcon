import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { fetchYouTubeSuggestions, fetchYouTubeSearchTags } from "@/lib/youtube-suggestions";
import { z } from "zod";

const bodySchema = z.object({
  query: z.string().min(2).max(100),
  source: z.enum(["youtube", "tiktok"]).default("youtube"),
});

function rankAndTrimTags(seed: string, suggestions: string[], videoTags: string[]) {
  const freq = new Map<string, number>();
  const bump = (t: string, w: number) => {
    const norm = t.trim().toLowerCase();
    if (!norm) return;
    freq.set(norm, (freq.get(norm) || 0) + w);
  };

  bump(seed, 10);
  suggestions.forEach((s) => bump(s, 3));
  videoTags.forEach((t) => bump(t, 2));

  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);

  // YouTube's tag field budget is ~500 characters total (commas included).
  const out: string[] = [];
  let charCount = 0;
  for (const tag of ranked) {
    const cost = tag.length + 1;
    if (charCount + cost > 500) break;
    out.push(tag);
    charCount += cost;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { query, source } = parsed.data;

  try {
    await checkAndIncrementUsage(userId, "tagGenCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json(
        { error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan },
        { status: 402 }
      );
    }
    throw e;
  }

  const cacheKey = `tags:${source}:${query.trim().toLowerCase()}`;
  const tags = await cached(cacheKey, 60 * 60 * 24, async () => {
    const [suggestions, videoTags] = await Promise.all([
      fetchYouTubeSuggestions(query),
      source === "youtube" ? fetchYouTubeSearchTags(query) : Promise.resolve([]),
    ]);
    return rankAndTrimTags(query, suggestions, videoTags);
  });

  await prisma.tagGeneration.create({
    data: { userId, query, source, tagsJson: tags },
  });

  return NextResponse.json({ tags, charCount: tags.join(",").length });
}
