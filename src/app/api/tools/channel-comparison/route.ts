import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { parseChannelInput, resolveChannelId } from "@/lib/revenue";
import { buildComparison } from "@/lib/channel-comparison";
import { z } from "zod";

const bodySchema = z.object({
  channelUrlA: z.string().min(2).max(300),
  channelUrlB: z.string().min(2).max(300),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const parsedA = parseChannelInput(parsed.data.channelUrlA);
  const parsedB = parseChannelInput(parsed.data.channelUrlB);
  if (!parsedA || !parsedB) {
    return NextResponse.json({ error: "INVALID_CHANNEL_URL" }, { status: 400 });
  }

  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_NOT_CONFIGURED" }, { status: 500 });
  }

  const [resolvedA, resolvedB] = await Promise.all([
    resolveChannelId(parsedA, apiKey),
    resolveChannelId(parsedB, apiKey),
  ]);
  if ("apiError" in resolvedA) return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: resolvedA.apiError }, { status: 502 });
  if ("notFound" in resolvedA) return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  if ("apiError" in resolvedB) return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: resolvedB.apiError }, { status: 502 });
  if ("notFound" in resolvedB) return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });

  const comparison = await buildComparison(resolvedA.channelId, resolvedB.channelId, apiKey);
  if ("apiError" in comparison) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: comparison.apiError }, { status: 502 });
  }
  if ("notFound" in comparison) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  try {
    await checkAndIncrementUsage(userId, "channelComparisonCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const saved = await prisma.channelComparison.create({
    data: {
      userId,
      channelAId: comparison.a.channelId,
      channelATitle: comparison.a.channelTitle,
      channelBId: comparison.b.channelId,
      channelBTitle: comparison.b.channelTitle,
      comparisonJson: comparison,
    },
  });

  return NextResponse.json({ id: saved.id, ...comparison });
}
