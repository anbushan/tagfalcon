import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <SkeletonBar className="h-7 w-48" />
      <SkeletonBar className="mt-2 h-4 w-96" />
      <SkeletonBar className="mt-6 h-9 w-full" />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonBar className="h-48 w-full" />
        <SkeletonBar className="h-48 w-full" />
      </div>
    </main>
  );
}
