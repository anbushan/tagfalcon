import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
