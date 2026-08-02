import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
export const metadata = {
  title: "FAQ",
  description: "Answers to common questions about plans, billing, and how the tools work.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold">Frequently asked questions</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((faq) => (
          <details key={faq.id} className="rounded-md border p-4">
            <summary className="cursor-pointer font-medium">{faq.question}</summary>
            <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
