-- Kanpur Ki Kahaani — core schema, RLS and admin model.
-- Run in the Supabase SQL editor (or `supabase db push`) BEFORE 0002 and 0003.

-- ── Admins ─────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
-- No policies: nobody can read or change this table through the API.

-- True only for a signed-in user whose email is in `admins` AND is verified.
-- SECURITY DEFINER so it can read auth.users; search_path pinned for safety.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── Subscribers ────────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and position('@' in email) > 1),
  cities text[] not null default '{}',
  source text not null check (source in ('home_popup', 'home_band', 'blog')),
  consent boolean not null default false,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.subscribers enable row level security;
-- Anonymous visitors get NO access. Inserts happen only through /api/subscribe (service role).
create policy "admin reads subscribers" on public.subscribers
  for select to authenticated using (public.is_admin());

-- ── Posts ──────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  content_json jsonb not null default '{"type":"doc","content":[]}',
  content_html text not null default '',
  cover_url text,
  cover_alt text,
  city text check (city in ('kanpur', 'lucknow', 'agra', 'prayagraj', 'varanasi', 'ayodhya')),
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author text not null default 'Kanpur Ki Kahaani',
  reading_minutes int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (status, published_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;
create policy "public reads published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());
create policy "admin reads all posts" on public.posts
  for select to authenticated using (public.is_admin());
create policy "admin inserts posts" on public.posts
  for insert to authenticated with check (public.is_admin());
create policy "admin updates posts" on public.posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes posts" on public.posts
  for delete to authenticated using (public.is_admin());

-- ── News ───────────────────────────────────────────────────────────────────
create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  url_hash text not null,
  title text not null,
  summary text check (summary is null or char_length(summary) <= 160),
  source_name text not null,
  source_homepage text,
  language text not null check (language in ('en', 'hi')),
  city text not null check (city in ('kanpur', 'lucknow', 'agra', 'prayagraj', 'varanasi', 'ayodhya')),
  genre text not null,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now()
);
create index if not exists news_city_genre_idx on public.news_items (city, genre, published_at desc);
create index if not exists news_published_idx on public.news_items (published_at desc);
create index if not exists news_language_idx on public.news_items (language);
alter table public.news_items enable row level security;
create policy "public reads news" on public.news_items for select to anon, authenticated using (true);
-- Writes only via the service role (cron job), which bypasses RLS.

create table if not exists public.news_sources_health (
  source text primary key,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  items_last_run int not null default 0
);
alter table public.news_sources_health enable row level security;
create policy "admin reads source health" on public.news_sources_health
  for select to authenticated using (public.is_admin());

create table if not exists public.news_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_upserted int not null default 0,
  feeds_ok int not null default 0,
  feeds_failed int not null default 0,
  ok boolean not null default false
);
alter table public.news_runs enable row level security;
-- "Last updated" on /news is public information.
create policy "public reads finished runs" on public.news_runs
  for select to anon, authenticated using (finished_at is not null);
