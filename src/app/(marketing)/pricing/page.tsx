import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PricingCards from "@/components/PricingCards";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for the Tag Generator, Keyword Research, and Rank Checker tools. Start free, upgrade anytime.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — TagFalcon",
    description: "Simple, transparent pricing. Start free, upgrade anytime.",
    url: "/pricing",
  },
};

export default async function PricingPage() {
  const [plans, faqs] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
    prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <PricingCards plans={plans} />

      <div className="mt-20">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq) => (
            <details key={faq.id} className="rounded-md border p-4">
              <summary className="cursor-pointer font-medium">{faq.question}</summary>
              <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
