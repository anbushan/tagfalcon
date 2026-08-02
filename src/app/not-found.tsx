import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-gray-400">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">
          Go home
        </Link>
        <Link href="/app/generator" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
          Go to the app
        </Link>
      </div>
    </main>
  );
}
