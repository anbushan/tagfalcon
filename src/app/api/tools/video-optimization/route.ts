import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { getSetting } from "@/lib/settings";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { fetchVideoForOptimization, computeOptimizationChecklist, extractHashtags } from "@/lib/optimization";
import { z } from "zod";

const bodySchema = z.object({ videoUrl: z.string().min(5).max(300) });

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

  const video = await fetchVideoForOptimization(videoId, apiKey);
  if ("apiError" in video) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: video.apiError }, { status: 502 });
  }
  if ("notFound" in video) {
    return NextResponse.json({ error: "VIDEO_NOT_FOUND" }, { status: 404 });
  }

  try {
    await checkAndIncrementUsage(userId, "videoOptimizationCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const checklist = computeOptimizationChecklist(video);
  const score = Math.round((checklist.filter((c) => c.passed).length / checklist.length) * 100);
  const hashtags = extractHashtags(`${video.title} ${video.description}`);
  const tagCharCount = video.tags.join(",").length;
  const engagementRate = video.viewCount > 0 ? (video.likeCount + video.commentCount) / video.viewCount : 0;

  const details = {
    description: video.description,
    tags: video.tags,
    tagCharCount,
    hashtags,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    engagementRate,
  };

  await prisma.videoOptimization.create({
    data: {
      userId,
      videoId,
      videoTitle: video.title,
      videoThumbnail: video.thumbnail,
      score,
      checklistJson: checklist,
      detailsJson: details,
    },
  });

  return NextResponse.json({
    videoId,
    videoTitle: video.title,
    videoThumbnail: video.thumbnail,
    score,
    checklist,
    details,
  });
}
