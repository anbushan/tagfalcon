import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";
import AdSlot from "@/components/AdSlot";
import { HistoryTitle, HistoryTabs, HistorySearchInput, HistoryEmptyState } from "@/components/HistoryChrome";

const TABS = ["tags", "keywords", "ranks"] as const;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;
  const tab = (searchParams.tab ?? "tags") as (typeof TABS)[number];
  const q = searchParams.q?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  let rows: { id: string; primary: string; secondary: string; date: Date; thumbnail?: string }[] = [];
  let totalCount = 0;

  if (tab === "tags") {
    const where = { userId, ...(q ? { query: { contains: q, mode: "insensitive" as const } } : {}) };
    const [items, count] = await Promise.all([
      prisma.tagGeneration.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.tagGeneration.count({ where }),
    ]);
    totalCount = count;
    rows = items.map((i) => ({
      id: i.id,
      primary: i.query,
      secondary: `${(i.tagsJson as string[]).length} tags · ${i.source}`,
      date: i.createdAt,
    }));
  } else if (tab === "keywords") {
    const where = { userId, ...(q ? { keyword: { contains: q, mode: "insensitive" as const } } : {}) };
    const [items, count] = await Promise.all([
      prisma.keywordSearch.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.keywordSearch.count({ where }),
    ]);
    totalCount = count;
    rows = items.map((i) => ({
      id: i.id,
      primary: i.keyword,
      secondary: `viability ${i.viabilityScore ?? "—"}`,
      date: i.createdAt,
    }));
  } else {
    const where = { userId, ...(q ? { keyword: { contains: q, mode: "insensitive" as const } } : {}) };
    const [items, count] = await Promise.all([
      prisma.rankCheck.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.rankCheck.count({ where }),
    ]);
    totalCount = count;
    rows = items.map((i) => ({
      id: i.id,
      primary: i.keyword,
      secondary: i.position ? `rank #${i.position}` : "not found",
      date: i.createdAt,
      thumbnail: `https://img.youtube.com/vi/${i.videoId}/mqdefault.jpg`,
    }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <HistoryTitle />

      <HistoryTabs activeTab={tab} />

      <HistorySearchInput tab={tab} defaultValue={q} />

      <div className="mt-6 divide-y divide-gray-100 dark:divide-yt-border">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/app/history/${tab}/${row.id}`}
            className="flex items-center gap-3 py-3 text-sm hover:bg-gray-50 dark:hover:bg-yt-dark-2"
          >
            {row.thumbnail && (
              <div className="yt-thumb-wrap aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-yt-dark-3 sm:w-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.primary}</p>
              <p className="text-gray-500 dark:text-gray-400">{row.secondary}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-400">{row.date.toLocaleDateString()}</span>
          </Link>
        ))}
        {rows.length === 0 && <HistoryEmptyState hasQuery={!!q} />}
      </div>

      <Pagination basePath="/app/history" currentPage={page} totalCount={totalCount} searchParams={{ tab, q }} />

      <AdSlot slot="5555555555" />
    </main>
  );
}
