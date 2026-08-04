import crypto from "crypto";
import { getSetting } from "@/lib/settings";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string } | null> {
  const [keyId, keySecret] = await Promise.all([
    getSetting("RAZORPAY_KEY_ID"),
    getSetting("RAZORPAY_KEY_SECRET"),
  ]);
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes: Record<string, string>;
};

/**
 * Creates a one-time Razorpay Order. `amount` must be an integer in the
 * smallest unit of `currency` (paise for INR, cents for USD, whole yen for
 * JPY, ...) — same convention as Stripe cents.
 */
export async function createRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder | { apiError: string }> {
  const keys = await getRazorpayKeys();
  if (!keys) return { apiError: "Razorpay isn't configured yet." };

  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(keys.keyId, keys.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.description || `Razorpay API returned HTTP ${res.status}` };
  }
  return data as RazorpayOrder;
}

export async function getRazorpayOrder(orderId: string): Promise<RazorpayOrder | { apiError: string }> {
  const keys = await getRazorpayKeys();
  if (!keys) return { apiError: "Razorpay isn't configured yet." };

  const res = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}`, {
    headers: { Authorization: authHeader(keys.keyId, keys.keySecret) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { apiError: data?.error?.description || `Razorpay API returned HTTP ${res.status}` };
  }
  return data as RazorpayOrder;
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies the `razorpay_signature` returned to the client after a
 * successful Checkout.js payment: HMAC-SHA256 of `orderId|paymentId` signed
 * with the account's key secret. This proves the payment response wasn't
 * forged client-side, but the caller must still fetch the order back from
 * Razorpay to read authoritative plan/interval details (never trust
 * client-supplied plan info) — see the verify route.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  try {
    return safeEqualHex(expected, params.signature);
  } catch {
    return false;
  }
}

/**
 * Verifies the `X-Razorpay-Signature` header on incoming webhook requests:
 * HMAC-SHA256 of the raw request body signed with the webhook secret
 * (separate from the API key secret, configured in the Razorpay dashboard).
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = crypto.createHmac("sha256", params.webhookSecret).update(params.rawBody).digest("hex");
  try {
    return safeEqualHex(expected, params.signature);
  } catch {
    return false;
  }
}
