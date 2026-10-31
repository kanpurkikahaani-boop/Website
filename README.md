# Kanpur Ki Kahaani

*The Stories of the Manchester of the East*: a tourism and city guide for Kanpur and five nearby cities (Lucknow, Agra, Prayagraj, Varanasi and Ayodhya), built for an academic digital marketing project.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Tiptap · Vercel Cron · lucide-react · Embla Carousel · Framer Motion · Open-Meteo**.

Most pages are still prerendered (static or ISR). v2 adds server features:
- the newsletter API;
- an admin-only blog editor;
- a news aggregator refreshed daily by Vercel Cron.

**👉 To switch these on, follow [`SETUP.md`](SETUP.md)** (Supabase project, migrations, Google sign-in, env vars). Without Supabase the site still builds and runs: the blog falls back to the built-in stories and the news page shows its directory.

---

## 1. Run it locally

Requirements: Node.js 20.9+ (22 recommended) and npm.

```bash
npm install
cp .env.example .env.local   # optional; see section 4
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (static + ISR pages, plus server routes for the API and admin) |
| `npm run test:news` | Unit tests for news classification and feed parsing (fixtures, no network) |
| `npm run test:rls` | Security tests: applies the migrations to a local Postgres and attacks every table as anon, non-admin, unverified admin and admin (needs `PGHOST`/`PGPORT`/`PGUSER`) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next`, core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generates route types, then runs `tsc --noEmit` |
| `npm run check` | typecheck + lint + build in one go |

`dev`, `build` and `typecheck` first run `scripts/scan-assets.mjs`. This script checks which images and logo files exist in `/public` and writes `src/generated/assets.json`. Run it again (or just restart dev) after you add images.

---

## 2. Edit content (no component changes needed)

All copy, prices, links and image paths live in typed files under **`src/data/`**. If you mistype a field, TypeScript flags it, and `npm run typecheck` will tell you where.

| File | Controls |
|---|---|
| `site.ts` | Site name, tagline, description, social links, Kanpur coordinates |
| `nav.ts` | Navbar and footer menus (one source for both) |
| `places.ts` | Places to visit in Kanpur and the five cities: category, area, duration, planner hints (`zone`, `bestSlot`, `interests`) |
| `cities.ts` | The five nearby cities: about copy, distances, times, airports, itineraries, map position. **Distances are marked `// VERIFY`** |
| `food.ts` | Food & Night Life tabs and each city's "Must-Try Food" |
| `shopping.ts`, `outdoor.ts`, `festivals.ts`, `history.ts` | Explore pages |
| `events.ts` | Upcoming events. Past events hide automatically. **Dates are `// VERIFY`** |
| `newsSources.ts` | News feeds (top national + Hindi papers and their city desks) and the newspaper directory. Each feed and link is checked live; dead ones are skipped automatically |
| `stays.ts` | Sample accommodation and the booking-link builder (UTM parameters) |
| `campus.ts` | Colleges and student tips |
| `blog.ts` | The three original stories. Since v2 posts live in Supabase and are written at `/admin/blogs`; this file is only the fallback (and the source for `0003_seed_posts.sql`) |
| `videos.ts` | YouTube IDs for "Kanpur in Motion" (**placeholders: replace `REPLACE_ME`**) |
| `playlist.ts` | Spotify playlist ID for the City Playlist page |
| `images.ts` | Home hero slides and section images |
| `og-pages.ts` | Titles used on per-page Open Graph images |

Anything uncertain (prices, event dates, hotel names, news, distances) is flagged with `sample: true` and/or `// VERIFY`. The UI also shows small "sample / indicative" notes on Accommodation, News, Events and Food.

---

## 3. Add images and the logo

- **Logo:** put the logo at `public/brand/logo.png` (square PNG, around 1024×1024). Until it exists, a coral "KKK" disc stands in everywhere: navbar, footer, favicon, apple-touch and PWA icons, and OG images.
- **Photos:** save them at `public/images/{kanpur|lucknow|agra|prayagraj|varanasi|ayodhya}/{slug}.jpg`. Each path is already referenced in the data files, and **`IMAGE_CREDITS.md`** lists all 117 of them, with what each should show and suggested free-licence sources.
- Missing photos render as a warm gradient tile with the place name (`ImageWithFallback`), so the site always looks finished.
- Every photo must actually show the place it is labelled as.

---

## 4. Environment variables

