import type { Metadata } from "next";
import Link from "next/link";
import { Video, TrendingUp, BarChart3, LogIn, Search, ClipboardCheck } from "lucide-react";
import HeroCTA from "@/components/HeroCTA";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { cached } from "@/lib/redis";

export const revalidate = 300; // hero copy is admin-editable, so refresh reasonably often

export const metadata: Metadata = {
  title: "YouTube Tag Generator & Keyword Research Tool",
  description:
    "Generate SEO-optimized YouTube tags, research keywords with volume and difficulty estimates, and track your video rankings — free to start.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TagFalcon — Smart Tags. Better Insights. Grow Faster.",
    description:
      "Generate SEO-optimized YouTube tags, research keywords, and track your video rankings.",
    url: "/",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TagFalcon — Smart Tags. Better Insights. Grow Faster.",
    description: "Generate SEO-optimized YouTube tags, research keywords, and track rankings.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TagFalcon",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "YouTube tag generator, keyword research, and video rank checker for creators.",
};

const DEFAULT_HERO = {
  heroTitle: "Get more views with data-driven YouTube tags",
  heroSubtitle:
    "Generate SEO-optimized tags, research keywords, and track your video rankings — built on real YouTube API data.",
};

const SHOWCASE_PLACEHOLDER = [
  { title: "how to edit videos on iphone", channel: "Creator Toolkit", gradient: "from-red-500 to-orange-400" },
  { title: "beginner guitar lessons", channel: "Music Made Simple", gradient: "from-indigo-500 to-blue-400" },
  { title: "home workout routine", channel: "Fit Daily", gradient: "from-emerald-500 to-teal-400" },
  { title: "react tutorial for beginners", channel: "Code with Us", gradient: "from-purple-500 to-fuchsia-400" },
];

type TrendingVideo = { videoId: string; title: string; channelTitle: string; thumbnail: string };

