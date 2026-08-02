# TagFalcon

*Smart Tags. Better Insights. Grow Faster.*

Single-folder Next.js app (App Router) — frontend, API routes (backend), and Prisma/PostgreSQL
all live together here, per your request. No separate NestJS server.

## UI redesign (YouTube-format)

Both `/app/*` and `/admin/*` now follow a YouTube-inspired structure and visual language:
- **Header** spans full width at the top (logo + hamburger left, notification bell / theme /
  language / avatar-menu right) with both sidebars living *below* it — matches YouTube's actual
  layout, not the earlier side-by-side arrangement.
- **Sidebar collapse**: the hamburger button now does double duty like YouTube's — on mobile/
  tablet (below `lg`) it opens/closes the drawer; on desktop it collapses the sidebar to an
  icon-only rail (72px, icon + tiny label) instead of the full 240px nav. State lives in
  `SidebarContext`.
- **Color system**: `tailwind.config.ts` adds a `yt-*` palette (`yt-red` #FF0000, `yt-dark`
  #0F0F0F, plus panel/border tones) and Roboto as the font. Primary actions (Generate, Research,
  Check ranking, Create workspace, pricing CTAs) are red pills; admin utility actions (Save/Edit/
  Delete on FAQ, blog, settings) were deliberately left neutral/dark rather than red — keeping
  the consumer app and the admin console visually distinct is intentional, not an oversight.
- **YouTube thumbnails**: SERP Explorer results render as a real video-card grid (thumbnail +
  duration-style badge + title + channel, hover zoom via `.yt-thumb-wrap`). Video Rankings shows
  the analyzed video's actual thumbnail (`img.youtube.com/vi/{id}/mqdefault.jpg`). History's
  Rank Checks tab and its detail page now show the same thumbnail per row/entry.
- **Data visualization**: new `InsightBarChart`/`InsightLineChart` (recharts) — Admin Overview
  gets a 7-day signup trend line and a plan-distribution bar chart; Billing gets a
  percent-of-daily-limit bar chart (color shifts gray → amber → red as you approach the limit);
  Keyword Research's Overview tab gets a volume/difficulty/viability bar chart; Video Rankings
  gets a "rank strength by keyword" bar chart.
