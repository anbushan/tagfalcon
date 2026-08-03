import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const bodySchema = z.object({ planSlug: z.string() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug } });
  if (!plan) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });

  // Cancel any existing active subscriptions (comped or Razorpay-backed) before
  // granting the new one, so a user never shows two "active" plans at once.
  await prisma.subscription.updateMany({
    where: { userId: target.id, status: "active" },
    data: { status: "canceled" },
  });

  let newSub = null;
  if (plan.slug !== "free") {
    newSub = await prisma.subscription.create({
      data: {
        userId: target.id,
        planId: plan.id,
        status: "active",
        billingInterval: "month",
        // No razorpayOrderId/razorpayPaymentId and no currentPeriodEnd — this
        // is a manual, non-expiring comp, not a billed purchase. If they
        // later pay via Razorpay, that purchase should supersede this one.
      },
    });
  }

  await logAdminAction(admin.adminId, "grant_plan", "user", target.id, {
    email: target.email,
    plan: plan.slug,
  });

  await notifyUser(
    target.id,
    "Your plan has changed",
    `An admin has moved your account to the ${plan.name} plan.`
  );

  return NextResponse.json({ subscription: newSub, plan: plan.slug });
}
