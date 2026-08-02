import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { z } from "zod";

const bodySchema = z.object({
  planSlug: z.string(),
  interval: z.enum(["month", "year"]),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userEmail = session.user.email as string;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { planSlug, interval } = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }
  if (plan.slug === "free") {
    return NextResponse.json({ error: "FREE_PLAN_HAS_NO_CHECKOUT" }, { status: 400 });
  }

  const priceId = interval === "year" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_NOT_CONFIGURED", detail: `Set stripePriceId${interval === "year" ? "Yearly" : "Monthly"} for the ${plan.name} plan.` },
      { status: 500 }
    );
  }

  // Reuse an existing Stripe customer if this user already has one from a past subscription.
  const existingSub = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

  const stripe = await getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingSub?.stripeCustomerId ?? undefined,
    customer_email: existingSub?.stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/billing?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=canceled`,
    metadata: { userId, planId: plan.id, interval },
    subscription_data: { metadata: { userId, planId: plan.id, interval } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
