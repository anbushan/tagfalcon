export const metadata = { title: "Privacy Policy", alternates: { canonical: "/legal/privacy" } };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: placeholder — replace before launch.</p>
      <div className="prose mt-8 text-gray-700">
        <p>
          This is placeholder content. Replace with your actual privacy policy — covering what data
          you collect (account info, Google OAuth profile, usage/history data), how it's used, and
          how users can request deletion. Since you handle Google OAuth and Stripe payment data, this
          needs to be accurate and complete, not boilerplate.
        </p>
      </div>
    </main>
  );
}
