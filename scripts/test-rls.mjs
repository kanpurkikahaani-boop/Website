/**
 * Security test: applies the real migrations to a scratch Postgres (with Supabase's auth/storage
 * schemas emulated by supabase/tests/emulate-supabase.sql) and attacks every protected table as
 * anon, a signed-in non-admin, the admin email with an UNVERIFIED address, and the real admin.
 *
 *   PGHOST=/path/to/socket PGPORT=54329 PGUSER=postgres node scripts/test-rls.mjs
 *
 * Like Supabase, anon/authenticated get full table GRANTs, so Row Level Security is the only guard.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const DB = "kkk_rls_test";
const admin = new pg.Client({ database: "postgres" });
await admin.connect();
await admin.query(`drop database if exists ${DB}`);
await admin.query(`create database ${DB}`);
await admin.end();

const c = new pg.Client({ database: DB });
await c.connect();
for (const f of [
  "supabase/tests/emulate-supabase.sql",
  "supabase/migrations/0001_init.sql",
  "supabase/migrations/0002_storage.sql",
  "supabase/migrations/0004_events.sql",
  "supabase/migrations/0005_remove_seed_posts.sql",
  "supabase/migrations/0006_authors_and_post_fields.sql",
  "supabase/migrations/0008_admin_v6.sql",
  "supabase/migrations/0008_admin_v6.sql", // twice: must be re-runnable
]) {
  await c.query(readFileSync(f, "utf8"));
}

// ── Fixtures (as superuser) ──────────────────────────────────────────────
const ids = {
  admin: "00000000-0000-0000-0000-00000000000a",
  unverified: "00000000-0000-0000-0000-00000000000b",
  visitor: "00000000-0000-0000-0000-00000000000c",
};
await c.query(`insert into public.admins (email) values ('team@kanpurkikahaani.site'), ('second@kanpurkikahaani.site')`);
await c.query(
  `insert into auth.users (id, email, email_confirmed_at) values
   ($1, 'team@kanpurkikahaani.site', now()),
   ($2, 'second@kanpurkikahaani.site', null),
   ($3, 'someone@gmail.com', now())`,
  [ids.admin, ids.unverified, ids.visitor],
);
await c.query(`insert into public.posts (slug, title, status, published_at) values ('first-story', 'First story', 'published', now() - interval '1 day')`);
await c.query(`insert into public.posts (slug, title, status) values ('secret-draft', 'Secret draft', 'draft')`);
await c.query(`insert into public.posts (slug, title, status, published_at) values ('future-post', 'Scheduled', 'published', now() + interval '7 days')`);
await c.query(`insert into public.posts (slug, title, status, published_at, deleted_at) values ('trashed-post', 'In the Trash', 'published', now() - interval '2 days', now())`);
await c.query(`insert into public.post_revisions (post_id, title) select id, title from public.posts where slug = 'secret-draft'`);
await c.query(`insert into public.post_redirects (old_slug, post_id) select 'old-first-story', id from public.posts where slug = 'first-story'`);
await c.query(`insert into public.admin_audit (actor, action, detail) values ('team@kanpurkikahaani.site', 'login', 'seed')`);
await c.query(`insert into public.login_attempts (key) values ('1.2.3.4|team@kanpurkikahaani.site')`);
await c.query(`insert into public.subscribers (email, source, consent) values ('reader@example.com', 'home_popup', true)`);
await c.query(`insert into public.news_sources_health (source, items_last_run) values ('Example feed', 3)`);
await c.query(`insert into storage.objects (bucket_id, name) values ('blog-images', '2026/10/existing.jpg')`);
await c.query(`insert into storage.objects (bucket_id, name) values ('event-images', '2026/10/poster.jpg')`);
await c.query(`insert into public.events (title, category, city, start_at, status, bms_url) values
  ('Live comedy night', 'comedy', 'kanpur', now() + interval '3 days', 'published', 'https://in.bookmyshow.com/events/x'),
  ('Unannounced gig', 'music', 'lucknow', now() + interval '9 days', 'draft', null),
  ('Old expo', 'expo', 'agra', now() - interval '9 days', 'archived', null)`);

const roles = {
  anon: { role: "anon", claims: { role: "anon" } },
  "non-admin (Google, verified)": { role: "authenticated", claims: { sub: ids.visitor, email: "someone@gmail.com", role: "authenticated" } },
  "admin email, UNVERIFIED": { role: "authenticated", claims: { sub: ids.unverified, email: "second@kanpurkikahaani.site", role: "authenticated" } },
  "forged email claim": { role: "authenticated", claims: { sub: ids.visitor, email: "team@kanpurkikahaani.site", role: "authenticated" } },
  admin: { role: "authenticated", claims: { sub: ids.admin, email: "team@kanpurkikahaani.site", role: "authenticated" } },
};

/** Run one statement as a role inside a rolled-back transaction. Returns "allowed (n rows)" or "denied". */
async function as(who, sql) {
  const r = roles[who];
  await c.query("begin");
  try {
    await c.query(`set local role ${r.role}`);
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(r.claims)]);
    const res = await c.query(sql);
    return { ok: true, rows: res.rowCount ?? 0 };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    await c.query("rollback");
  }
}

