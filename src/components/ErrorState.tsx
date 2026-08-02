"use client";

import { useEffect } from "react";
import { trackError } from "@/lib/analytics";

export default function ErrorState({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    trackError(error.message || "unknown_error", { digest: error.digest, boundary: title });
  }, [error, title]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {error.message || "An unexpected error occurred. Try again, or come back in a moment."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Try again
      </button>
    </div>
  );
}
