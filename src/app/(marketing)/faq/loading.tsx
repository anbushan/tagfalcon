import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <SkeletonBar className="h-8 w-56" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBar key={i} className="h-12 w-full" />
        ))}
      </div>
    </main>
  );
}
