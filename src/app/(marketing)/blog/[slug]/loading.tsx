import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <SkeletonBar className="h-8 w-80" />
      <SkeletonBar className="mt-3 h-3 w-24" />
      <div className="mt-8 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className="h-4 w-full" />
        ))}
      </div>
    </main>
  );
}
