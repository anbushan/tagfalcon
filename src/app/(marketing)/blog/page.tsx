import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
export const metadata = {
  title: "Blog",
  description: "Tips on YouTube SEO, tags, and keyword research.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">Blog</h1>
      {posts.length === 0 && <p className="mt-4 text-gray-600">No posts published yet.</p>}
      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="block">
            <h2 className="font-medium hover:underline">{post.title}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}
