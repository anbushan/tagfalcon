import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { cached } from "@/lib/redis";
import { getSetting } from "@/lib/settings";
import { fetchRelatedKeywords } from "@/lib/keyword-suggest";
import { z } from "zod";

const bodySchema = z.object({
  type: z.enum(["channel", "video", "keyword"]),
  q: z.string().min(2).max(100),
});

export type AutocompleteItem = {
  id: string;
  label: string;
  sublabel?: string;
  thumbnail?: string;
  value: string;
};

async function fetchYouTubeSuggestions(type: "channel" | "video", q: string, apiKey: string): Promise<AutocompleteItem[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${type}&maxResults=5&q=${encodeURIComponent(
    q
  )}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return [];

  return ((data.items || []) as any[]).map((item) => {
    if (type === "channel") {
      const channelId = item.id?.channelId;
      return {
        id: channelId,
        label: item.snippet?.channelTitle || item.snippet?.title || "",
        sublabel: "Channel",
        thumbnail: item.snippet?.thumbnails?.default?.url || null,
        value: `https://www.youtube.com/channel/${channelId}`,
      };
    }
    const videoId = item.id?.videoId;
    return {
      id: videoId,
      label: item.snippet?.title || "",
      sublabel: item.snippet?.channelTitle || "Video",
      thumbnail: item.snippet?.thumbnails?.default?.url || null,
      value: `https://www.youtube.com/watch?v=${videoId}`,
    };
  });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { type, q } = parsed.data;

  if (type === "keyword") {
    const suggestions = await fetchRelatedKeywords(q);
    const items: AutocompleteItem[] = suggestions.slice(0, 8).map((kw) => ({ id: kw, label: kw, value: kw }));
    return NextResponse.json({ items });
  }

  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return NextResponse.json({ items: [] });

  const cacheKey = `autocomplete:${type}:${q.trim().toLowerCase()}`;
  const items = await cached(cacheKey, 60 * 10, () => fetchYouTubeSuggestions(type, q, apiKey));

  return NextResponse.json({ items });
}
