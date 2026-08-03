import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-48" />
      <SkeletonBar className="mt-2 h-4 w-96" />
      <SkeletonBar className="mt-6 h-9 w-full" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className="h-24 w-full" />
        ))}
      </div>
    </main>
  );
}
