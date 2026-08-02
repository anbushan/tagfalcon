import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  target: z.union([z.literal("all"), z.string()]), // "all" or a specific email
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, body, target } = parsed.data;

  if (target === "all") {
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, title, body })),
    });
    await logAdminAction(admin.adminId, "broadcast_notification", "user", "all", {
      title,
      recipientCount: users.length,
    });
    return NextResponse.json({ ok: true, recipientCount: users.length });
  }

  const user = await prisma.user.findUnique({ where: { email: target } });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  await notifyUser(user.id, title, body);
  await logAdminAction(admin.adminId, "send_notification", "user", user.id, { email: user.email, title });

  return NextResponse.json({ ok: true, recipientCount: 1 });
}
