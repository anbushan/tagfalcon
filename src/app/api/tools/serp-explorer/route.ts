import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { cached } from "@/lib/redis";
import { getSetting } from "@/lib/settings";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { z } from "zod";

const bodySchema = z.object({ keyword: z.string().min(2).max(100) });

type SerpResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

async function fetchSerp(keyword: string): Promise<SerpResult[]> {
  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
    keyword
  )}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
    publishedAt: item.snippet.publishedAt,
  }));
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

  const cacheKey = `serp:${keyword.trim().toLowerCase()}`;
  const results = await cached(cacheKey, 60 * 30, () => fetchSerp(keyword));

  return NextResponse.json({ results });
}
