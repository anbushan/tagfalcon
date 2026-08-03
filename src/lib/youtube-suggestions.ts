import { getSetting } from "@/lib/settings";

/** Google's public suggest endpoint used for autocomplete-style expansion. */
export async function fetchYouTubeSuggestions(query: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch YouTube suggestions");
  const data = await res.json();
  return (data[1] as string[]) || [];
}

/** Pulls the tag lists off the top search results for a query — a cheap proxy for "what tags do ranking videos use". */
export async function fetchYouTubeSearchTags(query: string): Promise<string[]> {
  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return [];

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
    query
  )}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return [];
  const searchData = await searchRes.json();
  const videoIds = (searchData.items || []).map((i: any) => i.id.videoId).filter(Boolean).join(",");
  if (!videoIds) return [];

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${apiKey}`;
  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) return [];
  const videosData = await videosRes.json();

  const allTags: string[] = [];
  for (const item of videosData.items || []) {
    if (item.snippet?.tags) allTags.push(...item.snippet.tags);
  }
  return allTags;
}
