import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({ contentJson: z.record(z.any()) });

export async function PATCH(req: NextRequest, { params }: { params: { key: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const page = await prisma.pageContent.upsert({
    where: { key: params.key },
    update: { contentJson: parsed.data.contentJson },
    create: { key: params.key, contentJson: parsed.data.contentJson },
  });

  await logAdminAction(admin.adminId, "edit_page_content", "page_content", params.key, {});

  return NextResponse.json({ page });
}
