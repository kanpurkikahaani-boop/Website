-- Kanpur Ki Kahaani v6 — admin editing: Trash, revisions, slug redirects, audit log, login rate limit.
-- Safe to run more than once. Run after 0007.

-- ── Posts: Trash + cover focal point ──────────────────────────────────────
alter table public.posts
  add column if not exists deleted_at timestamptz,
  add column if not exists cover_focal text check (cover_focal is null or cover_focal ~ '^\d{1,3}% \d{1,3}%$');
create index if not exists posts_deleted_idx on public.posts (deleted_at);

-- Visitors see only published, already-due, not-trashed posts. (Admins: separate policy, sees all.)
drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now() and deleted_at is null);

-- ── Revision history (admin only) ──────────────────────────────────────────
create table if not exists public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  title text not null,
  content_json jsonb,
  saved_by text,
  saved_at timestamptz not null default now()
);
create index if not exists post_revisions_post_idx on public.post_revisions (post_id, saved_at desc);
alter table public.post_revisions enable row level security;
drop policy if exists "admin reads revisions" on public.post_revisions;
drop policy if exists "admin writes revisions" on public.post_revisions;
drop policy if exists "admin deletes revisions" on public.post_revisions;
create policy "admin reads revisions" on public.post_revisions for select to authenticated using (public.is_admin());
create policy "admin writes revisions" on public.post_revisions for insert to authenticated with check (public.is_admin());
create policy "admin deletes revisions" on public.post_revisions for delete to authenticated using (public.is_admin());
grant select, insert, delete on public.post_revisions to authenticated;

-- ── Old slugs → 301 to the post's current URL ─────────────────────────────
create table if not exists public.post_redirects (
  old_slug text primary key check (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.post_redirects enable row level security;
drop policy if exists "public reads redirects" on public.post_redirects;
drop policy if exists "admin writes redirects" on public.post_redirects;
drop policy if exists "admin updates redirects" on public.post_redirects;
drop policy if exists "admin deletes redirects" on public.post_redirects;
create policy "public reads redirects" on public.post_redirects for select to anon, authenticated using (true);
create policy "admin writes redirects" on public.post_redirects for insert to authenticated with check (public.is_admin());
create policy "admin updates redirects" on public.post_redirects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes redirects" on public.post_redirects for delete to authenticated using (public.is_admin());
grant select on public.post_redirects to anon, authenticated;
grant insert, update, delete on public.post_redirects to authenticated;

-- ── Audit log (admin reads; rows are only ever added) ──────────────────────
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null check (action in ('login', 'login_denied', 'logout', 'create', 'update', 'publish', 'unpublish', 'schedule', 'trash', 'restore', 'purge', 'revision_restore', 'duplicate', 'mfa_enrol', 'mfa_remove')),
  post_id uuid,
  detail text
);
create index if not exists admin_audit_at_idx on public.admin_audit (at desc);
alter table public.admin_audit enable row level security;
drop policy if exists "admin reads audit" on public.admin_audit;
drop policy if exists "admin adds audit" on public.admin_audit;
create policy "admin reads audit" on public.admin_audit for select to authenticated using (public.is_admin());
create policy "admin adds audit" on public.admin_audit for insert to authenticated with check (public.is_admin());
grant select, insert on public.admin_audit to authenticated;
-- No update/delete policy: the log can't be edited through the API.

-- ── Password sign-in rate limit (service role only — no policies) ──────────
create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  key text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_key_idx on public.login_attempts (key, at desc);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

-- ── Blog image bucket: jpg / png / webp, 5 MB ──────────────────────────────
update storage.buckets
  set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'blog-images';

notify pgrst, 'reload schema';
