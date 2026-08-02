import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["active", "suspended"]) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Guard rail: don't let an admin suspend another super_admin by accident/misuse.
  if (target.role === "super_admin" && parsed.data.status === "suspended") {
    return NextResponse.json({ error: "CANNOT_SUSPEND_SUPER_ADMIN" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { status: parsed.data.status },
  });

  await logAdminAction(
    admin.adminId,
    parsed.data.status === "suspended" ? "suspend_user" : "activate_user",
    "user",
    target.id,
    { email: target.email }
  );

  await notifyUser(
    target.id,
    parsed.data.status === "suspended" ? "Account suspended" : "Account reactivated",
    parsed.data.status === "suspended"
      ? "Your account has been suspended by an admin. Contact support if you think this is a mistake."
      : "Your account has been reactivated — you have full access again."
  );

  return NextResponse.json({ user: updated });
}
