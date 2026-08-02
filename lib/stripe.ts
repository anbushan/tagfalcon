import Stripe from "stripe";
import { getSetting } from "@/lib/settings";

/**
 * Lazily builds a Stripe client from the admin-configurable secret key
 * (DB, falling back to STRIPE_SECRET_KEY in env). Call this instead of a
 * module-level singleton so a key change in /admin/config takes effect on
 * the next request without a redeploy.
 */
export async function getStripeClient(): Promise<Stripe> {
  const key = await getSetting("STRIPE_SECRET_KEY");
  return new Stripe(key || "", { apiVersion: "2024-06-20" });
}
