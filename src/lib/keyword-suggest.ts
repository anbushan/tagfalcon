/**
 * Free, unauthenticated YouTube search-suggest endpoint — no API key, no
 * quota cost. Used both for keyword research's "related keywords" and for
 * the generic keyword-type autocomplete, so a typeahead never burns YouTube
 * Data API quota the way channel/video autocomplete does.
 */
export async function fetchRelatedKeywords(keyword: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    keyword
  )}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data[1] as string[]) || [];
}
