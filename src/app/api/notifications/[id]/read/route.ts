import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const notification = await prisma.notification.findFirst({ where: { id: params.id, userId } });
  if (!notification) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
