import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

function excerpt(bodyMd: string, length = 155): string {
  const plain = bodyMd.replace(/\s+/g, " ").trim();
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.status !== "published") return { title: "Post not found" };

  const description = excerpt(post.bodyMd);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverUrl ? [post.coverUrl] : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverUrl ? [post.coverUrl] : ["/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.status !== "published") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.publishedAt?.toISOString(),
    image: post.coverUrl ? [post.coverUrl] : undefined,
    description: excerpt(post.bodyMd),
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold">{post.title}</h1>
      {post.publishedAt && (
        <p className="mt-2 text-sm text-gray-500">{post.publishedAt.toLocaleDateString()}</p>
      )}
      <article className="prose mt-8 whitespace-pre-wrap text-gray-700">{post.bodyMd}</article>
    </main>
  );
}
