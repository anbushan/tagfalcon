"use client";

import ErrorState from "@/components/ErrorState";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-8 py-10">
      <ErrorState error={error} reset={reset} title="Couldn't load this admin page" />
    </div>
  );
}
