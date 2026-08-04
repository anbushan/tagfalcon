import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, getRazorpayKeys } from "@/lib/razorpay";
import { detectCountry } from "@/lib/geo";
import { currencyForCountry, convertInrPaiseToCurrency } from "@/lib/currency";
import { z } from "zod";

const bodySchema = z.object({
  planSlug: z.string(),
  interval: z.enum(["month", "year"]),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

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

  const keys = await getRazorpayKeys();
  if (!keys) {
    return NextResponse.json({ error: "RAZORPAY_NOT_CONFIGURED" }, { status: 500 });
  }

  const amountPaise = interval === "year" ? plan.priceYearly : plan.priceMonthly;

  // Authoritative currency: derived server-side from the request's IP, never
  // from anything the client sends — a client-supplied currency would let a
  // buyer self-select a cheaper currency at checkout time.
  const country = await detectCountry(req);
  const currency = currencyForCountry(country);
  const amount = currency === "INR" ? amountPaise : convertInrPaiseToCurrency(amountPaise, currency);

  const receipt = `${plan.slug}_${interval}_${Date.now()}`;
  let order = await createRazorpayOrder({
    amount,
    currency,
    // Razorpay receipts are capped at 40 chars — keep it short but unique.
    receipt,
    notes: { userId, planId: plan.id, interval },
  });
  if ("apiError" in order && currency !== "INR") {
    // Most Indian Razorpay merchant accounts are only approved to settle in
    // INR — a non-INR order create can fail for that reason alone. Fall back
    // to charging in INR rather than blocking checkout entirely.
    order = await createRazorpayOrder({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { userId, planId: plan.id, interval },
    });
  }
  if ("apiError" in order) {
    return NextResponse.json({ error: "RAZORPAY_API_ERROR", detail: order.apiError }, { status: 502 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: keys.keyId,
    planName: plan.name,
  });
}
