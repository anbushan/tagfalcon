import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { getRazorpayOrder, verifyWebhookSignature } from "@/lib/razorpay";
import { activateSubscriptionFromOrder } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  const webhookSecret = await getSetting("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret || !signature || !verifyWebhookSignature({ rawBody, signature, webhookSecret })) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "order.paid") {
    const orderId = event.payload?.order?.entity?.id;
    const paymentId = event.payload?.payment?.entity?.id;
    if (orderId && paymentId) {
      // Re-fetch from the API rather than trusting the webhook payload's
      // notes verbatim, for the same reason as the client-verify route.
      const order = await getRazorpayOrder(orderId);
      if (!("apiError" in order)) {
        await activateSubscriptionFromOrder(order, paymentId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
