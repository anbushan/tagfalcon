import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { parseChannelInput, resolveChannelId, buildRevenueReport } from "@/lib/revenue";
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

  const report = await buildRevenueReport(resolved.channelId, apiKey);
  if ("apiError" in report) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: report.apiError }, { status: 502 });
  }
  if ("notFound" in report) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  // Only consume a daily-limit unit once we know the request is actually
  // going to succeed — a bad URL or unconfigured key shouldn't cost quota.
  try {
    await checkAndIncrementUsage(userId, "revenueReportCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const saved = await prisma.revenueReport.create({
    data: {
      userId,
      channelId: report.channelId,
      channelTitle: report.channelTitle,
      channelThumbnail: report.channelThumbnail,
      channelStartDate: report.channelStartDate ? new Date(report.channelStartDate) : null,
      channelDescription: report.channelDescription,
      channelCountry: report.channelCountry,
      channelCustomUrl: report.channelCustomUrl,
      contactEmail: report.contactEmail,
      socialLinksJson: report.socialLinks,
      category: report.category,
      subscriberCount: report.subscriberCount,
      totalViewCount: report.totalViewCount,
      videoCount: report.videoCount,
      avgViewsRecent: report.avgViewsRecent,
      estMonthlyViews: report.estMonthlyViews,
      estRevenueLowUsd: report.estRevenueLowUsd,
      estRevenueHighUsd: report.estRevenueHighUsd,
      recentVideosJson: report.recentVideos,
    },
  });

  return NextResponse.json({ id: saved.id, ...report });
}
