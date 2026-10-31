-- Curated events (linked to BookMyShow), the event-images bucket, and cron run tracking.
-- Run after 0001 and 0002.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  category text not null check (category in ('cultural', 'music', 'comedy', 'sports', 'expo', 'festival', 'literature', 'workshop', 'theatre')),
  city text not null check (city in ('kanpur', 'lucknow', 'agra', 'prayagraj', 'varanasi', 'ayodhya')),
  venue text not null default '',
  start_at timestamptz not null,
  end_at timestamptz check (end_at is null or end_at >= start_at),
  image_url text check (image_url is null or image_url like 'https://%'),
  -- Only real BookMyShow event pages; we never copy their content or images.
  bms_url text check (bms_url is null or bms_url like 'https://in.bookmyshow.com/%'),
  source_url text check (source_url is null or source_url like 'https://%'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  link_status text not null default 'unknown' check (link_status in ('ok', 'broken', 'unknown')),
  link_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_published_idx on public.events (status, start_at);

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

alter table public.events enable row level security;
create policy "public reads published events" on public.events
  for select to anon, authenticated using (status = 'published');
create policy "admin reads all events" on public.events
  for select to authenticated using (public.is_admin());
create policy "admin inserts events" on public.events
  for insert to authenticated with check (public.is_admin());
create policy "admin updates events" on public.events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes events" on public.events
  for delete to authenticated using (public.is_admin());

-- Our own event photos (never BookMyShow's): public read, admin-only write, 5 MB images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads event images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'event-images');
create policy "admin uploads event images" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-images' and public.is_admin());
create policy "admin updates event images" on storage.objects
  for update to authenticated using (bucket_id = 'event-images' and public.is_admin())
  with check (bucket_id = 'event-images' and public.is_admin());
create policy "admin deletes event images" on storage.objects
  for delete to authenticated using (bucket_id = 'event-images' and public.is_admin());

-- Last successful run of each daily job (shown as "Last refreshed" on /events).
create table if not exists public.cron_runs (
  job text primary key,
  finished_at timestamptz not null default now(),
  ok boolean not null default true,
  detail jsonb
);
alter table public.cron_runs enable row level security;
create policy "public reads cron runs" on public.cron_runs for select to anon, authenticated using (true);
-- Writes only via the service role (cron).
