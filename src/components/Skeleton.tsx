export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="mt-6 w-full">
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border p-4">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="mt-3 h-6 w-16" />
          <SkeletonBar className="mt-4 h-3 w-full" />
          <SkeletonBar className="mt-2 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border p-3">
          <SkeletonBar className="h-3 w-16" />
          <SkeletonBar className="mt-2 h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="mt-6">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="mt-4 h-7 w-64" />
      <SkeletonStatCards />
      <SkeletonBar className="mt-8 h-4 w-32" />
      <SkeletonTable rows={4} cols={3} />
    </div>
  );
}
