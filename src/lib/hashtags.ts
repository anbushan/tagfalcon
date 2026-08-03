// YouTube ignores ALL hashtags on a video if title+description together use
// more than this many — so recommendations are capped here and anything
// beyond is shown separately as "extra, use with caution".
export const MAX_RECOMMENDED_HASHTAGS = 15;

function toHashtag(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}]+/gu, ""); // hashtags can't contain spaces or punctuation
  if (!cleaned || cleaned.length > 30) return null;
  return `#${cleaned}`;
}

export function buildHashtags(seed: string, suggestions: string[], videoTags: string[]): string[] {
  const scored = new Map<string, { tag: string; weight: number }>();
  const bump = (raw: string, weight: number) => {
    const tag = toHashtag(raw);
    if (!tag) return;
    const key = tag.toLowerCase();
    const existing = scored.get(key);
    if (existing) existing.weight += weight;
    else scored.set(key, { tag, weight });
  };

  bump(seed, 10);
  suggestions.forEach((s) => bump(s, 3));
  videoTags.forEach((t) => bump(t, 2));

  return [...scored.values()].sort((a, b) => b.weight - a.weight).map((s) => s.tag);
}
