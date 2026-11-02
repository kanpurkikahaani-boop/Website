# SETUP — turning on v2 (newsletter, admin blog, daily news)

These steps need your accounts, so only you can do them. Do them **in order**. The site keeps working at every step: until Supabase is connected, the blog shows a "Coming soon" page and the news page shows the newspaper directory and a "fresh headlines are on their way" message.

> **Live site shows "Coming soon" on /blogs, or "Sign-in isn't set up yet" on /admin/login?** The Supabase keys or `ADMIN_EMAIL` are missing in Vercel (step 6), or the deployment hasn't been redone since you added them. Environment variables only take effect after a **Redeploy**.

You'll need about 30–45 minutes, a Google account, and access to Vercel.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project**.
   - Name: `kanpur-ki-kahaani`
   - Region: **Mumbai (ap-south-1)**, the closest to your readers.
   - Choose a strong database password and save it in your password manager.
2. Wait for the project to finish provisioning (about 2 minutes).
3. Open **Project Settings → API** and copy three values. You'll paste them into Vercel in step 6.
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`. ⚠️ Keep this one secret: it bypasses all security rules. Never put it anywhere public.

## 2. Run the database migrations

Open **SQL Editor → New query** and run each file from `supabase/migrations/`, **one at a time, in this order**. Paste the whole file and click **Run**.

| Order | File | What it does |
|---|---|---|
| 1 | `0001_init.sql` | Tables (`admins`, `subscribers`, `posts`, `news_items`, `news_sources_health`, `news_runs`), the `is_admin()` check and all Row Level Security policies |
| 2 | `0002_storage.sql` | The `blog-images` storage bucket (public read, admin-only write, 5 MB, images only) |
| 3 | `0004_events.sql` | The `events` table, the `event-images` storage bucket (public read, admin-only write) and `cron_runs` |
| 4 | `0005_remove_seed_posts.sql` | Deletes the three pre-written stories if an earlier version inserted them. Safe to run either way |
| 5 | `0006_authors_and_post_fields.sql` | The `authors` table (public read, admin-only write), Rakshaa Mukesh's author profile, and the new article fields on `posts` (author, category, standfirst, pull quote, cover credit, key facts, plan-your-visit, glossary, further reading, link report) |
| 6 | `0007_publish_navaratri.sql` | Publishes **"Why Navaratri in Kanpur Is Something Everyone Must Experience!"** (14 Oct 2026, by Rakshaa Mukesh). Safe to run again: it updates the post in place |
| 7 | `0008_admin_v6.sql` | Admin editing: Trash (`deleted_at`), cover focal point, revision history, old-URL redirects, the audit log and the sign-in rate limit. Blog images limited to JPG/PNG/WebP, 5 MB. Safe to run again |
| 8 | `0009_team_authors.sql` | Team ↔ blog: adds a byline title to authors, gives Rakshaa Mukesh her team photo, bio and title ("Reddit & Medium Lead"), and adds Monisha MS (Blog Editor) as an author. Safe to run again |

> **New Supabase project?** Instead of the files one by one, paste `supabase/setup-all-in-one.sql` once — it is 0001–0009 joined in order.

> **Already ran the old `0003_seed_posts.sql`?** That file no longer exists. Just run `0004` and `0005`: `0005` removes those three posts. Blog posts now come only from the admin editor.

Each should finish with "Success. No rows returned".

> **Changing the Navaratri post's text or boxes later?** Edit it in `/admin/blogs` like any other post, or edit `content/blogs/navaratri-in-kanpur.*`, run `npm run build:navaratri` (regenerates `0007`) and paste `0007` again. Running `0007` again overwrites edits made in the admin editor.

## 3. Make yourself the admin

In the SQL Editor, run this with **your** email (the one you'll sign in with, in lower case):

```sql
insert into public.admins (email) values ('your-team-email@example.com');
```

Use exactly the same address for `ADMIN_EMAIL` in step 6. Both checks must match:
- the app checks `ADMIN_EMAIL`;
- the database checks the `admins` table.

## 4. Turn on sign-in (Google + email/password)

### 4a. Site URL and redirect URLs

A wrong value here is the most common cause of a login loop. In **Authentication → URL Configuration**:
- **Site URL:** `https://kanpurkikahaani.site`
- **Redirect URLs** (add all three):
  - `https://kanpurkikahaani.site/**`
  - `http://localhost:3000/**` (local testing)
  - `https://*-<your-vercel-team>.vercel.app/**` (preview deployments; replace `<your-vercel-team>` with the team slug in your preview URLs)

The site sends people back to `/admin/auth/callback` (and `/auth/callback` also works); both are covered by the patterns above.

### 4b. Google sign-in

1. Go to <https://console.cloud.google.com> → create (or pick) a project.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: *Kanpur Ki Kahaani*; support email: your email.
   - Save. You can leave it in "Testing" and add your own email as a test user.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URI:** copy it from Supabase **Authentication → Providers → Google**. It looks like `https://<your-project>.supabase.co/auth/v1/callback`.
4. Copy the **Client ID** and **Client secret** into Supabase **Authentication → Providers → Google**, toggle it **on**, and save.

