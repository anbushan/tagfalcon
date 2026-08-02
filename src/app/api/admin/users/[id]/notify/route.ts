import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  await notifyUser(target.id, parsed.data.title, parsed.data.body);

  await logAdminAction(admin.adminId, "send_notification", "user", target.id, {
    email: target.email,
    title: parsed.data.title,
  });

  return NextResponse.json({ ok: true });
}
