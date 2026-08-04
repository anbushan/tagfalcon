import { PrismaClient } from "@prisma/client";
import { SETTING_DEFS } from "../src/lib/settings";

const prisma = new PrismaClient();

async function main() {
  // ---- Plans ----
  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Try every tool at low daily limits, no card required.",
      priceMonthly: 0,
      priceYearly: 0,
      tagGenLimit: 20,
      keywordSearchLimit: 20,
      rankCheckLimit: 20,
      revenueReportLimit: 5,
      trendsResearchLimit: 10,
      videoOptimizationLimit: 10,
      channelAuditLimit: 5,
      hashtagGenLimit: 20,
      uploadTimeLimit: 5,
      channelComparisonLimit: 5,
      breakoutVideoLimit: 5,
      topCreatorsLimit: 5,
      featuresJson: { history: false, export: false },
    },
    {
      name: "Creator",
      slug: "creator",
      description: "Higher daily limits plus history and CSV export for active creators.",
      priceMonthly: 49900, // ₹499.00
      priceYearly: 499000, // 2 months free
      tagGenLimit: 50,
      keywordSearchLimit: 50,
      rankCheckLimit: 25,
      revenueReportLimit: 15,
      trendsResearchLimit: 30,
      videoOptimizationLimit: 30,
      channelAuditLimit: 15,
      hashtagGenLimit: 50,
      uploadTimeLimit: 15,
      channelComparisonLimit: 15,
      breakoutVideoLimit: 15,
      topCreatorsLimit: 15,
      featuresJson: { history: true, export: true },
    },
    {
      name: "Pro",
      slug: "pro",
      description: "High-volume limits and priority support for teams and agencies.",
      priceMonthly: 99900, // ₹999.00
      priceYearly: 999000, // 2 months free
      tagGenLimit: 1000,
      keywordSearchLimit: 1000,
      rankCheckLimit: 500,
      revenueReportLimit: 100,
      trendsResearchLimit: 200,
      videoOptimizationLimit: 200,
      channelAuditLimit: 100,
      hashtagGenLimit: 1000,
      uploadTimeLimit: 100,
      channelComparisonLimit: 100,
      breakoutVideoLimit: 100,
      topCreatorsLimit: 100,
      featuresJson: { history: true, export: true, priority_support: true },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {}, // never clobber admin-edited plan fields (price, limits, description) on re-seed
      create: plan,
    });
  }

  // ---- FAQs ----
  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel anytime from your billing portal. You'll keep access until the end of the current billing period.",
      sortOrder: 1,
    },
    {
      question: "Do you offer refunds?",
      answer: "We don't offer refunds, but you can cancel anytime to avoid future charges.",
      sortOrder: 2,
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data is retained so you can pick up where you left off if you resubscribe.",
      sortOrder: 3,
    },
    {
      question: "What payment methods do you accept?",
      answer: "Cards, UPI, netbanking, and wallets via Razorpay.",
      sortOrder: 4,
    },
    {
      question: "Is there a free trial?",
      answer: "There's no separate trial, but the Free plan lets you use every tool at low daily limits, no card required.",
      sortOrder: 5,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: faq });
    }
  }

  // ---- Admin user ----
  // Login is Google-only (see src/lib/auth.ts), so there's no password to seed.
  // Set ADMIN_EMAIL to the Google account you'll actually sign in with — this
  // pre-grants that email super_admin so the very first Google sign-in lands
  // as an admin instead of a regular free-plan user.
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tagfalcon.local";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "super_admin" },
    create: {
      email: adminEmail,
      name: "Super Admin",
      role: "super_admin",
    },
  });
  console.log(`Granted super_admin to ${adminEmail} — sign in with that Google account.`);

  // ---- Landing page content stub ----
  await prisma.pageContent.upsert({
    where: { key: "landing" },
    update: {},
    create: {
      key: "landing",
      contentJson: {
        heroTitle: "Get more views with data-driven YouTube tags",
        heroSubtitle: "Generate SEO-optimized tags, research keywords, and track your video rankings.",
      },
    },
  });

  // ---- Default blog posts ----
  const blogPosts = [
    {
      title: "5 YouTube Tag Mistakes That Are Hurting Your Views",
      slug: "youtube-tag-mistakes-hurting-your-views",
      bodyMd:
        "Tags still matter for YouTube's discovery system, even if they're not the ranking silver bullet they used to be. Here are five mistakes we see constantly: stuffing tags with terms that have nothing to do with your video, copying a competitor's entire tag list instead of researching your own, ignoring your title as your best tag source, skipping brand/misspelling variants of your own channel name, and never revisiting old videos' tags as trends shift. Fix these first before chasing anything more advanced.",
      status: "published",
    },
    {
      title: "How to Actually Read Keyword Difficulty",
      slug: "how-to-read-keyword-difficulty",
      bodyMd:
        "A high difficulty score doesn't automatically mean 'avoid this keyword' — it means the obvious, high-volume angle is contested. Look at the SERP itself: are the top results from massive channels, or are there small-to-mid creators ranking too? If mid-size channels are ranking on page one, a well-optimized new video has a real shot. Difficulty is a signal to investigate, not a verdict to obey.",
      status: "published",
    },
    {
      title: "Titles vs. Tags: What Actually Moves the Needle",
      slug: "titles-vs-tags-what-moves-the-needle",
      bodyMd:
        "If you can only optimize one thing, optimize your title. YouTube weights title relevance heavily, and it's also the first thing a human decides to click on. Tags are a supporting signal — useful for catching misspellings, synonyms, and adjacent topics your title can't fit. Treat tag research as a way to inform a sharper title, not a replacement for one.",
      status: "published",
    },
  ];

  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (!existing) {
      await prisma.blogPost.create({
        data: { ...post, publishedAt: new Date() },
      });
    }
  }

  // ---- System settings (admin-configurable keys) ----
  // Pre-fills from .env on first run so /admin/config isn't empty; after
  // this, editing in the UI takes precedence over .env (see getSetting()).
  for (const def of SETTING_DEFS) {
    await prisma.systemSetting.upsert({
      where: { key: def.key },
      update: {}, // never overwrite an admin-edited value on re-seed
      create: {
        key: def.key,
        value: process.env[def.key] || null,
        category: def.category,
        label: def.label,
        isSecret: def.isSecret,
        description: def.description,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
