import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-56" />
      <SkeletonBar className="mt-2 h-4 w-96" />
      <SkeletonBar className="mt-6 h-9 w-full" />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBar key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    </main>
  );
}