Copy `.env.example` to `.env.local` (locally) or add these in your host's dashboard:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For v2 features | Supabase project URL and public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For v2 features | **Server-only** key used by the subscribe API and the news cron. Bypasses RLS: never expose it |
| `ADMIN_EMAIL` | For v2 features | The one account allowed into `/admin` (must also be in the `admins` table) |
| `CRON_SECRET` | For v2 features | Protects `/api/cron/refresh-news` (Vercel Cron sends it automatically) |
| `UNSUBSCRIBE_SECRET` | For v2 features | Signs newsletter unsubscribe links |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public URL. Used for canonical URLs, sitemap, robots, JSON-LD and share links. Defaults to `https://kanpurkikahaani.site` |
| `NEXT_PUBLIC_GA_ID` | Optional | GA4 measurement ID (`G-XXXX`). GA loads **only** if this is set |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional | Meta Pixel ID. The pixel loads **only** if this is set |

**Tracked events** (via `track()` in `src/lib/analytics.ts`): `hero_cta_click`, `itinerary_generated`, `newsletter_signup`, `book_stay_click`, `video_play`, `city_card_click`, `share_click`.

---

## 5. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repository. The framework preset is detected as Next.js; keep the default build command (`npm run build`).
3. Add the environment variables from section 4 (at least `NEXT_PUBLIC_SITE_URL` = your production URL).
4. Deploy. Later pushes to the main branch redeploy automatically.

Netlify also works: import the repo and its Next.js runtime is detected automatically.

---

## 6. What's where

```
src/app/                  Routes (App Router). Each folder = one page
  cities/[slug]/          One template for all five nearby cities (generateStaticParams)
  blog/[slug]/            Blog posts
  og/[slug]/              Per-page Open Graph images (next/og, static)
  icon.tsx, apple-icon.tsx, pwa-icon/[size]/   Favicons and PWA icons from the logo
  sitemap.ts, robots.ts, manifest.ts
src/components/layout/    Navbar (dropdowns + mobile menu), Footer, Logo, skip link, mobile "Plan your trip" button
src/components/sections/  PageHero, Breadcrumbs, HeroCarousel, InfoStrip, PlaceGrid, FilterableCards,
                          ItineraryPlanner, HubSpokeMap, EventList, WeatherWidget, LiteYouTube, ShareButtons…
src/components/ui/        Cards, chips, pills, tabs, buttons, ImageWithFallback, FadeUp
src/data/                 All editable content
src/lib/                  itinerary.ts (planner engine), weather.ts (Open-Meteo hook), seo.ts, analytics.ts, og.tsx
```

---

## 7. Defaults and decisions

These are the choices I made without asking.

- **Next.js 16 without Cache Components.** Public pages are static or ISR (blog: 5 min, news: 1 hour), plus instant `revalidatePath` on publish and after each news refresh. Admin pages always render per request.
- **Admin security** is enforced at three layers: `src/proxy.ts`, server-side `requireAdmin()` in every admin page/action/route, and Supabase Row Level Security (`is_admin()` requires a *verified* email listed in `admins`).
- **News fair use.** Only the headline, source, time, link and at most ~140 characters of the feed's own description are stored. Article text and photos are never copied, and source favicons are hot-linked from Google's favicon service, not stored.
- **Gold text on light backgrounds** uses a deeper gold (`--accent-ink: #94661A`) so small eyebrow labels pass WCAG AA. Pure `#C8902E` is kept for dark sections, icons and the active carousel dot. `--muted` is slightly deepened (`#6F5F57`) for the same reason.
- **Shareable filters.** Filters write to the URL (`?filter=`, `?month=`, `?tab=`, `?city=`, `?tier=`). The default view is also prerendered, so every card is in the static HTML for SEO.
- **Itinerary planner rules** (`src/lib/itinerary.ts`):
  - Kanpur always keeps at least one day.
  - Each Kanpur day is anchored on one area of the city (Bithoor / Nawabganj / Mall Road / Swaroop Nagar / Jajmau) to keep travel short.
  - Lucknow counts as a day trip; the other cities are overnight trips (two days each, shrinking to one long day when days are tight).
  - Cities that still don't fit are listed with an "add more days" note.
  - Route order: Lucknow → Ayodhya → Varanasi → Prayagraj → Agra.
- **Past events** are hidden in the browser using today's date in India time, so a static build never goes stale.
- **Weather** is fetched in the browser from Open-Meteo, with a skeleton while loading, a friendly error with a retry button, and a 30-minute cache (memory + sessionStorage).
- **Videos and playlist.** Until real IDs are set, the YouTube cards open a YouTube search and the Spotify card links to Spotify search, instead of showing a broken embed.
- **News items** with `url: "#"` show "Read story ↗ (link coming soon)" instead of a dead link. **Event "Details ↗"** opens a web search for the event until you add an official URL.
- **Booking links** go to a Booking.com search for the stay's area with UTM tags and `rel="sponsored noopener"`. Sample hotels emit no structured data.
- **Privacy page.** A short `/privacy` page was added for the footer link.
- **No Relocating Guide.** There is no route, nav or footer entry for one, per the brief.
