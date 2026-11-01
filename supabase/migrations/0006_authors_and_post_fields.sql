-- Authors + rich article fields for the blog template. Run after 0001–0005.

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  bio text not null default '',
  avatar_url text check (avatar_url is null or avatar_url like 'https://%' or avatar_url like '/%'),
  website text check (website is null or website like 'https://%'),
  instagram text check (instagram is null or instagram like 'https://%'),
  created_at timestamptz not null default now()
);
alter table public.authors enable row level security;
drop policy if exists "public reads authors" on public.authors;
create policy "public reads authors" on public.authors for select to anon, authenticated using (true);
drop policy if exists "admin inserts authors" on public.authors;
create policy "admin inserts authors" on public.authors for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates authors" on public.authors;
create policy "admin updates authors" on public.authors for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes authors" on public.authors;
create policy "admin deletes authors" on public.authors for delete to authenticated using (public.is_admin());

insert into public.authors (slug, name, bio)
values ('rakshaa-mukesh', 'Rakshaa Mukesh', 'Writer and storyteller for Kanpur Ki Kahaani.')
on conflict (slug) do nothing;

-- Rich article fields (all optional; sections render only when filled).
alter table public.posts
  add column if not exists author_id uuid references public.authors (id) on delete set null,
  add column if not exists category text,
  add column if not exists standfirst text,
  add column if not exists title_emphasis text,
  add column if not exists pull_quote text,
  add column if not exists cover_caption text,
  add column if not exists cover_credit text,
  add column if not exists key_facts jsonb not null default '[]',
  add column if not exists further_reading jsonb not null default '[]',
  add column if not exists glossary jsonb not null default '[]',
  add column if not exists plan_visit jsonb not null default '[]',
  add column if not exists link_report jsonb,
  add column if not exists links_checked_at timestamptz;

create index if not exists posts_author_idx on public.posts (author_id);

-- Explicit table privileges (RLS above still decides which rows; visitors can only read).
grant select on public.authors to anon, authenticated;
grant insert, update, delete on public.authors to authenticated;

-- Make the Supabase API see the new table and columns straight away.
notify pgrst, 'reload schema';
