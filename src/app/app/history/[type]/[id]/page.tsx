import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChannelAvatar from "@/components/ChannelAvatar";

const VALID_TYPES = [
  "tags",
  "keywords",
  "ranks",
  "revenue",
  "trends",
  "optimization",
  "audit",
  "hashtags",
  "uploadTime",
  "compare",
  "breakout",
  "topCreators",
] as const;

export default async function HistoryDetailPage({
  params,
}: {
  params: { type: string; id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  if (!VALID_TYPES.includes(params.type as any)) notFound();

  if (params.type === "tags") {
    const item = await prisma.tagGeneration.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const tags = item.tagsJson as string[];

    return (
      <Detail backHref="/app/history?tab=tags" title={item.query} date={item.createdAt}>
        <p className="text-sm text-gray-500">Source: {item.source}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
              {tag}
            </span>
          ))}
        </div>
      </Detail>
    );
  }

  if (params.type === "keywords") {
    const item = await prisma.keywordSearch.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const related = (item.relatedJson as any[]) || [];

    return (
      <Detail backHref="/app/history?tab=keywords" title={item.keyword} date={item.createdAt}>
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Volume</p>
            <p className="font-semibold">{item.volume ?? "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Difficulty</p>
            <p className="font-semibold">{item.difficulty ?? "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Competition</p>
            <p className="font-semibold">{item.competition ?? "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Viability</p>
            <p className="font-semibold">{item.viabilityScore ?? "—"}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
      <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Related keyword</th>
              <th className="py-2">Volume</th>
              <th className="py-2">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {related.map((r: any) => (
              <tr key={r.keyword} className="border-b">
                <td className="py-2">{r.keyword}</td>
                <td className="py-2">{r.volume}</td>
                <td className="py-2">{r.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </Detail>
    );
  }

  if (params.type === "ranks") {
    const item = await prisma.rankCheck.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();

    return (
      <Detail backHref="/app/history?tab=ranks" title={item.keyword} date={item.createdAt}>
        <div className="yt-thumb-wrap aspect-video w-full max-w-sm overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Video ID: {item.videoId}
          {item.source && ` · Source: ${item.source === "title" ? "Title" : "Tag"}`}
        </p>
        <div className="mt-4 rounded-yt border border-gray-200 p-4 text-center dark:border-yt-border">
          {item.position ? (
            <p className="text-2xl font-semibold text-yt-red">#{item.position}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Not found in the top 50 results.</p>
          )}
        </div>
      </Detail>
    );
  }

  if (params.type === "revenue") {
  const item = await prisma.revenueReport.findFirst({ where: { id: params.id, userId } });
  if (!item) notFound();
  const recentVideos = (item.recentVideosJson as any[]) || [];

  return (
    <Detail backHref="/app/history?tab=revenue" title={item.channelTitle} date={item.createdAt}>
      <div className="flex items-center gap-3">
        <ChannelAvatar src={item.channelThumbnail} name={item.channelTitle} size={56} />
        {item.category && <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
        <div className="rounded-md border p-2">
          <p className="text-xs text-gray-500">Subscribers</p>
          <p className="font-semibold">{item.subscriberCount ?? "—"}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-gray-500">Total views</p>
          <p className="font-semibold">{item.totalViewCount ?? "—"}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-gray-500">Videos</p>
          <p className="font-semibold">{item.videoCount ?? "—"}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-gray-500">Est. monthly views</p>
          <p className="font-semibold">{item.estMonthlyViews ?? "—"}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-gray-500">Channel started</p>
          <p className="font-semibold">{item.channelStartDate ? item.channelStartDate.toLocaleDateString() : "—"}</p>
        </div>
      </div>
      <div className="mt-4 rounded-yt border border-gray-200 p-4 text-center dark:border-yt-border">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Est. monthly revenue</p>
        <p className="mt-1 text-2xl font-semibold text-yt-red">
          ${item.estRevenueLowUsd ?? "—"} – ${item.estRevenueHighUsd ?? "—"}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Rough estimate only — not actual YouTube revenue.</p>
      </div>
      {recentVideos.length > 0 && (
        <>
          <p className="mt-6 text-sm font-medium">Top videos by views</p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {[...recentVideos]
              .sort((a: any, b: any) => b.views - a.views)
              .slice(0, 3)
              .map((v: any) => (
                <a
                  key={v.videoId}
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-thumb-wrap block aspect-video overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3"
                >
                  {v.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                  )}
                </a>
              ))}
          </div>

          <div className="overflow-x-auto">
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Video</th>
                  <th className="py-2">Views</th>
                  <th className="py-2">Published</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.map((v: any) => (
                  <tr key={v.videoId} className="border-b">
                    <td className="py-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline"
                      >
                        {v.thumbnail && (
                          <div className="yt-thumb-wrap aspect-video w-20 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-yt-dark-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <span className="line-clamp-2">{v.title}</span>
                      </a>
                    </td>
                    <td className="py-2">{v.views}</td>
                    <td className="py-2">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Detail>
  );
  }

  if (params.type === "trends") {
    const item = await prisma.trendSearch.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const results = (item.resultsJson as any[]) || [];

    return (
      <Detail
        backHref="/app/history?tab=trends"
        title={`${item.region}${item.categoryName ? ` · ${item.categoryName}` : ""}`}
        date={item.createdAt}
      >
        <div className="space-y-2">
          {results.map((v: any, i: number) => (
            <a
              key={v.videoId}
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-yt border border-gray-200 p-3 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
            >
              <span className="w-6 shrink-0 text-center text-xs text-gray-400">#{i + 1}</span>
              {v.thumbnail && (
                <div className="yt-thumb-wrap aspect-video w-24 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-yt-dark-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium leading-snug">{v.title}</p>
                <p className="text-xs text-gray-400">{v.channelTitle}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">{v.views} views</span>
            </a>
          ))}
        </div>
      </Detail>
    );
  }

  if (params.type === "optimization") {
    const item = await prisma.videoOptimization.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const checklist = (item.checklistJson as any[]) || [];
    const details = (item.detailsJson as any) || {};

    return (
      <Detail backHref="/app/history?tab=optimization" title={item.videoTitle} date={item.createdAt}>
        {item.videoThumbnail && (
          <div className="yt-thumb-wrap aspect-video w-full max-w-sm overflow-hidden rounded-yt bg-gray-100 dark:bg-yt-dark-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.videoThumbnail} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <p className="mt-3 text-2xl font-semibold text-yt-red">{item.score}/100</p>
        <div className="mt-4 space-y-2">
          {checklist.map((c: any) => (
            <div key={c.key} className="rounded-yt border border-gray-200 p-3 text-sm dark:border-yt-border">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                    c.passed ? "bg-green-500" : "bg-amber-500"
                  }`}
                >
                  {c.passed ? "✓" : "!"}
                </span>
                <span className="font-medium">{c.label}</span>
              </div>
              <p className="mt-1 pl-7 text-xs text-gray-500 dark:text-gray-400">{c.message}</p>
            </div>
          ))}
        </div>
        {details.tags?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Tags</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {details.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-yt-dark-3">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {details.hashtags?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Hashtags</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {details.hashtags.map((tag: string, i: number) => (
                <span key={`${tag}-${i}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-yt-red dark:bg-red-950 dark:text-red-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {details.description && (
          <div className="mt-4">
            <p className="text-sm font-medium">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">{details.description}</p>
          </div>
        )}
        {typeof details.viewCount === "number" && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-md border p-2">
              <p className="text-xs text-gray-500">Views</p>
              <p className="font-semibold">{details.viewCount}</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-xs text-gray-500">Likes</p>
              <p className="font-semibold">{details.likeCount}</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-xs text-gray-500">Comments</p>
              <p className="font-semibold">{details.commentCount}</p>
            </div>
          </div>
        )}
      </Detail>
    );
  }

  if (params.type === "audit") {
    const item = await prisma.channelAudit.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const findings = (item.findingsJson as any[]) || [];
    const metrics = (item.metricsJson as any) || {};
    const recentVideos = (item.recentVideosJson as any[]) || [];

    return (
      <Detail backHref="/app/history?tab=audit" title={item.channelTitle} date={item.createdAt}>
        <div className="flex items-center gap-3">
          {item.channelThumbnail && (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.channelThumbnail} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-2xl font-semibold text-yt-red">{item.score}/100</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Subscribers</p>
            <p className="font-semibold">{metrics.subscriberCount ?? "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Avg. upload gap</p>
            <p className="font-semibold">{metrics.avgUploadGapDays != null ? `${Number(metrics.avgUploadGapDays).toFixed(1)}d` : "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Engagement</p>
            <p className="font-semibold">{metrics.engagementRate != null ? `${(metrics.engagementRate * 100).toFixed(1)}%` : "—"}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-gray-500">Views trend</p>
            <p className="font-semibold capitalize">{metrics.viewsTrend ?? "—"}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {findings.map((f: any) => (
            <div key={f.key} className="rounded-yt border border-gray-200 p-3 text-sm dark:border-yt-border">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                    f.passed ? "bg-green-500" : "bg-amber-500"
                  }`}
                >
                  {f.passed ? "✓" : "!"}
                </span>
                <span className="font-medium">{f.label}</span>
              </div>
              <p className="mt-1 pl-7 text-xs text-gray-500 dark:text-gray-400">{f.message}</p>
            </div>
          ))}
        </div>
        {recentVideos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Recent videos</p>
            <div className="mt-2 space-y-2">
              {recentVideos.map((v: any) => (
                <a
                  key={v.videoId}
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-yt border border-gray-200 p-3 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
                >
                  <div className="yt-thumb-wrap aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3">
                    {v.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium leading-snug">{v.title}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {v.views} views · {v.likes} likes · {v.comments} comments
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </Detail>
    );
  }

  if (params.type === "hashtags") {
    const item = await prisma.hashtagGeneration.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const hashtags = (item.hashtagsJson as string[]) || [];

    return (
      <Detail backHref="/app/history?tab=hashtags" title={item.query} date={item.createdAt}>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-yt-dark-3">
              {tag}
            </span>
          ))}
        </div>
      </Detail>
    );
  }

  if (params.type === "uploadTime") {
    const item = await prisma.bestUploadTime.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const breakdown = (item.breakdownJson as any) || {};
    const dayBreakdown = breakdown.dayBreakdown || [];
    const timeBreakdown = breakdown.timeBreakdown || [];

    return (
      <Detail backHref="/app/history?tab=uploadTime" title={item.channelTitle} date={item.createdAt}>
        <div className="flex items-center gap-3">
          {item.channelThumbnail && (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-yt-dark-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.channelThumbnail} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-lg font-semibold text-yt-red">{item.bestDay ?? "—"}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {dayBreakdown.map((d: any) => (
            <div key={d.day} className="rounded-md border p-2 text-center">
              <p className="text-xs text-gray-500">{d.day}</p>
              <p className="font-semibold">{d.avgViews} avg views</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {timeBreakdown.map((b: any) => (
            <div key={b.bucket} className="rounded-md border p-2 text-center">
              <p className="text-xs text-gray-500">{b.bucket}</p>
              <p className="font-semibold">{b.avgViews} avg views</p>
            </div>
          ))}
        </div>
      </Detail>
    );
  }

  if (params.type === "compare") {
    const item = await prisma.channelComparison.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const comparison = (item.comparisonJson as any) || {};

    return (
      <Detail backHref="/app/history?tab=compare" title={`${item.channelATitle} vs ${item.channelBTitle}`} date={item.createdAt}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2"></th>
                <th className="py-2">{item.channelATitle}</th>
                <th className="py-2">{item.channelBTitle}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Subscribers</td>
                <td className="py-2">{comparison.a?.subscriberCount ?? "—"}</td>
                <td className="py-2">{comparison.b?.subscriberCount ?? "—"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Total views</td>
                <td className="py-2">{comparison.a?.totalViewCount ?? "—"}</td>
                <td className="py-2">{comparison.b?.totalViewCount ?? "—"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Avg. recent views</td>
                <td className="py-2">{comparison.a?.avgRecentViews ?? "—"}</td>
                <td className="py-2">{comparison.b?.avgRecentViews ?? "—"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Engagement rate</td>
                <td className="py-2">{comparison.a ? `${(comparison.a.engagementRate * 100).toFixed(1)}%` : "—"}</td>
                <td className="py-2">{comparison.b ? `${(comparison.b.engagementRate * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Detail>
    );
  }

  if (params.type === "breakout") {
    const item = await prisma.breakoutVideo.findFirst({ where: { id: params.id, userId } });
    if (!item) notFound();
    const breakouts = (item.breakoutsJson as any[]) || [];

    return (
      <Detail backHref="/app/history?tab=breakout" title={item.channelTitle} date={item.createdAt}>
        <p className="text-sm text-gray-500">Channel average: {item.avgViews ? Math.round(item.avgViews) : "—"} views</p>
        <div className="mt-4 space-y-2">
          {breakouts.map((v: any) => (
            <a
              key={v.videoId}
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-yt border border-gray-200 p-3 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
            >
              <span className="line-clamp-1">{v.title}</span>
              <span className="shrink-0 text-xs text-gray-400">{v.ratio}× avg</span>
            </a>
          ))}
        </div>
      </Detail>
    );
  }

  const item = await prisma.topCreatorsSearch.findFirst({ where: { id: params.id, userId } });
  if (!item) notFound();
  const creators = (item.resultsJson as any[]) || [];

  return (
    <Detail
      backHref="/app/history?tab=topCreators"
      title={`${item.region}${item.categoryName ? ` · ${item.categoryName}` : ""}`}
      date={item.createdAt}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {creators.map((c: any, i: number) => (
          <a
            key={c.channelId}
            href={`https://www.youtube.com/channel/${c.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-yt border border-gray-200 p-3 text-sm hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-2"
          >
            <span className="w-6 shrink-0 text-center text-xs text-gray-400">#{i + 1}</span>
            <ChannelAvatar src={c.thumbnail} name={c.title} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.title}</p>
              <p className="text-xs text-gray-400">{c.subscriberCount ?? "—"} subscribers</p>
            </div>
          </a>
        ))}
      </div>
    </Detail>
  );
}

function Detail({
  backHref,
  title,
  date,
  children,
}: {
  backHref: string;
  title: string;
  date: Date;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href={backHref} className="text-sm text-gray-500 hover:underline">
        ← Back to History
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-xs text-gray-400">{date.toLocaleString()}</span>
      </div>
      <div className="mt-6">{children}</div>
    </main>
  );
}
