import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { parseChannelInput, resolveChannelId } from "@/lib/revenue";
import { fetchBreakoutVideos } from "@/lib/breakout-videos";
import { z } from "zod";

const bodySchema = z.object({ channelUrl: z.string().min(2).max(300) });

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const parsedInput = parseChannelInput(parsed.data.channelUrl);
  if (!parsedInput) {
    return NextResponse.json({ error: "INVALID_CHANNEL_URL" }, { status: 400 });
  }

  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_NOT_CONFIGURED" }, { status: 500 });
  }

  const resolved = await resolveChannelId(parsedInput, apiKey);
  if ("apiError" in resolved) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: resolved.apiError }, { status: 502 });
  }
  if ("notFound" in resolved) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  const data = await fetchBreakoutVideos(resolved.channelId, apiKey);
  if ("apiError" in data) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: data.apiError }, { status: 502 });
  }
  if ("notFound" in data) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  try {
    await checkAndIncrementUsage(userId, "breakoutVideoCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const saved = await prisma.breakoutVideo.create({
    data: {
      userId,
      channelId: data.channelId,
      channelTitle: data.channelTitle,
      channelThumbnail: data.channelThumbnail,
      avgViews: data.avgViews,
      breakoutsJson: data.videos,
    },
  });

  return NextResponse.json({ id: saved.id, ...data });
}
