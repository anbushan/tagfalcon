// Pure data/functions — safe to import from both server code and client components.

/**
 * Rough, static conversion rates FROM 1 INR. Not a live feed — this is the
 * same "labeled estimate" approach used elsewhere in this app (category
 * CPMs, revenue estimates, etc.), not a precise FX quote. Revisit
 * periodically; a large real-world drift here means over/under-charging
 * international customers.
 */
export const CURRENCY_RATES_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  CAD: 0.0165,
  AUD: 0.018,
  JPY: 1.8,
  SGD: 0.016,
  AED: 0.044,
};

// Smallest-unit multiplier per currency (paise/cents = 100, yen has none).
const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,
};

function decimalsFor(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2;
}

/** ISO country code -> ISO currency code. Anything not listed here falls back to USD. */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  JP: "JPY",
  SG: "SGD",
  AE: "AED",
  // Eurozone
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", IE: "EUR",
  PT: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR",
};

const DEFAULT_CURRENCY = "USD";

export function currencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return "INR";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/**
 * Converts an amount stored in INR paise (this app's base unit for plan
 * pricing) into the smallest unit of the target currency, using the rough
 * static rate table above. Falls back to returning the INR amount unchanged
 * if the currency isn't one we have a rate for.
 */
export function convertInrPaiseToCurrency(inrPaise: number, currency: string): number {
  const rate = CURRENCY_RATES_FROM_INR[currency];
  if (!rate) return inrPaise;
  const inrRupees = inrPaise / 100;
  const amountInCurrency = inrRupees * rate;
  const multiplier = 10 ** decimalsFor(currency);
  return Math.round(amountInCurrency * multiplier);
}

/** Formats a smallest-unit amount (e.g. paise, cents) as a localized currency string. */
export function formatCurrency(amountSmallestUnit: number, currency: string): string {
  const multiplier = 10 ** decimalsFor(currency);
  const major = amountSmallestUnit / multiplier;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: decimalsFor(currency),
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(decimalsFor(currency))}`;
  }
}
