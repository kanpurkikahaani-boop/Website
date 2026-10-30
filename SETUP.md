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
| 3 | `0003_seed_posts.sql` | Copies the 3 original stories into the database as published posts |

Each should finish with "Success. No rows returned".

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

## 7. Merge and deploy

The v2 work is on the **`v2`** branch.
- Vercel builds a **Preview** deployment for it automatically, so you can check it first. Variables must be enabled for Preview for it to work there.
- To go live, merge `v2` into `main` on GitHub. Vercel then deploys to production.

`vercel.json` registers the daily cron job: 00:30 UTC = **6:00 AM IST**. Check it under **Settings → Cron Jobs** after the first production deploy.

## 8. Add the logo

Upload the logo as `public/brand/logo.png`: a square PNG, ideally 1024×1024. You can use GitHub's **Add file → Upload files** on the branch. It then appears automatically in:
- the navbar, footer, popup and admin login;
- the favicon, the app icons and the share (Open Graph) images.

Until then the coral **KKK** placeholder is shown, and the build log prints a red **LOGO MISSING** warning.

## 9. Verify the news sources (once)

Feed URLs must be checked from a machine that can reach the publishers. On your computer (or any environment with normal internet access), run:

```bash
npm install
npm run verify:sources
```

This fetches every candidate feed and newspaper link in `scripts/news-candidates.json`. It keeps **only** the ones that return HTTP 200 (and, for feeds, valid RSS with items), and writes them to `src/data/news-sources.verified.json`. A full report goes to `scripts/verify-sources-report.json`.

Commit and push both files. Re-run this every few months; publishers change their feed URLs.

## 10. First news refresh and smoke test

1. Visit `https://kanpurkikahaani.site/admin/login` and sign in with Google (or a magic link). You should land on the dashboard.
2. Open **News sources → Refresh now**. After a minute it reports how many headlines were stored. `/news` then shows them, with "Last updated" in IST.
3. Open **Blogs** and check the 3 original stories are listed. Write a test draft, upload an image, click **Save & preview**, then delete it.
4. Subscribe on the home page with a test email. It should appear under **Subscribers**, and **Export CSV** should download it.
5. Sign out, then try `/admin` in a private window: you should be sent back to the login page.

---

## Day-to-day

- **Write a post:** `/admin/blogs` → **New post**.
  - Drafts autosave every 30 seconds.
  - **Publish** puts the post live on `/blogs`, the home page, the sitemap and RSS within seconds.
- **Newsletter list:** `/admin/subscribers` → **Export CSV** to import into your email tool.
  - Every email you send must include that subscriber's unsubscribe link. The code exposes `unsubscribeUrl(email)` in `src/lib/newsletter/unsubscribe.ts` for this.
- **News:** fully automatic every morning. If a feed dies, it shows in red on `/admin/news`; remove or replace it via step 9.
- **Security model**, enforced at three layers:
  1. `src/proxy.ts` blocks `/admin/*`.
  2. Every admin page, server action and route re-checks the admin on the server.
  3. Supabase Row Level Security, where only verified emails in the `admins` table can see drafts, change posts, read subscribers or upload images.

  `npm run test:rls` replays the attack tests against a local Postgres.
