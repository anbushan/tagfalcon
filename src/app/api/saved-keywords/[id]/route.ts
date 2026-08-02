import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const keyword = await prisma.savedKeyword.findFirst({ where: { id: params.id, userId } });
  if (!keyword) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.savedKeyword.delete({ where: { id: keyword.id } });
  return NextResponse.json({ ok: true });
}
