import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="mt-4 h-7 w-64" />
      <SkeletonBar className="mt-6 h-24 w-full" />
    </main>
  );
}
