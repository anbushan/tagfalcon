import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: userId }, data: parsed.data });
  return NextResponse.json({ user: { name: user.name } });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Relies on onDelete: Cascade for subscriptions/usage/history/etc. defined
  // in schema.prisma. If this user authored a blog post or has audit log
  // entries as an admin, the delete will fail rather than silently orphan
  // data — that's intentional; admins should be deactivated, not
  // self-deleted, through this endpoint.
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
