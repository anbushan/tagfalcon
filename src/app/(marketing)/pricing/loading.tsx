import { SkeletonBar, SkeletonCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SkeletonBar className="mx-auto h-8 w-32" />
      <SkeletonBar className="mx-auto mt-8 h-10 w-56" />
      <SkeletonCards count={3} />
    </main>
  );
}
