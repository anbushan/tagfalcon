"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-1 text-sm text-gray-500">{error.message || "Please try again."}</p>
          <button
            onClick={reset}
            className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
