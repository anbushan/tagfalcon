import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string().min(1).max(300).optional(),
  answer: z.string().min(1).max(2000).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.faq.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const faq = await prisma.faq.update({ where: { id: existing.id }, data: parsed.data });

  await logAdminAction(admin.adminId, "edit_faq", "faq", faq.id, parsed.data);

  return NextResponse.json({ faq });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.faq.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.faq.delete({ where: { id: existing.id } });

  await logAdminAction(admin.adminId, "delete_faq", "faq", existing.id, { question: existing.question });

  return NextResponse.json({ ok: true });
}
