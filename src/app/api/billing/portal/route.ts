import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const sub = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "NO_STRIPE_CUSTOMER" }, { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

  const stripe = await getStripeClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
