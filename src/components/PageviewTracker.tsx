"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackPageview } from "@/lib/analytics";

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    trackPageview(query ? `${pathname}?${query}` : pathname || "/");
  }, [pathname, searchParams]);

  return null;
}

export default function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}
