import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <SkeletonBar className="h-8 w-24" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBar key={i} className="h-5 w-2/3" />
        ))}
      </div>
    </main>
  );
}