const tests = [
  { name: "posts: read drafts / scheduled", sql: `select 1 from public.posts where status = 'draft' or published_at > now()`, adminExpect: (r) => r.ok && r.rows === 2, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "posts: read published", sql: `select 1 from public.posts where status = 'published' and published_at <= now()`, adminExpect: (r) => r.ok && r.rows === 2, otherExpect: (r) => r.ok && r.rows === 1 },
  { name: "posts: insert", sql: `insert into public.posts (slug, title, status) values ('hack', 'Hacked', 'published')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "posts: update published", sql: `update public.posts set title = 'Defaced'`, adminExpect: (r) => r.ok && r.rows === 4, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "posts: delete", sql: `delete from public.posts`, adminExpect: (r) => r.ok && r.rows === 4, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "events: read drafts / archived", sql: `select 1 from public.events where status <> 'published'`, adminExpect: (r) => r.ok && r.rows === 2, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "events: read published", sql: `select 1 from public.events where status = 'published'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 1 },
  { name: "events: insert", sql: `insert into public.events (title, category, city, start_at, status) values ('Fake gig', 'music', 'kanpur', now() + interval '1 day', 'published')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "events: update", sql: `update public.events set title = 'Hacked'`, adminExpect: (r) => r.ok && r.rows === 3, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "events: delete", sql: `delete from public.events`, adminExpect: (r) => r.ok && r.rows === 3, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "event-images: upload", sql: `insert into storage.objects (bucket_id, name) values ('event-images', 'x/evil.jpg')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "event-images: delete", sql: `delete from storage.objects where bucket_id = 'event-images'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "events: non-BookMyShow bms_url", sql: `insert into public.events (title, category, city, start_at, status, bms_url) values ('Phish', 'music', 'kanpur', now(), 'draft', 'https://evil.example/book')`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "authors: read (public)", sql: `select 1 from public.authors`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 1 },
  { name: "authors: insert", sql: `insert into public.authors (slug, name) values ('fake-writer', 'Fake Writer')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "authors: update", sql: `update public.authors set bio = 'Hacked'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "authors: delete", sql: `delete from public.authors`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "posts: change author/byline", sql: `update public.posts set author_id = null, standfirst = 'x'`, adminExpect: (r) => r.ok && r.rows === 4, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "cron_runs: write", sql: `insert into public.cron_runs (job) values ('refresh-events')`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "subscribers: read", sql: `select email from public.subscribers`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "subscribers: insert directly", sql: `insert into public.subscribers (email, source, consent) values ('spam@x.com', 'home_popup', true)`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "subscribers: delete", sql: `delete from public.subscribers`, adminExpect: (r) => !r.ok || r.rows === 0, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "admins: read list", sql: `select * from public.admins`, adminExpect: (r) => r.ok && r.rows === 0, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "admins: add self", sql: `insert into public.admins (email) values ('someone@gmail.com')`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "blog-images: upload", sql: `insert into storage.objects (bucket_id, name) values ('blog-images', 'x/evil.jpg')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "blog-images: delete", sql: `delete from storage.objects where bucket_id = 'blog-images'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "blog-images: read (public)", sql: `select 1 from storage.objects where bucket_id = 'blog-images'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 1 },
  { name: "news_items: insert", sql: `insert into public.news_items (url, url_hash, title, source_name, language, city, genre, published_at) values ('https://x', 'h', 't', 's', 'en', 'kanpur', 'local-news', now())`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "posts: read Trash", sql: `select 1 from public.posts where deleted_at is not null`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "posts: move to Trash", sql: `update public.posts set deleted_at = now() where slug = 'first-story'`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "post_revisions: read", sql: `select 1 from public.post_revisions`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "post_revisions: insert", sql: `insert into public.post_revisions (post_id, title) select id, 'x' from public.posts limit 1`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "post_revisions: update", sql: `update public.post_revisions set title = 'Hacked'`, adminExpect: (r) => !r.ok || r.rows === 0, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "post_revisions: delete", sql: `delete from public.post_revisions`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "post_redirects: read (public)", sql: `select 1 from public.post_redirects`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 1 },
  { name: "post_redirects: hijack", sql: `update public.post_redirects set post_id = (select id from public.posts where slug = 'secret-draft')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "post_redirects: insert", sql: `insert into public.post_redirects (old_slug, post_id) select 'evil-slug', id from public.posts limit 1`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "admin_audit: read", sql: `select 1 from public.admin_audit`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 0 },
  { name: "admin_audit: forge entry", sql: `insert into public.admin_audit (actor, action) values ('team@kanpurkikahaani.site', 'publish')`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => !r.ok },
  { name: "admin_audit: erase", sql: `delete from public.admin_audit`, adminExpect: (r) => !r.ok || r.rows === 0, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "admin_audit: rewrite", sql: `update public.admin_audit set detail = 'x'`, adminExpect: (r) => !r.ok || r.rows === 0, otherExpect: (r) => !r.ok || r.rows === 0 },
  { name: "login_attempts: read", sql: `select 1 from public.login_attempts`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "login_attempts: clear", sql: `delete from public.login_attempts`, adminExpect: (r) => !r.ok, otherExpect: (r) => !r.ok },
  { name: "blog-images: bucket = jpg/png/webp, 5 MB", sql: `select 1 from storage.buckets where id = 'blog-images' and not ('image/svg+xml' = any(allowed_mime_types)) and file_size_limit = 5242880`, adminExpect: (r) => r.ok, otherExpect: (r) => r.ok },
  { name: "news health: read", sql: `select * from public.news_sources_health`, adminExpect: (r) => r.ok && r.rows === 1, otherExpect: (r) => r.ok && r.rows === 0 },
];

const results = [];
let failures = 0;
for (const t of tests) {
  for (const who of Object.keys(roles)) {
    const r = await as(who, t.sql);
    const pass = who === "admin" ? t.adminExpect(r) : t.otherExpect(r);
    if (!pass) failures++;
    results.push({ test: t.name, as: who, result: r.ok ? `allowed (${r.rows} rows)` : `denied`, pass });
  }
}

// Service role (used only by /api/subscribe and the news cron) bypasses RLS, as intended.
await c.query("begin");
await c.query("set local role service_role");
const svc = await c.query(`insert into public.subscribers (email, source, consent) values ('via-api@example.com', 'home_band', true)`);
await c.query("rollback");
results.push({ test: "subscribers: insert via service role (API)", as: "service_role", result: `allowed (${svc.rowCount} rows)`, pass: svc.rowCount === 1 });

await c.end();

const w = (s, n) => String(s).padEnd(n);
console.log(`${w("TEST", 36)}${w("AS", 30)}${w("RESULT", 20)}OK`);
for (const r of results) console.log(`${w(r.test, 36)}${w(r.as, 30)}${w(r.result, 20)}${r.pass ? "✅" : "❌"}`);
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);
