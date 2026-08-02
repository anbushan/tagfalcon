/**
 * Extracts a YouTube video ID from any common URL shape (watch, youtu.be,
 * shorts, embed) or returns the input unchanged if it already looks like a
 * bare 11-char video ID.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1) || null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}
