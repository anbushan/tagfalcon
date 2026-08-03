import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RemoveKeywordButton from "@/components/RemoveKeywordButton";
import AdSlot from "@/components/AdSlot";

export default async function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const list = await prisma.keywordList.findFirst({
    where: { id: params.id, userId },
    include: { keywords: { orderBy: { createdAt: "desc" } } },
  });
  if (!list) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/app/research/keywords/workspaces" className="text-sm text-gray-500 hover:underline">
        ← Back to Workspaces
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        <span className="text-sm text-gray-500">{list.keywords.length} keywords</span>
      </div>
      <p className="mt-1 text-sm text-gray-500">Created {list.createdAt.toLocaleDateString()}</p>

      <div className="overflow-x-auto">
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Keyword</th>
            <th className="py-2">Volume</th>
            <th className="py-2">Difficulty</th>
            <th className="py-2">Viability</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {list.keywords.map((k) => {
            const metrics = k.metricsJson as Record<string, number>;
            return (
              <tr key={k.id} className="border-b">
                <td className="py-2">{k.keyword}</td>
                <td className="py-2">{metrics.volume ?? "—"}</td>
                <td className="py-2">{metrics.difficulty ?? "—"}</td>
                <td className="py-2">{metrics.viabilityScore ?? "—"}</td>
                <td className="py-2 text-right">
                  <RemoveKeywordButton keywordId={k.id} />
                </td>
              </tr>
            );
          })}
          {list.keywords.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-500">
                No keywords saved here yet — import some from Keyword Research.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <AdSlot slot="1414141414" />
    </main>
  );
}
