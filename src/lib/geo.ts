import { NextRequest } from "next/server";
import { cached } from "@/lib/redis";

const GEO_CACHE_TTL = 60 * 60 * 24; // 24h — an IP's country rarely changes within a day

const PRIVATE_IP_PATTERN = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd])/i;

function extractClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

async function lookupIpCountry(ip: string): Promise<string | null> {
  try {
    // Free tier, no API key — fine for a rough "which currency to show" signal, not for anything security-sensitive.
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return data.countryCode || null;
  } catch {
    return null;
  }
}

/**
 * Best-effort country detection for the current request, used to pick a
 * display/checkout currency — never for anything access-control related.
 * Prefers hosting-provider geo headers (free, no network call) and falls
 * back to a third-party IP lookup, caching by IP. Defaults to "IN" (this
 * app's home market) whenever detection isn't possible, including local dev.
 */
export async function detectCountry(req: NextRequest): Promise<string> {
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

  const ip = extractClientIp(req);
  if (!ip || PRIVATE_IP_PATTERN.test(ip)) return "IN";

  const country = await cached(`geo:${ip}`, GEO_CACHE_TTL, () => lookupIpCountry(ip));
  return country || "IN";
}
