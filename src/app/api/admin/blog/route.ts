import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  bodyMd: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });
  }

  const post = await prisma.blogPost.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      bodyMd: parsed.data.bodyMd,
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? new Date() : null,
      authorId: admin.adminId,
    },
  });

  await logAdminAction(admin.adminId, "create_blog_post", "blog_post", post.id, {
    title: post.title,
    status: post.status,
  });

  return NextResponse.json({ post });
}
