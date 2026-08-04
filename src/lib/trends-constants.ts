// Pure constants — safe to import from both server libs and client pages.

export const TREND_REGIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "SA", name: "Saudi Arabia" },
];

// Limited to languages with a Unicode script distinct enough to detect from
// a title string alone (see SCRIPT_RANGES in lib/trends.ts) — Latin-script
// languages (English, Spanish, French, ...) aren't reliably distinguishable
// this way, so they're left out rather than offering a filter that doesn't work.
export const TREND_LANGUAGES: { code: string; name: string }[] = [
  { code: "", name: "Any language" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
];

/**
 * Which of the detectable languages above are actually plausible for a given
 * region — picking e.g. "Japanese" while browsing US trends returns a
 * near-empty, confusing result set, since almost nothing in the US mostPopular
 * chart has Japanese-script titles. Regions not listed here only offer "Any
 * language" (most Latin-script-language regions aren't in TREND_LANGUAGES at
 * all, for the same script-detection reason noted above).
 */
export const REGION_LANGUAGES: Record<string, string[]> = {
  IN: ["hi", "ta"],
  JP: ["ja"],
  KR: ["ko"],
  SA: ["ar"],
};

export const TREND_CATEGORIES: { id: string; name: string }[] = [
  { id: "", name: "All categories" },
  { id: "1", name: "Film & Animation" },
  { id: "2", name: "Autos & Vehicles" },
  { id: "10", name: "Music" },
  { id: "15", name: "Pets & Animals" },
  { id: "17", name: "Sports" },
  { id: "19", name: "Travel & Events" },
  { id: "20", name: "Gaming" },
  { id: "22", name: "People & Blogs" },
  { id: "23", name: "Comedy" },
  { id: "24", name: "Entertainment" },
  { id: "25", name: "News & Politics" },
  { id: "26", name: "Howto & Style" },
  { id: "27", name: "Education" },
  { id: "28", name: "Science & Technology" },
];
