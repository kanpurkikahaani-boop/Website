# SETUP — turning on v2 (newsletter, admin blog, daily news)

These steps need your accounts, so only you can do them. Do them **in order**. The site keeps working at every step: until Supabase is connected, the blog shows the three original stories and the news page shows the newspaper directory and a "fresh headlines are on their way" message.

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

## 4. Turn on sign-in (Google + magic link)

### 4a. Site URLs

**Authentication → URL Configuration**:
- **Site URL:** `https://kanpurkikahaani.site`
- **Redirect URLs** (add both):
  - `https://kanpurkikahaani.site/admin/auth/callback`
  - `http://localhost:3000/admin/auth/callback` (for local testing)

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

### 4c. Magic link

This is the email fallback and is on by default (**Authentication → Providers → Email**). Leave "Confirm email" **on**: the admin check requires a verified address.

Supabase's built-in email sender is rate-limited. If magic links are slow, you can add your own SMTP under **Project Settings → Auth → SMTP**. This is optional.

## 5. Generate two secrets

Run this twice (Terminal on Mac/Linux, or any online "random hex" generator you trust) and keep both outputs:

```bash
openssl rand -hex 32
```

- The first is `CRON_SECRET`. It protects the daily news refresh.
- The second is `UNSUBSCRIBE_SECRET`. It signs newsletter unsubscribe links.

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
| `NEXT_PUBLIC_GA_ID` | optional, GA4 ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional, Meta Pixel ID |

## 7. Deploy and check the daily jobs

Pushing to `main` deploys to production. `vercel.json` registers two daily cron jobs:

| Time (IST) | Job | What it does |
|---|---|---|
| 5:45 AM | `/api/cron/refresh-events` | Archives finished events and re-checks each event's BookMyShow link. A **404** unpublishes the event and flags it in red on `/admin/events`; a blocked check (403) changes nothing. |
| 6:00 AM | `/api/cron/refresh-news` | Fetches the newspaper feeds |

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
