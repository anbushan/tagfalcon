import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-24" />
      <SkeletonBar className="mt-6 h-9 w-full" />
      <SkeletonBar className="mt-4 h-9 w-72" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className="h-12 w-full" />
        ))}
      </div>
    </main>
  );
}
