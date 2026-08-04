import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { getSetting } from "@/lib/settings";
import { checkAndIncrementUsage } from "@/lib/usage-limits";
import { fetchTopCreators } from "@/lib/top-creators";
import { categoryName } from "@/lib/trends";
import { z } from "zod";

const bodySchema = z.object({
  region: z.string().regex(/^[A-Z]{2}$/, "Region must be a 2-letter country code"),
  categoryId: z.string().max(10).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { region, categoryId } = parsed.data;

  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_NOT_CONFIGURED" }, { status: 500 });
  }

  const cacheKey = `top-creators:${region}:${categoryId || "all"}`;
  const results = await cached(cacheKey, 60 * 30, () => fetchTopCreators(region, categoryId, apiKey));

  if ("apiError" in results) {
    return NextResponse.json({ error: "YOUTUBE_API_ERROR", detail: results.apiError }, { status: 502 });
  }

  try {
    await checkAndIncrementUsage(userId, "topCreatorsCount");
  } catch (e: any) {
    if (e.code === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: "DAILY_LIMIT_REACHED", limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const catName = categoryName(categoryId);

  await prisma.topCreatorsSearch.create({
    data: {
      userId,
      region,
      categoryId: categoryId || null,
      categoryName: catName,
      resultsJson: results,
    },
  });

  return NextResponse.json({ region, categoryName: catName, results });
}
