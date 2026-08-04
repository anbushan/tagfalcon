import { NextRequest, NextResponse } from "next/server";
import { detectCountry } from "@/lib/geo";
import { currencyForCountry } from "@/lib/currency";

/**
 * Display-only geo/currency hint for the client (e.g. pricing page estimates).
 * The actual checkout amount/currency is always re-derived server-side inside
 * /api/billing/checkout — this endpoint must never be treated as authoritative
 * for charging.
 */
export async function GET(req: NextRequest) {
  const country = await detectCountry(req);
  const currency = currencyForCountry(country);
  return NextResponse.json({ country, currency });
}
