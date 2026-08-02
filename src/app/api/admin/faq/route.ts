import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const faq = await prisma.faq.create({
    data: {
      question: parsed.data.question,
      answer: parsed.data.answer,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await logAdminAction(admin.adminId, "create_faq", "faq", faq.id, { question: faq.question });

  return NextResponse.json({ faq });
}