async function getTrendingVideos(): Promise<TrendingVideo[]> {
  const apiKey = await getSetting("YOUTUBE_API_KEY");
  if (!apiKey) return [];

  return cached("landing:trending-videos", 60 * 60, async () => {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=4&regionCode=US&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        videoId: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      }));
    } catch {
      return [];
    }
  });
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export default async function LandingPage() {
  const [pageContent, trending] = await Promise.all([
    prisma.pageContent.findUnique({ where: { key: "landing" } }),
    getTrendingVideos(),
  ]);
  const content = (pageContent?.contentJson as Partial<typeof DEFAULT_HERO>) || {};
  const heroTitle = content.heroTitle || DEFAULT_HERO.heroTitle;
  const heroSubtitle = content.heroSubtitle || DEFAULT_HERO.heroSubtitle;
  const hasTrending = trending.length > 0;

  return (
    <main className="dark:bg-yt-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{heroTitle}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{heroSubtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <HeroCTA />
        </div>
        <p className="mt-3 text-xs text-gray-400">Free plan, no card required.</p>
      </section>

      {/* YouTube-style thumbnail showcase */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {hasTrending
            ? trending.map((video) => (
                <a
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="yt-thumb-wrap relative aspect-video overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <PlayIcon />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-yt-red">
                    {video.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{video.channelTitle}</p>
                </a>
              ))
            : SHOWCASE_PLACEHOLDER.map((item) => (
                <div key={item.title}>
                  <div
                    className={`yt-thumb-wrap relative aspect-video overflow-hidden rounded-yt bg-gradient-to-br ${item.gradient}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50">
                        <PlayIcon />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.channel}</p>
                </div>
              ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          {hasTrending
            ? "Currently trending on YouTube — tap any thumbnail to watch."
            : "Titles like these get their tags generated with TagFalcon in seconds."}
        </p>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl grid grid-cols-1 gap-8 border-t border-gray-100 px-6 py-16 dark:border-yt-border sm:grid-cols-3">
        <div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-yt-red dark:bg-red-900/30">
            <Video size={20} />
          </span>
          <h3 className="mt-3 font-semibold">Real YouTube data</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tags are ranked from live autocomplete and search data, not guesswork.
          </p>
        </div>
        <div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <TrendingUp size={20} />
          </span>
          <h3 className="mt-3 font-semibold">Keyword research</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            See estimated volume, difficulty, and viability for hundreds of related keywords.
          </p>
        </div>
        <div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <BarChart3 size={20} />
          </span>
          <h3 className="mt-3 font-semibold">Rank tracking</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Check exactly where your video ranks for any keyword.
          </p>
        </div>
      </section>

      {/* Tool deep dive: Tag Generator */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-yt-red">Tag Generator</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Quickly generate tags for your videos
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Paste a title or topic and get a ranked, SEO-optimized tag set in seconds — pulled
              from live YouTube autocomplete and search data, not guesswork. Copy them straight
              into YouTube Studio, no manual research required.
            </p>
            <Link
              href="/app/generator"
              className="mt-5 inline-block rounded-full bg-yt-red px-5 py-2.5 text-sm font-medium text-white hover:bg-yt-red-dark"
            >
              Try the Tag Generator
            </Link>
          </div>
          <div className="rounded-yt border border-gray-200 bg-gray-50 p-6 dark:border-yt-border dark:bg-yt-panel">
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 dark:border-yt-border dark:bg-yt-dark-2">
              how to edit videos on iphone
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["iphone video editing", "how to edit videos", "iphone editing app", "mobile video editing tutorial"].map(
                (tag) => (
                  <span key={tag} className="rounded-full bg-red-50 px-3 py-1 text-xs text-yt-red dark:bg-red-950 dark:text-red-300">
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tool deep dive: Keyword Research */}
      <section className="border-t border-gray-100 bg-gray-50 dark:border-yt-border dark:bg-yt-panel">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2">
            <div className="order-2 rounded-yt border border-gray-200 bg-white p-6 dark:border-yt-border dark:bg-yt-dark-2 sm:order-1">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg border border-gray-200 p-2 dark:border-yt-border">
                  <p className="text-gray-400">Volume</p>
                  <p className="mt-1 text-base font-semibold">72</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-2 dark:border-yt-border">
                  <p className="text-gray-400">Difficulty</p>
                  <p className="mt-1 text-base font-semibold">41</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-2 dark:border-yt-border">
                  <p className="text-gray-400">Viability</p>
                  <p className="mt-1 text-base font-semibold text-yt-red">58</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {["beginner guitar chords", "guitar practice routine", "easy songs on guitar"].map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs dark:border-yt-border"
                  >
                    <span>{k}</span>
                    <span className="text-gray-400">est. volume 40–90</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <p className="text-sm font-medium text-yt-red">Keyword Research</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Explore our keyword research tool for in-depth analytics
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Get volume, difficulty, competition, and viability estimates for any keyword, plus
                dozens of related terms to explore — then save the ones worth targeting straight
                into a workspace. Built to help you find the topics worth making a video about,
                not just the ones with the most searches.
              </p>
              <Link
                href="/app/research/keywords"
                className="mt-5 inline-block rounded-full bg-yt-red px-5 py-2.5 text-sm font-medium text-white hover:bg-yt-red-dark"
              >
                Explore keywords
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 dark:border-yt-border">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <h2 className="text-center text-2xl font-semibold">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yt-red text-white">
                <LogIn size={22} />
              </div>
              <h3 className="mt-4 font-medium">Sign in with Google</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Takes 10 seconds, no card required for the free plan.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yt-red text-white">
                <Search size={22} />
              </div>
              <h3 className="mt-4 font-medium">Paste a title or keyword</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">We pull live YouTube data and rank the best tags for it.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yt-red text-white">
                <ClipboardCheck size={22} />
              </div>
              <h3 className="mt-4 font-medium">Copy into YouTube Studio</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">One click to copy all tags, or export your keyword lists as CSV.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-3xl font-bold text-yt-red">12,000+</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Creators using the free plan</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yt-red">400k+</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Tag sets generated</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yt-red">4.7/5</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Average creator rating</p>
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-400">Illustrative placeholder numbers — swap in real metrics before launch.</p>
      </section>
    </main>
  );
}