- **Marketing pages**: new sticky `MarketingHeader` (logo, Pricing/FAQ/Blog links, theme toggle,
  Sign in) that didn't exist before. Landing page hero, deep-dive sections, and CTAs restyled to
  red pills, plus a new YouTube-grid-style thumbnail showcase section (illustrative
  gradient-placeholder "videos", not real YouTube content — there's nothing to pull real
  thumbnails from on the marketing site since it's not tied to a specific channel).
- **Responsive**: extended across the four tiers (mobile drawer → tablet drawer → desktop
  full-width sidebar → desktop collapsed rail on very large/frequent-use sessions). As stated
  elsewhere in this README, this has been reasoned through carefully but not verified in an
  actual browser at each breakpoint in this sandbox — a real visual QA pass is still the right
  next step before shipping.

## Branding

Logo/favicon assets are in `public/`:
- `logo.png` — full lockup (mark + wordmark + tagline), transparent background — used to build
  the OG image
- `logo-mark.png` — standalone falcon mark, transparent background — used by `Logo.tsx`
  (rendered in both sidebars, the footer, and the login page) and as the source for every
  generated icon below
- `icon-192.png` / `icon-512.png` — PWA install icons (opaque white background)
- `apple-touch-icon.png` (180×180) and `favicon.ico` (16/32/48 multi-res) — generated from the
  same mark
- `og-image.png` (1200×630) — the full lockup centered on white, used for link previews

All generated from the uploaded logo via Pillow (trimmed to content, background removed,
re-composited) — not hand-designed, so check them at actual size before shipping if the brand
guidelines call for tighter control over padding/safe-zone than what's here.

## Structure

```
tagfalcon/
├── prisma/
│   ├── schema.prisma      # full DB schema (users, plans, subscriptions, usage, tools, admin/CMS)
│   └── seed.ts            # seeds plans, FAQs, an admin user, landing page content
├── src/
│   ├── app/
│   │   ├── (marketing)/            # route group — owns the public Footer
│   │   │   ├── page.tsx            # landing page
│   │   │   ├── pricing/page.tsx    # pricing (reads Plan + Faq from DB)
│   │   │   ├── faq/page.tsx
│   │   │   ├── blog/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── legal/{terms,privacy,cookies}/page.tsx
│   │   ├── login/page.tsx          # Google-only sign-in, no password form
│   │   ├── app/                    # authenticated area, gated by app/layout.tsx
│   │   │   ├── layout.tsx          # auth guard + sidebar shell
│   │   │   ├── generator/page.tsx           # Tag Generator
│   │   │   ├── research/keywords/page.tsx   # Keyword Research
│   │   │   ├── research/keywords/workspaces/page.tsx
│   │   │   └── video-rankings/page.tsx
│   │   ├── admin/                  # RBAC-gated (support/admin/super_admin), read-only for now
│   │   │   ├── layout.tsx          # role guard + sidebar shell
│   │   │   ├── overview/page.tsx        # MRR, active subs, signups
│   │   │   ├── users/page.tsx           # searchable user table
│   │   │   ├── subscriptions/page.tsx   # Stripe-synced subscription list
│   │   │   ├── plans/page.tsx           # plan limits (view only)
│   │   │   ├── content/page.tsx         # FAQ / page content / blog posts (view only)
│   │   │   └── audit-log/page.tsx       # AuditLog table (nothing writes to it yet)
│   │   ├── sitemap.ts / robots.ts  # native Next.js metadata routes
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts     # login (credentials + Google)
│   │       ├── tools/tag-generator/route.ts    # YouTube-data-driven tag generation
│   │       ├── tools/keyword-research/route.ts # keyword metrics + related keywords
│   │       ├── tools/rank-checker/route.ts     # video rank lookup
│   │       ├── workspaces/route.ts             # keyword list CRUD
│   │       └── stripe/webhook/route.ts         # keeps subscriptions table in sync
│   ├── components/
│   │   ├── AppSidebar.tsx          # logged-in sidebar nav
│   │   ├── Footer.tsx              # marketing footer
│   │   └── GoogleStartFreeButton.tsx
│   └── lib/
│       ├── prisma.ts        # Prisma client singleton
│       ├── redis.ts         # Upstash Redis cache-aside helper (YouTube API cost control)
│       ├── auth.ts          # NextAuth config
│       └── usage-limits.ts  # per-plan daily limit check + increment (atomic-ish via upsert)
└── .env.example
```

## Local setup

1. **Install dependencies** (needs internet access, run this on your machine):
   ```bash
   npm install
   ```

2. **Start Postgres.** Easiest via Docker:
   ```bash
   docker run --name tagfalcon-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tagfalcon -p 5432:5432 -d postgres:16
   ```

3. **Copy env file and fill in secrets:**
   ```bash
   cp .env.example .env
   ```
   At minimum for local dev you need `DATABASE_URL` and `NEXTAUTH_SECRET`
   (generate with `openssl rand -base64 32`). `YOUTUBE_API_KEY` is required for the tools to
   return real data — get one free from Google Cloud Console (enable "YouTube Data API v3").
   Stripe and Redis keys can stay blank while developing locally (Redis calls no-op and fall
   back to direct calls; Stripe routes just won't work yet).

   **Auth is Google-only** — no password login. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   from a Google Cloud OAuth client (add `http://localhost:3000/api/auth/callback/google` as an
   authorized redirect URI). Also set `ADMIN_EMAIL` to the Google account you'll sign in with —
   the seed script grants that email `super_admin` so your first Google sign-in lands as an
   admin, not a regular user.

4. **Run the migration** (creates all tables from `schema.prisma`):
   ```bash
   npx prisma migrate dev --name init
   ```
   If you're updating an existing local DB from an earlier version of this project (before
   `SystemSetting`/`Notification` existed), just re-run this — Prisma will generate a new
   migration for the added tables.

5. **Seed the database** (plans, FAQs, admin user, landing content):
   ```bash
   npm run db:seed
   ```
   This grants `super_admin` to whatever email you set as `ADMIN_EMAIL`.

6. **(Optional, for Stripe checkout to work) Create Products/Prices in Stripe:**
   In your Stripe dashboard, create Creator and Pro products, each with a monthly and yearly
   Price. Copy the four price IDs into `STRIPE_PRICE_CREATOR_MONTHLY`, `..._YEARLY`,
   `STRIPE_PRICE_PRO_MONTHLY`, `..._YEARLY` in `.env`, then re-run `npm run db:seed` so they
   land on the `Plan` rows. Also set `STRIPE_SECRET_KEY` and, for local webhook testing, run
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the printed signing
   secret in `STRIPE_WEBHOOK_SECRET`.

6. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## What's wired up vs. what's stubbed

**Responsive design:** sidebars (both admin and user) are now a slide-in drawer below the `lg`
breakpoint, toggled by a hamburger in the shared header, with a backdrop overlay — fixed/sticky
on desktop as before. Every table wraps in `overflow-x-auto` so wide data doesn't break mobile
layout. Admin pages are capped at `max-w-6xl` so they don't stretch awkwardly on ultra-wide
monitors. Tested conceptually across the four breakpoint tiers (mobile/tablet/desktop/large);
not verified in an actual browser in this sandbox, so give it a real look on a phone before
shipping.

**GA4 event tracking:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and page views + activity events
start flowing automatically — `generate_tags`, `keyword_research`, `check_rank`,
`save_keyword_to_workspace`, `sign_in_click`, `begin_checkout`, `submit_feedback`. Errors are
tracked two ways: every error toast anywhere in the app fires `app_error` to GA automatically
(via `Toast.tsx`), and every `error.tsx` boundary reports on mount. No GA ID set → everything
no-ops safely.

**Feedback button + email:** floating button (bottom-left, hidden on `/admin` since that's not
"the user"), modal with a textarea, posts to `/api/feedback`. Every submission is saved to a new
`Feedback` table regardless of email status, then emailed to `FEEDBACK_TO_EMAIL` via SMTP if
configured (`SMTP_*` settings — configurable from `/admin/config`, same as every other key).
Nothing currently surfaces `Feedback` rows in the admin UI — for now, view them via Prisma
Studio (`npx prisma studio`) or a direct query; a dedicated admin page wasn't in scope this
round.

**SEO:** full metadata (title/description/canonical/OpenGraph/Twitter) on every marketing page
and the login page (which is `noindex`, since it's public but shouldn't rank). Structured data:
`SoftwareApplication` on the landing page, `FAQPage` on both `/pricing` and `/faq`, `Article` on
each blog post via `generateMetadata` (dynamic per-post title/description/OG image). A real
1200×630 `/public/og-image.png` is generated and committed so link previews don't 404. `/app/*`
and `/admin/*` stay out of the index via `robots.ts`'s existing disallow rules — intentional,
since none of that should be crawlable.

**Video Rankings — now URL-only, real analysis:** the form is a single "Video URL" field
(paste any YouTube URL shape — watch/shorts/youtu.be/embed, parsed by
`src/lib/youtube.ts`). Instead of making you type a keyword, it fetches the video's title +
tags via the YouTube API, derives up to 3 candidate keywords, and checks the video's ranking
for each — genuine rank *analysis* instead of a single manual lookup. Capped at 3 candidates ×
2 result-pages to control YouTube quota cost (was already a stated concern in this project).

**Tag Generator — default suggestions:** six example queries as clickable chips, shown whenever
there's no result yet. Clicking one fills the input and generates immediately.

**Keyword Research — restructured into 3 tabs:**
- **Keyword Overview** — the volume/difficulty/competition/viability cards (existing)
- **Keyword Explorer** — the related-keywords table, filter, CSV export, save-to-workspace
  (existing, just relocated)
- **SERP Explorer** (new) — shows the current top 10 YouTube search results for the keyword
  (thumbnail, title, channel), linking out to each video. New `/api/tools/serp-explorer` route.
  Fetches **on-demand only when that tab is opened**, not on every search, so users who never
  check it don't burn extra quota or an extra daily-limit hit — it shares the
  `keywordSearchCount` limit rather than adding a new one.

**Landing page — 2 new sections:** a "Tag Generator" deep-dive ("Quickly generate tags for
your videos...") and a "Keyword Research" deep-dive ("Explore our keyword research tool for
in-depth analytics..."), each with a mocked-up preview panel and a CTA straight into the tool.

**Dark/light theme:** `ThemeProvider` + toggle in the header, persisted in `localStorage`,
defaults to system preference, with an inline anti-flash script in `<head>` so there's no flash
of the wrong theme on load. **Coverage note, stated plainly**: dark mode is fully wired for the
shared chrome that wraps every page — header, both sidebars, the marketing footer, body
background — since that's what's visible everywhere. Individual page *content* (cards, tables,
inputs on most pages) mostly still uses light-mode-only classes (`bg-white`, `border-gray-200`,
etc.) without `dark:` variants. Toggling the theme works and looks right for navigation and
structure; it is not yet a fully dark-styled app end to end. Extending `dark:` variants across
every remaining page is straightforward (same pattern used here) but is real, mechanical work
across ~30 files that wasn't completed in this pass.

**Admin Feedback page (new, 8th sidebar item):** `/admin/feedback` — search, pagination, and a
detail page for every submission, linking back to the submitting user when known.

**404 page:** branded `not-found.tsx` at the root, `noindex`, with links back to the app.

**Profile page:** `/app/profile` — update name (writes through, reflected via a fixed
`useSession().update()` flow — see note below), upload a photo (client-side file → data URI,
1.5MB cap, stored directly in `avatarUrl`; fine for a solo/small app, swap for real object
storage — S3/R2/Cloudinary — before this needs to scale), email shown read-only (tied to
Google), and a type-to-confirm account deletion that cascades through subscriptions/history/
workspaces via the schema's existing `onDelete: Cascade` rules. **Real bug fixed while building
this:** the NextAuth JWT callback wasn't handling `trigger === "update"` for name/avatar, so
`useSession().update()` would silently no-op on the client even though the DB write succeeded —
`src/lib/auth.ts` now re-reads the user row from the DB on every update trigger.

**PWA:** `manifest.ts` (installable, standalone display), real 192/512px icons, and a
deliberately conservative `sw.js` — it only intercepts top-level navigations for an offline
fallback page; it does **not** cache API responses or app pages, since caching those in a
signed-in, plan-limited app would risk serving stale or wrong-user data.

**Language translation (`/app/*` pages):** implemented as a client-side dictionary switcher
(`LanguageProvider` + `useLanguage()`), not URL-prefixed locale routing — restructuring every
route under `[locale]` would have touched everything already built and risked breaking it.
4 languages: English, Spanish, Hindi, French. **Coverage is real but not uniform** — fully
translated: sidebar nav, header, Tag Generator (every string), Profile (every string), and the
title/subtitle/buttons/table-headers on Keyword Research, Video Rankings, Workspaces, History,
and Billing. **Not translated**: the `[id]` detail pages (workspace detail, history item
detail), the admin panel, and all marketing pages — those stay English-only. Language choice
persists in `localStorage`, defaults to English.

**Admin Configuration menu (7th sidebar item):** `/admin/config` — every third-party key the app depends on (YouTube, Stripe, Google OAuth, Redis, AdSense, admin email), grouped by
category, editable inline with masked secrets. Backed by a new `SystemSetting` table.
YouTube API calls, the Stripe client, and the Redis client all read through `getSetting()` now
— **editing a key here takes effect on the next request, no redeploy needed.** Google OAuth
client ID/secret are shown for reference only — NextAuth reads those from `process.env` at
boot, so editing them here genuinely requires a restart to take effect, and the page says so
rather than implying otherwise. Security note surfaced in the UI itself: values are stored as
plain text in Postgres, not encrypted — fine for a solo/small-team admin panel, not a
substitute for a real secrets manager in production.

**Logout:** shared `Header` component (sign-out button + notification bell) mounted in both
`/app/layout.tsx` and `/admin/layout.tsx`.

**Notifications:** new `Notification` table, bell icon in the header with an unread-count
badge, dropdown "alert box" (mark one read / mark all read), polls every 30s. Wired into the
two admin actions that directly affect a user: **suspend/reactivate** and **grant plan** both
notify the affected user now (e.g. "Your plan has changed"). FAQ edits don't notify anyone
since they're global content, not user-specific.

**Loading states (shimmer):** `Skeleton.tsx` primitives (`animate-pulse` bars/tables/cards)
plus a `loading.tsx` on every data-heavy route — all 7 admin pages + their `[id]` detail pages,
History + detail, Billing, Workspace detail, and the DB-backed marketing pages (pricing, FAQ,
blog + detail). Client-heavy pages (Generator, Keyword Research, Video Rankings, Workspaces
list) use inline button-state loading ("Generating...", shimmer bars while fetching) since
there's no full-page navigation to cover.

**Error boundaries:** `ErrorState.tsx` + `error.tsx` for `/admin`, `/app`, `/(marketing)`, and a
root `global-error.tsx` fallback — each shows a friendly message and a "Try again" button
instead of a blank crashed page.

**Toast notifications:** lightweight `Toast.tsx` system (`useToast()` hook, mounted app-wide in
`Providers.tsx`), wired into every write action: ban/reactivate, grant plan, FAQ add/edit/
hide/delete, workspace create, saved-keyword remove, settings save, billing portal errors, and
checkout errors.

**Detail pages:** every table row and card now drills into a full detail page.
- Admin: `/admin/users/[id]` (profile, active subscription, today's usage, recent tag/keyword/rank
  activity), `/admin/subscriptions/[id]` (Stripe IDs, billing interval, linked user),
  `/admin/plans/[id]` (full limits, Stripe price IDs, recent subscribers)
- User: `/app/research/keywords/workspaces/[id]` (full saved-keyword table with metrics and a
  working Remove action), `/app/history/[type]/[id]` (full tag list / full related-keyword table /
  full rank result for a single history entry)

**Google AdSense:** `AdSlot` component on the five regular-use pages (Generator, Keyword
Research, Video Rankings, Workspaces, History) — shown to **Free-plan users only**, hidden for
Creator/Pro (the usual incentive-to-upgrade pattern). Deliberately left off Billing, since ads
next to a payment flow is bad UX. Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` in `.env` and replace the
placeholder `data-ad-slot` values (`1111111111` etc.) with real slot IDs from your AdSense
account — without a client ID configured, `AdSlot` silently renders nothing, so it's safe to
leave unset in dev. The JWT now also carries `planSlug` (refreshed on sign-in and periodically)
so this can gate client-side without an extra fetch per page.

**Admin write actions (new):**
- **Ban/reactivate a user** — button on `/admin/users/[id]`, blocked from targeting a
  `super_admin` by accident, logs `suspend_user`/`activate_user` to the audit log
- **Grant a plan** — form on `/admin/users/[id]`, manually comps a plan without Stripe
  (cancels any existing active subscription first so there's never two "active" rows), logs
  `grant_plan`. Note: if that user later actually pays via Stripe, the webhook will create a
  real Stripe-backed subscription alongside — reconciling comped vs. paid isn't handled yet.
- **FAQ CRUD** — `/admin/content` now has inline edit/hide/delete on every FAQ card plus an
  "Add FAQ" form, logs `create_faq`/`edit_faq`/`delete_faq`
- **Blog post CRUD** — create (auto-slugified from title), edit title/body, publish/unpublish
  (stamps `publishedAt` the first time only, so re-editing doesn't reset it), delete. Logs
  `create_blog_post`/`edit_blog_post`/`delete_blog_post`.
- **Landing page hero copy** — editable from `/admin/content`, and — unlike a form that writes
  to a field nothing reads — the landing page (`(marketing)/page.tsx`) now actually fetches this
  from `PageContent` at request time (5-minute revalidate) instead of using hardcoded JSX
  strings, falling back to sensible defaults if the row doesn't exist yet. Only the
  headline/subheading are CMS-driven; the feature sections, how-it-works, and social-proof
  blocks are still defined in code — said so directly in the admin UI rather than implying more
  coverage than exists.
- All three write through `src/lib/admin.ts`'s `requireAdmin()` guard (role-checked
  server-side on the API route itself, not just the page) and `logAdminAction()`

**Working end-to-end:** DB schema + migrations + seed, plan-based daily usage limits, Tag
Generator (calls real YouTube endpoints, caches in Redis if configured, persists history),
Keyword Research (estimate-based metrics, CSV export, filter box, save-to-workspace picker),
Rank Checker, Keyword Workspaces (create + search + detail view + remove keyword), History
(tag/keyword/rank tabs, search, detail view), Billing page (current plan, today's usage, Stripe
Customer Portal button), pricing page with a real monthly/yearly toggle wired to Stripe
Checkout, Stripe webhook handler for subscription sync.

**Search/filter:** every table now has one — admin Users (email search + role/status filters),
Subscriptions (email search + status filter), Plans (name search + active/inactive filter),
Content (search across FAQ/pages/blog), Audit log (admin email + action filter); user-side
Keyword Workspaces (search names/keywords), History (per-tab search), Keyword Research related
table (client-side filter box).

**Auth:** Google-only (no email/password). `/login` is a single "Continue with Google" button.
No `PrismaAdapter` — the adapter expects NextAuth's own User/Account/Session table shapes,
which don't match our custom schema, so `src/lib/auth.ts` upserts into our own `users` table
in the `signIn` callback instead and carries `id`/`role`/`status` through the JWT. Root layout
wraps everything in `SessionProvider` so client components can call `useSession()`.

**Stripe (frontend wired up):** `/pricing` has a working monthly/yearly toggle; clicking a paid
plan calls `POST /api/billing/checkout`, which creates a real Stripe Checkout Session and
redirects there. `/app/billing` shows the current plan + today's usage and, for paying users, a
"Manage billing" button that opens the real Stripe Customer Portal via
`POST /api/billing/portal`. Both routes reuse the existing webhook's subscription-sync logic —
nothing bypasses the DB-as-source-of-truth pattern. **You still need to**: create the
Free/Creator/Pro Products+Prices in your Stripe dashboard and set `STRIPE_PRICE_*` in `.env`
(then re-run the seed) — without that, checkout returns a clear `STRIPE_PRICE_NOT_CONFIGURED`
error instead of failing silently.

**Admin panel:** RBAC-gated at `/admin/*` to `support`/`admin`/`super_admin` roles (redirects
signed-out users to `/login`, redirects signed-in-but-unauthorized users back to `/app/generator`).
Sidebar matches: Overview, Users, Subscriptions, Plans, Content, Audit log. All six pages read
real data from Postgres and now have search/filter. **Everything here is still read-only** — no
create/edit/ban/refund actions are wired up yet, and nothing currently writes to `AuditLog`.

**Stubbed / next to build:**
- Admin write actions for Plans (limits/prices) and Subscriptions (refund/comp) — Users, FAQ,
  and Blog/landing content are all editable now; Plans and Subscriptions are still read-only
  detail views
- Reconciling a comped (manually granted) plan with a later real Stripe subscription for the
  same user
- Impersonation, manual usage-limit reset
- Signup flow beyond Google (there isn't one — it's Google-only by design)

## Stale-session fix (foreign key violations)

If you reset or re-seeded the database while a browser still had an active login, you'd hit
`Foreign key constraint violated: ..._userId_fkey` on almost any action (tag generation, keyword
search, creating a workspace). Root cause: the JWT session cookie carries a `userId` that's
never re-checked against the database after the first sign-in in a session — once the DB row
behind it is gone (dropped table, reseed, manual delete), every write using that id fails at the
foreign key.

Fixed at the source: `src/lib/auth.ts`'s `jwt` callback now re-verifies the user still exists on
every request (not just sign-in), and clears the identity claims (`id`, `role`, `status`,
`planSlug`) if it doesn't — so a dangling session is correctly treated as signed-out instead of
silently passing a bad id downstream. Both `/app/*` and `/admin/*` layouts now check for a valid
`id`, not just `session?.user` (which stays truthy with stale name/email even after the id is
cleared). Every user-facing API route was refactored to a shared `requireUserId()` helper
(`src/lib/session.ts`) instead of each repeating its own `getServerSession` + manual id
extraction, so this class of bug can't quietly reappear in one route while being fixed in
another.

**If you're hitting this right now**: just sign out and sign back in — the fix makes the app
self-heal on the very next request instead of requiring a fix.

## Second bug fix round

1. **Profile removed from the sidebar** — still reachable from the header's avatar dropdown menu.
2. **Admin Notifications menu** — new `/admin/notifications` (9th sidebar item): send a
   notification to one user by email, or broadcast to everyone (with a confirm prompt), plus a
   log of recently sent notifications. New `/api/admin/notifications` route.
3. **AdSense config actually takes effect now** — found a real gap: `AdSenseScript` and `AdSlot`
   were reading `process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID` directly, which is baked in at build
   time. Editing it in `/admin/config` would update the database but silently do nothing on the
   running site until a full rebuild. Both components now fetch the client ID at runtime from a
   new public `/api/config/adsense` endpoint, so an admin change takes effect on the next page
   load — no rebuild needed.
4. **Video Rankings failing for every URL, even with a real key configured** — two real bugs,
   both fixed:
   - `fetchVideoInfo` collapsed *any* YouTube API failure (bad key, quota exceeded, referrer
     restriction, API not enabled) into a generic "video not found," which is actively
     misleading when the video obviously exists. It now surfaces the real error message from
     YouTube's API response, shown directly in the UI (e.g. "YouTube API error: API key not
     valid...") instead of a dead end.
   - **The likely actual root cause**: `getSetting()` checks the database *before* `.env`, and
     the seed script pre-fills that database row from `.env` **at seed time**. If you seed
     before putting a real key in `.env`, the database permanently stores an empty override that
     silently shadows every later `.env` change — editing `.env` afterward does nothing, with no
     obvious sign why. Fixed two ways: `/admin/config` now shows a "DB override" vs. "from .env"
     badge on every setting, and a new "Clear override" button removes the stale database row so
     `.env` takes effect again. This affects every setting, not just YouTube — if any key seems
     to ignore `.env` changes, check for this badge first.
5. **Pricing removed from the header nav and hero "See pricing" button** — the `/pricing` page
   itself still exists (footer link untouched), just not pushed as prominently while only the
   Free plan is actually available.
6. **Real YouTube thumbnails on the landing showcase section** — this was already built in the
   prior round (fetches actual trending videos via `chart=mostPopular`, falls back to gradient
   placeholders otherwise) but was silently falling back to placeholders for the same reason as
   item 4 — the YouTube key was likely being shadowed by a stale DB override with no error
   surfaced. No additional code changed here; fixing the config-shadowing issue in item 4 is what
   actually unblocks this.

## Bug fix round

18 reported issues addressed in one pass:

1. **Sign-in button showing while already logged in** — `GoogleStartFreeButton` now self-hides
   when `useSession()` reports authenticated; landing hero and footer CTA use a new `HeroCTA`
   component that shows "Go to app" instead; `/login` redirects away server-side if already
   signed in.
2. **Feedback button overlapping the sidebar** — moved from bottom-left to bottom-right.
3. & 5. **Paid plans / Upgrade should be disabled ("coming soon")** — pricing cards for
   Creator/Pro are disabled with a "Coming soon" badge and button; only Free is clickable.
   Billing's Upgrade button is now a disabled "Coming soon" pill instead of a link to checkout.
4. **Video Rankings erroring** — found and fixed a real bug: usage was incremented *before*
   validating the video, so a bad URL or unconfigured API key still burned a daily-limit unit —
   testing it a couple of times looked like "broken" because it hit the daily cap almost
   immediately. Reordered to validate first, consume quota only on a request that will actually
   succeed. Also made URL parsing tolerant of a missing `https://` prefix, and replaced raw
   error codes with readable messages client-side.
6. & 9. **Broken profile image / remove upload entirely** — new `Avatar` component always
   renders the first two letters of the email (never attempts to load the Google profile image,
   which was breaking). Photo upload UI removed from `/app/profile` entirely, along with the
   `avatarUrl` field from the profile PATCH endpoint.
7. **Daily limits raised to 20** — Free plan's tag/keyword/rank limits are now 20/20/20 (were
   5/3/2). Re-run `npm run db:seed` to apply to an existing database — the seed already upserts,
   so this updates existing rows.
8. **Surface more of the YouTube response data** — SERP Explorer cards now show the video's
   publish date (was already fetched, never rendered).
10. & 14. **"Admin" text and notification bell in admin header** — removed the "Admin" label
    text; notification bell is hidden in the admin header (`Header` takes an `isAdmin` prop) —
    admins send notifications now instead of reading their own.
11. **Admin can send notifications to users** — new "Send notification" form on
    `/admin/users/[id]`, posts to `/api/admin/users/[id]/notify`, logged to the audit trail.
12. **Real YouTube thumbnails + links on landing page** — the showcase section now fetches
    actual currently-trending YouTube videos (`chart=mostPopular`, cached 1 hour) with real
    thumbnails linking out to the real video. Falls back to the illustrative gradient
    placeholders if `YOUTUBE_API_KEY` isn't configured.
13. **Default suggestion chips on Keyword Research** — same pattern as the Tag Generator.
15. **Default blog posts seeded** — 3 published posts ship with `npm run db:seed`, same pattern
    as the default FAQ entries.
16. **Consistent width/alignment between admin and user pages** — every `/app/*` page now uses
    the same `max-w-6xl px-4 py-8 sm:px-8 sm:py-10` wrapper as `/admin/*`, instead of a mix of
    `max-w-2xl` through `max-w-4xl` with different padding.
17. **No loading feedback on Google sign-in click** — button now shows a spinner and
    "Redirecting…" immediately on click instead of appearing unresponsive during the OAuth
    redirect.
18. **Tamil added** — 5th language (English/Spanish/Hindi/French/Tamil), full dictionary
    coverage matching the other four.

**One extra fix caught along the way, not on the original list:** the exact same
event-object-as-argument bug flagged earlier on the Tag Generator's button existed on the
Keyword Research "Research" button too (`onClick={research}` where `research()` now takes an
optional keyword override) — fixed alongside the suggestion-chips work.

## Suggested next steps (in order)



1. Build `/login` and `/signup` pages
2. Add `POST /api/billing/checkout` to create a Stripe Checkout Session (pass `userId`,
   `planId`, `interval` in `metadata` — the webhook already expects these)
3. Build the History and Keyword Research/Workspace pages against the existing API routes
4. Start the admin panel (`/admin/*`, gated by `role` in the session)

Say the word and I'll build any of these next.
