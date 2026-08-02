import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  keyword: z.string().min(1).max(100),
  metrics: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const list = await prisma.keywordList.findFirst({ where: { id: params.id, userId } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const saved = await prisma.savedKeyword.create({
    data: {
      userId,
      listId: list.id,
      keyword: parsed.data.keyword,
      metricsJson: parsed.data.metrics ?? {},
    },
  });

  return NextResponse.json({ saved });
}
