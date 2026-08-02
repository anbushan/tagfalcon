import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";
import EditableFaqCard from "@/components/EditableFaqCard";
import AddFaqForm from "@/components/AddFaqForm";
import EditableBlogPostCard from "@/components/EditableBlogPostCard";
import AddBlogPostForm from "@/components/AddBlogPostForm";
import EditableLandingHero from "@/components/EditableLandingHero";

const DEFAULT_HERO = {
  heroTitle: "Get more views with data-driven YouTube tags",
  heroSubtitle:
    "Generate SEO-optimized tags, research keywords, and track your video rankings — built on real YouTube API data.",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  const blogWhere = q ? { title: { contains: q, mode: "insensitive" as const } } : {};

  const [faqs, landingContent, posts, postsCount] = await Promise.all([
    prisma.faq.findMany({
      where: q ? { question: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.pageContent.findUnique({ where: { key: "landing" } }),
    prisma.blogPost.findMany({
      where: blogWhere,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
    }),
    prisma.blogPost.count({ where: blogWhere }),
  ]);

  const heroContent = (landingContent?.contentJson as Partial<typeof DEFAULT_HERO>) || {};

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Content</h1>

      <form className="mt-6" action="/admin/content">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search FAQ or blog posts..."
          className="w-80 rounded-md border px-3 py-2 text-sm"
        />
      </form>

      <section className="mt-8">
        <h2 className="font-medium">FAQ ({faqs.length})</h2>
        <div className="mt-3 space-y-2">
          {faqs.map((faq) => (
            <EditableFaqCard key={faq.id} faq={faq} />
          ))}
          {faqs.length === 0 && <p className="text-sm text-gray-500">No FAQ entries match.</p>}
          <AddFaqForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Landing page</h2>
        <div className="mt-3">
          <EditableLandingHero
            heroTitle={heroContent.heroTitle || DEFAULT_HERO.heroTitle}
            heroSubtitle={heroContent.heroSubtitle || DEFAULT_HERO.heroSubtitle}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Only the hero headline/subheading are editable here — the rest of the landing page
          (feature sections, how-it-works, social proof) is defined in code, not the CMS.
        </p>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Blog posts ({postsCount})</h2>
        </div>
        <div className="mt-3 space-y-2">
          {posts.map((post) => (
            <EditableBlogPostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && <p className="text-sm text-gray-500">No posts match.</p>}
          <AddBlogPostForm />
        </div>
        <Pagination basePath="/admin/content" currentPage={page} totalCount={postsCount} searchParams={{ q }} />
      </section>
    </main>
  );
}