### 4c. Create the admin user, then close sign-ups

1. **Authentication → Users → Add user → Create new user**:
   - Email: the same address as `ADMIN_EMAIL` (your kanpurkikahaani Google account).
   - Password: a long, unique one (this is the backup to Google sign-in).
   - Tick **Auto Confirm User**. The admin check only accepts a *verified* email.
   - (Or use **Invite user** and set the password from the email link.)
2. **Authentication → Sign In / Providers → User Signups**: turn **off** "Allow new users to sign up". Strangers can then not even create an account. Google sign-in still works for your account: Supabase links the Google login to the existing user with the same verified email.
3. Keep **Providers → Email** on (password sign-in and "Forgot password?" use it), with **Confirm email** on.

Supabase's built-in email sender is rate-limited (a few emails per hour). If reset emails are slow, add your own SMTP under **Project Settings → Auth → SMTP**. This is optional.

### 4d. 2-step verification (recommended)

Authenticator-app codes (TOTP) are on by default in Supabase (**Authentication → Multi-Factor**). After your first sign-in, open `/admin/settings` → **Enable 2-step verification** and scan the QR code. From then on every sign-in also asks for the 6-digit code.

### 4e. What the site enforces

- Only `ADMIN_EMAIL` with a verified email gets in; any other account is signed out at once ("This account doesn't have team access.").
- 5 wrong passwords in 15 minutes (per IP + email) → a cool-down message.
- Sessions end after **7 days**, or after **12 hours** without opening the admin.
- Supabase's session cookies are httpOnly, SameSite=Lax and Secure.

## 5. Generate two secrets

Run this three times (Terminal on Mac/Linux, or any online "random hex" generator you trust) and keep all three outputs:

```bash
openssl rand -hex 32
```

- The first is `CRON_SECRET`. It protects the daily news refresh.
- The second is `UNSUBSCRIBE_SECRET`. It signs newsletter unsubscribe links.
- The third is `PREVIEW_SECRET`. It signs the 1-hour preview links the editor opens.

## 6. Add the environment variables in Vercel

Go to Vercel → your project → **Settings → Environment Variables**. Add each of these for **Production**, and also **Preview** if you use preview deployments:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://kanpurkikahaani.site` |
| `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 1 (secret) |
| `ADMIN_EMAIL` | the email from step 3 |
| `CRON_SECRET` | from step 5 |
| `UNSUBSCRIBE_SECRET` | from step 5 |
| `PREVIEW_SECRET` | from step 5 |
| `NEXT_PUBLIC_GA_ID` | optional, GA4 ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional, Meta Pixel ID |

## 7. Deploy and check the daily jobs

Pushing to `main` deploys to production. `vercel.json` registers two daily cron jobs:

| Time (IST) | Job | What it does |
|---|---|---|
| 5:45 AM | `/api/cron/refresh-events` | Archives finished events and re-checks each event's BookMyShow link. A **404** unpublishes the event and flags it in red on `/admin/events`; a blocked check (403) changes nothing. |
| 6:00 AM | `/api/cron/refresh-news` | Fetches the newspaper feeds. Afterwards it also runs the blog housekeeping (`/api/cron/publish-scheduled`): refreshes pages for scheduled posts that went live, and permanently deletes posts that have been in the Trash for 30 days. |

Check both under **Settings → Cron Jobs** after the deploy. Two daily crons is the maximum on Vercel's free (Hobby) plan.

**Weekly blog link check.** On Mondays, the 5:45 AM events job also checks every link in every published post (body + boxes). The result appears under each post on `/admin/blogs`: green "All N links OK", a red "N broken links" badge, or amber "to check by hand" when a site refuses automated checks (Instagram, Facebook and BookMyShow often do). Nothing is removed automatically. To run it now:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://kanpurkikahaani.site/api/cron/check-blog-links
```

For a full article-area report (all link groups, density and new-tab rules) run `npm run check:links -- https://kanpurkikahaani.site/blogs/navaratri-in-kanpur`. It writes `reports/navaratri-in-kanpur-links.json`.

## 8. The logo

The logo is `public/brand/logo.png`: the circular badge with transparent corners, 512×512. It appears in:
- the navbar, footer, popup and admin login;
- the favicon, the app icons, the share (Open Graph) images and Google's `Organization.logo`.

To change it, replace that file with a square PNG and redeploy. If the file is ever missing, the build log prints a red **LOGO MISSING** warning.

## 8b. Click-check the BookMyShow city links (2 minutes)

BookMyShow blocks automated checks, so please open each link once and confirm it shows that city's events. They're set in `bookMyShowCityUrls` in `src/data/site.ts`.

| City | Link |
|---|---|
| Kanpur | https://in.bookmyshow.com/explore/events-kanpur |
| Lucknow | https://in.bookmyshow.com/explore/events-lucknow |
| Agra | https://in.bookmyshow.com/explore/events-agra |
| Prayagraj | https://in.bookmyshow.com/explore/events-allahabad (BookMyShow uses the old name) |
| Varanasi | https://in.bookmyshow.com/explore/events-varanasi |
| Ayodhya | https://in.bookmyshow.com/explore/home/ayodhya (city home; Ayodhya may have no events page) |

