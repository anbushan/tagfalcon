import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { parseChannelInput, resolveChannelId } from "@/lib/revenue";
import { fetchChannelAuditData } from "@/lib/channel-audit";
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

  const audit = await fetchChannelAuditData(resolved.channelId, apiKey);
  if ("apiError" in audit) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: audit.apiError }, { status: 502 });
  }
  if ("notFound" in audit) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  try {
    await checkAndIncrementUsage(userId, "channelAuditCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const saved = await prisma.channelAudit.create({
    data: {
      userId,
      channelId: audit.channelId,
      channelTitle: audit.channelTitle,
      channelThumbnail: audit.channelThumbnail,
      score: audit.score,
      metricsJson: {
        subscriberCount: audit.subscriberCount,
        totalViewCount: audit.totalViewCount,
        videoCount: audit.videoCount,
        avgUploadGapDays: audit.avgUploadGapDays,
        gapConsistency: audit.gapConsistency,
        uploadGaps: audit.uploadGaps,
        engagementRate: audit.engagementRate,
        viewsTrend: audit.viewsTrend,
        focusArea: audit.focusArea,
        monetization: audit.monetization,
        postingTime: audit.postingTime,
      },
      findingsJson: audit.findings,
      recentVideosJson: audit.recentVideos,
    },
  });

  return NextResponse.json({ id: saved.id, ...audit });
}
