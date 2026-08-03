import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { z } from "zod";

const bodySchema = z.object({ videoUrl: z.string().min(5).max(300) });

const MAX_CANDIDATES = 3; // quota control — each candidate costs up to 2 search calls
const PAGES_PER_KEYWORD = 2; // scans top 20 results per keyword

async function fetchVideoInfo(
  videoId: string,
  apiKey: string
): Promise<{ title: string; tags: string[] } | { apiError: string } | { notFound: true }> {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const reason = data?.error?.message || `YouTube API returned HTTP ${res.status}`;
    return { apiError: reason };
  }

  const snippet = data?.items?.[0]?.snippet;
  if (!snippet) return { notFound: true };
  return { title: snippet.title as string, tags: (snippet.tags as string[]) || [] };
}

async function findRank(videoId: string, keyword: string, apiKey: string): Promise<number | null> {
  let pageToken = "";
  for (let page = 0; page < PAGES_PER_KEYWORD; page++) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
      keyword
    )}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items = data.items || [];
    const idx = items.findIndex((i: any) => i.id.videoId === videoId);
    if (idx !== -1) return page * 10 + idx + 1;
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return null;
}

type Candidate = { keyword: string; source: "title" | "tag" };

function deriveCandidateKeywords(title: string, tags: string[]): Candidate[] {
  const candidates: Candidate[] = [
    { keyword: title, source: "title" },
    ...tags.map((t) => ({ keyword: t, source: "tag" as const })),
  ];
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of candidates) {
    const norm = c.keyword.trim();
    if (!norm || seen.has(norm.toLowerCase())) continue;
    seen.add(norm.toLowerCase());
    out.push({ keyword: norm, source: c.source });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const videoId = extractYouTubeVideoId(parsed.data.videoUrl);
  if (!videoId) {
    return NextResponse.json({ error: "INVALID_VIDEO_URL" }, { status: 400 });
  }

  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_NOT_CONFIGURED" }, { status: 500 });
  }

  const info = await fetchVideoInfo(videoId, apiKey);
  if ("apiError" in info) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: info.apiError }, { status: 502 });
  }
  if ("notFound" in info) {
    return NextResponse.json({ error: "VIDEO_NOT_FOUND" }, { status: 404 });
  }

  // Only consume a daily-limit unit once we know the request is actually
  // going to succeed — a bad URL or unconfigured key shouldn't cost quota.
  try {
    await checkAndIncrementUsage(userId, "rankCheckCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const candidates = deriveCandidateKeywords(info.title, info.tags);
  const results = await Promise.all(
    candidates.map(async (c) => ({
      keyword: c.keyword,
      source: c.source,
      position: await findRank(videoId, c.keyword, apiKey),
    }))
  );

  await prisma.rankCheck.createMany({
    data: results.map((r) => ({ userId, videoId, keyword: r.keyword, source: r.source, position: r.position })),
  });

  return NextResponse.json({ videoId, videoTitle: info.title, results });
}
