# TagFalcon

A YouTube SEO and channel-growth toolkit. Every tool works from public YouTube data (the YouTube Data API v3, Google's autocomplete endpoint) plus rough, transparently-labeled heuristics — there's no AI/LLM involved and no fabricated numbers. Where a metric can't be honestly derived from real data, the UI says so instead of making one up.

Not affiliated with or endorsed by YouTube.

## Features

**Tools** (`/app/...`)
- **Tag Generator** — SEO-optimized tag suggestions for a video title or topic, ranked from autocomplete breadth and tags used by top-ranking videos.
- **Hashtag Generator** — same engine as Tag Generator, reformatted as hashtags, capped at YouTube's 15-hashtag limit (past that, YouTube ignores all of them).
- **Keyword Research** — estimated search volume/difficulty/competition/viability for a keyword, related keywords, an Engagement Snapshot and Ranking Landscape built from the current top 10 ranking videos, and a SERP Explorer with Ranking Videos / Patterns / Channels / Titles sub-tabs.
- **Video Rankings (Rank Checker)** — checks where a video ranks for keywords pulled from its own title and tags, with a Rank / Keyword / Source table.
- **Revenue Report** — rough monthly-earnings estimate for a channel from recent video views and category-based CPM ranges, plus channel info (start date, country, description) and any public contact info found in the About section.
- **Trends Research** — YouTube's real trending chart by region and category, with an optional language filter (script-detection on the title — only for languages with a distinct Unicode script, since YouTube's API has no language filter of its own).
- **Video Optimization** — an accordion checklist (title/description length, tag budget usage, hashtag count, engagement rate) for a single video, each item expandable into the full underlying data.
- **Channel Audit** — upload frequency/consistency, engagement rate, and views trend for a channel, each finding expandable into a chart (upload-gap chart, per-video engagement table, views-over-time chart).
- **Best Upload Time** — a channel's recent uploads bucketed by day-of-week and time-of-day (UTC), with average views per bucket, to suggest a rough best-time-to-post window.
- **Compare Channels** — two channels side by side on subscribers, total/recent views, upload cadence, and engagement rate.
- **Breakout Videos** — flags which of a channel's recent uploads over- or under-performed its own average view count, to help spot what actually resonated.
- **Keyword Workspaces** — save and organize keywords from Keyword Research into named lists.
- **History** — every past run of every tool above, searchable and paginated.

**Account & billing**
- Google sign-in only (NextAuth).
- Free / Creator / Pro plans with per-tool daily limits.
- Payments via Razorpay (one-time purchases, not auto-renewing subscriptions) — INR pricing.
- Multi-language UI: English, Spanish, Hindi, French, Tamil.

**Admin** (`/admin/...`)
- Overview dashboard (signups, MRR, plan distribution).
- Users (with a per-user usage-over-time chart and usage-by-tool breakdown), Payments (sortable/filterable/searchable), Plans (fully editable: title, description, price, every per-tool limit).
- Blog, FAQ, and landing-page content editing.
- Feedback inbox, notifications, audit log.
- Configuration page for every third-party key the app depends on (YouTube API, Razorpay, Google OAuth, Upstash Redis, AdSense, SMTP, GA).

## Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **PostgreSQL** via **Prisma**
- **NextAuth** (Google OAuth only)
- **Razorpay** for payments
- **Upstash Redis** for response caching (optional — tools work without it, just uncached)
- **Recharts** for charts
- **Stripe**: not used — see Payments above

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values below
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | yes | NextAuth config |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | yes | Google OAuth — sign-in is Google-only |
| `ADMIN_EMAIL` | yes | This Google account is granted `super_admin` on first seed |
| `YOUTUBE_API_KEY` | yes | Powers every tool — get one from the Google Cloud Console |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for payments | Also settable in `/admin/config` after first boot |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | no | Falls back to uncached calls if unset |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | no | Shows ads to Free-plan users if set |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | no | Google Analytics 4 |
| `SMTP_*`, `FEEDBACK_TO_EMAIL` | no | Outgoing email for feedback notifications |

Most of these are also editable at runtime from `/admin/config` — a database override there takes precedence over `.env` (see the caveats printed on that page about seed-time shadowing).

### Database

`npx prisma migrate dev` applies migrations; `npm run db:seed` creates the Free/Creator/Pro plans, seed FAQ/blog content, and grants `super_admin` to `ADMIN_EMAIL`. Re-running the seed never overwrites plan fields you've since edited in `/admin/plans`.

## Project structure

```
src/
  app/
    (marketing)/     public pages: landing, pricing, blog, FAQ, legal
    app/              the authenticated tool suite
    admin/            admin dashboard
    api/              route handlers (tools, billing, admin, auth, webhooks)
    login/
  components/         shared UI (chrome, charts, forms)
  lib/                business logic — one file per tool/concern, no framework code
  lib/i18n/           translation dictionaries (en/es/hi/fr/ta)
prisma/
  schema.prisma
  migrations/
  seed.ts
```

Each tool follows the same shape: a `lib/<tool>.ts` with the YouTube API calls and any scoring math, an `api/tools/<tool>/route.ts` that enforces auth + daily usage limits + persists a history row, and an `app/app/<tool>/page.tsx` client page. New tools should follow this pattern rather than inventing a new one.

## A note on "estimates"

Nothing here is real YouTube Analytics data — YouTube doesn't expose that for channels you don't own. Every score, volume, or revenue figure is a labeled, documented estimate derived from public signals (search result counts, autocomplete breadth, category-typical CPMs, a small sample of recent uploads). Where a number can't be honestly derived — like device split or real ad-auction bid data — the tool leaves it out rather than inventing one.
