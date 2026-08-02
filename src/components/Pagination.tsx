import Link from "next/link";

export const PAGE_SIZE = 20;

export function paginationParams(page?: string) {
  const current = Math.max(1, parseInt(page || "1", 10) || 1);
  return { page: current, skip: (current - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

export default function Pagination({
  basePath,
  currentPage,
  totalCount,
  searchParams,
}: {
  basePath: string;
  currentPage: number;
  totalCount: number;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <p className="text-gray-500">
        Page {currentPage} of {totalPages} · {totalCount} total
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link href={buildHref(currentPage - 1)} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">
            ← Previous
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-gray-300">← Previous</span>
        )}
        {currentPage < totalPages ? (
          <Link href={buildHref(currentPage + 1)} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">
            Next →
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-gray-300">Next →</span>
        )}
      </div>
    </div>
  );
}
