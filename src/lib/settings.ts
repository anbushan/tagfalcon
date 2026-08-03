import { prisma } from "@/lib/prisma";

export const SETTING_DEFS: {
  key: string;
  category: "youtube" | "razorpay" | "google_oauth" | "redis" | "adsense" | "admin" | "email" | "analytics";
  label: string;
  isSecret: boolean;
  description?: string;
}[] = [
  { key: "YOUTUBE_API_KEY", category: "youtube", label: "YouTube Data API key", isSecret: true, description: "Used by Tag Generator, Keyword Research, Rank Checker, and Revenue Report." },
  { key: "RAZORPAY_KEY_ID", category: "razorpay", label: "Razorpay key ID", isSecret: false, description: "Public key — used both server-side to create orders and client-side to open the Checkout.js widget." },
  { key: "RAZORPAY_KEY_SECRET", category: "razorpay", label: "Razorpay key secret", isSecret: true, description: "Used server-side to create orders and verify payment signatures." },
  { key: "RAZORPAY_WEBHOOK_SECRET", category: "razorpay", label: "Razorpay webhook secret", isSecret: true, description: "Set on the webhook config in the Razorpay dashboard — verifies incoming webhook requests are genuine." },
  { key: "GOOGLE_CLIENT_ID", category: "google_oauth", label: "Google OAuth client ID", isSecret: false, description: "Editing here does NOT take effect until restart — NextAuth reads this from process.env at boot, not the DB. Shown for reference/change-tracking only." },
  { key: "GOOGLE_CLIENT_SECRET", category: "google_oauth", label: "Google OAuth client secret", isSecret: true, description: "Same restart caveat as client ID." },
  { key: "UPSTASH_REDIS_REST_URL", category: "redis", label: "Upstash Redis REST URL", isSecret: false },
  { key: "UPSTASH_REDIS_REST_TOKEN", category: "redis", label: "Upstash Redis REST token", isSecret: true },
  { key: "NEXT_PUBLIC_ADSENSE_CLIENT_ID", category: "adsense", label: "AdSense client ID", isSecret: false, description: "Public value baked in at build time — editing here updates the DB copy but a rebuild is needed for the client-side script tag to pick it up." },
  { key: "ADMIN_EMAIL", category: "admin", label: "Default admin email (used by seed)", isSecret: false },
  { key: "NEXT_PUBLIC_GA_MEASUREMENT_ID", category: "analytics", label: "GA4 measurement ID", isSecret: false, description: "Public value baked in at build time (NEXT_PUBLIC_*) — same rebuild caveat as AdSense." },
  { key: "SMTP_HOST", category: "email", label: "SMTP host", isSecret: false },
  { key: "SMTP_PORT", category: "email", label: "SMTP port", isSecret: false },
  { key: "SMTP_USER", category: "email", label: "SMTP username", isSecret: false },
  { key: "SMTP_PASS", category: "email", label: "SMTP password", isSecret: true },
  { key: "SMTP_FROM", category: "email", label: "\"From\" address for outgoing email", isSecret: false },
  { key: "FEEDBACK_TO_EMAIL", category: "email", label: "Feedback recipient email", isSecret: false, description: "Where the feedback-widget submissions get emailed." },
];

// Simple in-process cache so hot paths (tag generation, checkout) don't hit
// the DB on every call. Cleared whenever a setting is written.
const cache = new Map<string, string | null>();

export async function getSetting(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;

  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const dbValue = row?.value?.trim();
  const value = dbValue ? dbValue : process.env[key] || null;

  cache.set(key, value);
  return value;
}

export async function setSetting(key: string, value: string, updatedBy: string) {
  const def = SETTING_DEFS.find((d) => d.key === key);
  if (!def) throw new Error(`Unknown setting key: ${key}`);

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedBy },
    create: {
      key,
      value,
      category: def.category,
      label: def.label,
      isSecret: def.isSecret,
      description: def.description,
      updatedBy,
    },
  });

  cache.delete(key);
}

/**
 * Clears a DB-stored override so getSetting() falls back to .env again.
 * Important escape hatch: the seed script pre-fills these rows from
 * process.env at seed time, so if you seed before .env has the real value,
 * the DB row silently shadows every later .env change until cleared here.
 */
export async function clearSetting(key: string, updatedBy: string) {
  await prisma.systemSetting.updateMany({
    where: { key },
    data: { value: null, updatedBy },
  });
  cache.delete(key);
}
