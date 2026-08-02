import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyMd: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };

  // Stamp publishedAt the first time a post goes live; keep it stable after that
  // so re-editing a published post doesn't reset its publish date.
  if (parsed.data.status === "published" && !existing.publishedAt) {
    data.publishedAt = new Date();
  }
  if (parsed.data.status === "draft") {
    data.publishedAt = null;
  }

  const post = await prisma.blogPost.update({ where: { id: existing.id }, data });

  await logAdminAction(admin.adminId, "edit_blog_post", "blog_post", post.id, {
    title: post.title,
    status: post.status,
  });

  return NextResponse.json({ post });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.blogPost.delete({ where: { id: existing.id } });

  await logAdminAction(admin.adminId, "delete_blog_post", "blog_post", existing.id, {
    title: existing.title,
  });

  return NextResponse.json({ ok: true });
}
