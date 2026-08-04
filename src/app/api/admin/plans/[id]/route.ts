import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  priceMonthly: z.number().int().min(0).optional(),
  priceYearly: z.number().int().min(0).optional(),
  tagGenLimit: z.number().int().min(0).optional(),
  keywordSearchLimit: z.number().int().min(0).optional(),
  rankCheckLimit: z.number().int().min(0).optional(),
  revenueReportLimit: z.number().int().min(0).optional(),
  trendsResearchLimit: z.number().int().min(0).optional(),
  videoOptimizationLimit: z.number().int().min(0).optional(),
  channelAuditLimit: z.number().int().min(0).optional(),
  hashtagGenLimit: z.number().int().min(0).optional(),
  uploadTimeLimit: z.number().int().min(0).optional(),
  channelComparisonLimit: z.number().int().min(0).optional(),
  breakoutVideoLimit: z.number().int().min(0).optional(),
  topCreatorsLimit: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  // Empty-string fields mean "clear this optional value" — normalize to null
  // rather than storing an empty string, since the rest of the app treats
  // these as nullable (e.g. `plan.description || "No description set yet."`).
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    data[key] = value === "" ? null : value;
  }

  const plan = await prisma.plan.update({ where: { id: existing.id }, data });

  await logAdminAction(admin.adminId, "edit_plan", "plan", plan.id, { name: plan.name });

  return NextResponse.json({ plan });
}