If one lands on a "city not found" page, open BookMyShow, pick the city manually, and paste the address from your browser into `site.ts`.

## 9. News sources (nothing to do)

`/news` uses only top newspapers: TOI, The Hindu, Hindustan Times, Indian Express, NDTV and India Today, plus Dainik Jagran, Amar Ujala, Hindustan, Dainik Bhaskar, Navbharat Times and their city desks. The list lives in `src/data/newsSources.ts`.

Every feed is checked live each time it's fetched; a feed that fails is skipped and shown in red on `/admin/news`. Newspaper links in the directory only appear while they return HTTP 200.

Before Supabase is set up, the site reads the feeds directly (cached for an hour). Once the daily cron has run, it reads from the database.

## 10. First news refresh and smoke test

1. Visit `https://kanpurkikahaani.site/admin/login` and sign in with Google (or a magic link). You should land on the dashboard.
2. Open **News sources → Refresh now**. After a minute it reports how many headlines were stored. `/news` then shows them, with "Last updated" in IST.
3. Open **Blogs**. It starts empty, and `/blogs` shows "Our first stories are on their way". Write a test draft, upload an image, click **Save & preview**, then delete it.
4. Open **Events → New event**. Add a real upcoming event, paste its BookMyShow page into "BookMyShow event link", upload your own photo, and click **Publish**. It appears on `/events` with a **Book on BookMyShow** button.
5. Subscribe on the home page with a test email. It should appear under **Subscribers**, and **Export CSV** should download it.
6. Sign out, then try `/admin` in a private window: you should be sent back to the login page.

---

## Day-to-day

- **Write a post:** `/admin/blogs` → **New post**.
  - Drafts autosave every 30 seconds.
  - **Publish** puts the post live on `/blogs`, the home page, the sitemap and RSS within seconds.
- **Newsletter list:** `/admin/subscribers` → **Export CSV** to import into your email tool.
  - Every email you send must include that subscriber's unsubscribe link. The code exposes `unsubscribeUrl(email)` in `src/lib/newsletter/unsubscribe.ts` for this.
- **Events:** `/admin/events` → **New event**.
  - Only paste links that start with `https://in.bookmyshow.com/`.
  - Use your own photos. Never download or copy BookMyShow's images.
  - Finished events archive themselves each morning.
- **News:** fully automatic every morning. If a feed dies, it shows in red on `/admin/news`; remove or replace it via step 9.
- **Security model**, enforced at three layers:
  1. `src/proxy.ts` blocks `/admin/*`.
  2. Every admin page, server action and route re-checks the admin on the server.
  3. Supabase Row Level Security, where only verified emails in the `admins` table can see drafts, change posts or events, read subscribers or upload images.

  `npm run test:rls` replays the attack tests against a local Postgres.

## Admin area (v6)

- Sign in at **`/admin/login`** (small "Team login" link in the footer). How to use it, with screenshots: [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md).
- **Scheduled posts** need no cron: set a future publish time and the post becomes visible on its own at that moment (the database hides it until then). `/blogs` updates instantly; the home page and the post page within 5 minutes.
- **Tests:** `npm run test:rls` (226 database security checks) and `npm run test:e2e` (19 browser tests of the whole admin flow). Both need a local Postgres 16 — see `tests/README.md`.

## Photos (update v5)

Every image slot reads from one photo manifest (`src/data/photos.json`, typed in `src/data/images.ts`). A slot without an approved photo shows the illustrated gradient tile. **A wrong photo is worse than none.**

**Status:** the tooling is built. 0 of 143 slots have photos yet, because sourcing needs network access to Wikimedia Commons / Unsplash / Pexels, which the build environment didn't have.

**To fill the photos (needs network):**
1. Allow these hosts, or turn on Full network access, in the cloud environment settings, then start a new session:
   - `commons.wikimedia.org`, `upload.wikimedia.org`
   - `api.unsplash.com`, `images.unsplash.com`
   - `api.pexels.com`, `images.pexels.com`
   - Optional: set `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY` (Commons needs no key).
2. `npm run images:source`: searches each slot, rejects wrong licences, too-small, portrait, AI-tagged and watermarked files and near-duplicates, then saves up to 8 candidates per slot in `review/`.
3. **A person looks at every candidate** and records the choice, scores (relevance ≥ 4 required), alt text, focal point and AI-check note in `reports/image-selections.json`.
4. `npm run images:process`: downloads and resizes the chosen photos (`sharp`; no AI, no cropping, metadata stripped) and writes them into the manifest.
5. `npm run images:verify && npm run images:report`:
   - `images:verify` checks licence, credit, resolution, alt text, duplicates and AI flags, and also runs before every build;
   - `images:report` regenerates `reports/image-review.html`, `reports/missing-images.md` and `IMAGE_CREDITS.md`. `/credits` updates itself.

Other commands:
- `npm run images:inventory`: lists every slot in `reports/image-inventory.json`.
- `npm run test:images`: tests the candidate filters offline.

`reports/missing-images.md` doubles as a shot list if the team would rather photograph places themselves.
