import { SkeletonBar, SkeletonStatCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-24" />
      <SkeletonBar className="mt-6 h-24 w-full" />
      <SkeletonStatCards count={3} />
    </main>
  );
}
