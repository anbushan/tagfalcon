export const metadata = { title: "Terms & Conditions", alternates: { canonical: "/legal/terms" } };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">Terms & conditions</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: placeholder — replace before launch.</p>
      <div className="prose mt-8 text-gray-700">
        <p>
          This is placeholder content. Replace with your actual terms of service before going live —
          covering acceptable use, subscription billing terms, cancellation, and liability limits.
          Consider having a lawyer review this before launch.
        </p>
      </div>
    </main>
  );
}
