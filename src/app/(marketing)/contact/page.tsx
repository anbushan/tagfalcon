export const metadata = {
  title: "Contact",
  description: "Get in touch with the TagFalcon team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="mt-4 text-gray-600">
        Questions or feedback? Email us at{" "}
        <a className="underline" href="mailto:support@tagfalcon.local">
          support@tagfalcon.local
        </a>{" "}
        — wire this up to a real support inbox before launch.
      </p>
    </main>
  );
}
