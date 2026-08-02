import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1).max(100) });

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const lists = await prisma.keywordList.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { keywords: true },
  });

  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const list = await prisma.keywordList.create({ data: { userId, name: parsed.data.name } });
  return NextResponse.json({ list });
}
