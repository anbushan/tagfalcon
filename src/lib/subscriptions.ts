import { prisma } from "@/lib/prisma";
import type { RazorpayOrder } from "@/lib/razorpay";

const MS_PER_DAY = 86_400_000;

/**
 * Finds the user's current paid plan, if any. Since one-time Razorpay orders
 * have no webhook-driven auto-cancellation the way Stripe subscriptions did,
 * `status: "active"` alone isn't enough — a lapsed purchase stays "active"
 * forever unless we also check `currentPeriodEnd`. Comped plans (granted by
 * an admin) have a null currentPeriodEnd and never expire this way.
 */
export async function findActiveSubscription(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gte: now } }],
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Idempotently activates (or re-activates) a Subscription from a paid
 * Razorpay order, keyed on the unique razorpayOrderId — safe to call from
 * both the client-verify route and the webhook, whichever fires first wins
 * and the other becomes a no-op update.
 */
export async function activateSubscriptionFromOrder(order: RazorpayOrder, paymentId: string) {
  const userId = order.notes?.userId;
  const planId = order.notes?.planId;
  if (!userId || !planId) return null;

  const billingInterval = order.notes?.interval === "year" ? "year" : "month";
  const days = billingInterval === "year" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + days * MS_PER_DAY);

  return prisma.subscription.upsert({
    where: { razorpayOrderId: order.id },
    update: { razorpayPaymentId: paymentId, status: "active", currentPeriodEnd },
    create: {
      userId,
      planId,
      billingInterval,
      status: "active",
      currentPeriodEnd,
      razorpayOrderId: order.id,
      razorpayPaymentId: paymentId,
      amountPaise: order.amount,
    },
  });
}
