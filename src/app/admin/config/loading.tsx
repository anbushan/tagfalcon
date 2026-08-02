import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-40" />
      <SkeletonBar className="mt-6 h-16 w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mt-8">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="mt-2 h-24 w-full" />
        </div>
      ))}
    </main>
  );
}
