import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["tags", "keywords", "ranks"] as const;

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
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Video ID: {item.videoId}</p>
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
