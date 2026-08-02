import { SkeletonBar, SkeletonCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-20" />
      <SkeletonCards count={3} />
    </main>
  );
}
