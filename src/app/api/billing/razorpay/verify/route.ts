import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { getRazorpayKeys, getRazorpayOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { activateSubscriptionFromOrder } from "@/lib/subscriptions";
import { z } from "zod";

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const keys = await getRazorpayKeys();
  if (!keys) return NextResponse.json({ error: "RAZORPAY_NOT_CONFIGURED" }, { status: 500 });

  const validSignature = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    keySecret: keys.keySecret,
  });
  if (!validSignature) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  // Never trust client-supplied plan/interval — re-fetch the order from
  // Razorpay so the authoritative notes set at order-creation time (not
  // whatever the client posts) decide what gets granted.
  const order = await getRazorpayOrder(razorpay_order_id);
  if ("apiError" in order) {
    return NextResponse.json({ error: "RAZORPAY_API_ERROR", detail: order.apiError }, { status: 502 });
  }
  if (order.notes?.userId !== userId) {
    return NextResponse.json({ error: "ORDER_USER_MISMATCH" }, { status: 403 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "ORDER_NOT_PAID" }, { status: 402 });
  }

  const subscription = await activateSubscriptionFromOrder(order, razorpay_payment_id);
  if (!subscription) {
    return NextResponse.json({ error: "ORDER_MISSING_PLAN_INFO" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
