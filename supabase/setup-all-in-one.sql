-- Kanpur Ki Kahaani — complete database setup for a NEW Supabase project.
-- Paste this whole file into Supabase → SQL Editor → New query → Run (once).
-- It is migrations 0001, 0002, 0004, 0005, 0006, 0007 and 0008 joined in order.
-- Afterwards run:  insert into public.admins (email) values ('your-email@gmail.com');

-- ════════════════ 0001_init.sql ════════════════
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

-- ════════════════ 0002_storage.sql ════════════════
-- Storage bucket for blog images: public read, admin-only write. 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads blog images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'blog-images');
create policy "admin uploads blog images" on storage.objects
  for insert to authenticated with check (bucket_id = 'blog-images' and public.is_admin());
create policy "admin updates blog images" on storage.objects
  for update to authenticated using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());
create policy "admin deletes blog images" on storage.objects
  for delete to authenticated using (bucket_id = 'blog-images' and public.is_admin());

-- ════════════════ 0004_events.sql ════════════════
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

-- ════════════════ 0005_remove_seed_posts.sql ════════════════
-- Removes the three pre-written stories that an earlier version seeded (0003_seed_posts.sql,
-- now deleted). Safe to run even if they were never inserted. Blog posts now come only from
-- the admin editor.
delete from public.posts
where slug in ('48-hours-in-kanpur', 'eating-through-arya-nagar', 'mills-that-built-a-city');

-- ════════════════ 0006_authors_and_post_fields.sql ════════════════
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

-- ════════════════ 0007_publish_navaratri.sql ════════════════
-- Publishes "Why Navaratri in Kanpur Is Something Everyone Must Experience!" by Rakshaa Mukesh.
-- Generated by scripts/build-navaratri-post.ts — do not edit by hand. Safe to re-run.
-- Run after 0006_authors_and_post_fields.sql.

insert into public.authors (slug, name, bio)
values ($kkk$rakshaa-mukesh$kkk$, $kkk$Rakshaa Mukesh$kkk$, $kkk$Writer and storyteller for Kanpur Ki Kahaani.$kkk$)
on conflict (slug) do nothing;

insert into public.posts (
  slug, title, title_emphasis, excerpt, standfirst, content_json, content_html,
  cover_url, cover_alt, cover_caption, cover_credit, city, category, tags,
  seo_title, seo_description, pull_quote, key_facts, plan_visit, glossary, further_reading,
  status, published_at, reading_minutes, author, author_id
) values (
  $kkk$navaratri-in-kanpur$kkk$, $kkk$Why Navaratri in Kanpur Is Something Everyone Must Experience!$kkk$, $kkk$Everyone Must Experience$kkk$, $kkk$Gujarat brings the garba, Kolkata brings the pandals — Kanpur brings both. A day-by-day guide to nine nights of chunri wishes, falahari feasts, 300+ pandals and Sindoor Khela.$kkk$, $kkk$Gujarat brings the garba, Kolkata brings the pandals — Kanpur brings both. A day-by-day guide to nine nights of chunri wishes, falahari feasts, 300+ pandals and Sindoor Khela.$kkk$,
  $kkk${"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Traditions for "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Navaratri","target":null,"rel":null,"class":null,"title":null}}],"text":"Navaratri"},{"type":"text","text":" have always been diverse across cities and regions. Gujarat brings the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://ich.unesco.org/en/RL/garba-of-gujarat-01962","target":null,"rel":null,"class":null,"title":null}}],"text":"Garba"},{"type":"text","text":", Kolkata brings "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://ich.unesco.org/en/RL/durga-puja-in-kolkata-01503","target":null,"rel":null,"class":null,"title":null}}],"text":"Durga Puja pandals"},{"type":"text","text":". If you wanted to experience both of these together for one Navaratri, well, I have just the place for you: In "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/culture-history","target":null,"rel":null,"class":null,"title":null}}],"text":"Kanpur"},{"type":"text","text":", Navaratri is a cultural crossroad where "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/tourism?filter=temple","target":null,"rel":null,"class":null,"title":null}}],"text":"1,000-year-old local temples"},{"type":"text","text":", Bengal community pandals, and vibrant garba nights all coexist under one splendid skyline."}]},{"type":"heading","attrs":{"level":2,"id":"day-1"},"content":[{"type":"text","text":"Day 1 — Ghatasthapana and the Baradevi Chunri Ritual"}]},{"type":"paragraph","content":[{"type":"text","text":"Day 1 of Navaratri begins with "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Ghatasthapana","target":null,"rel":null,"class":null,"title":null}}],"text":"Ghatasthapana"},{"type":"text","text":" and the midnight rush at ancient shrines. This is through a custom called the Baradevi Chunri Unfolding, where one must run to the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.google.com/maps/search/?api=1&query=Baradevi+Temple+Kanpur","target":null,"rel":null,"class":null,"title":null}}],"text":"Baradevi"},{"type":"text","text":" to tie a red "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Dupatta","target":null,"rel":null,"class":null,"title":null}}],"text":"chunri"},{"type":"text","text":" (a scarf) to a temple pillar and offer a prayer for a wish to be fulfilled! If your wish is granted within the following year, you will have to return to untie the scarf and thank the goddess for granting the wish."}]},{"type":"heading","attrs":{"level":2,"id":"days-2-3"},"content":[{"type":"text","text":"Days 2 & 3 — The Falahari Food Trail"}]},{"type":"paragraph","content":[{"type":"text","text":"Now you cannot forget about food! Days 2 and 3 are celebrated through a "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Fasting_in_Hinduism","target":null,"rel":null,"class":null,"title":null}}],"text":"falahari"},{"type":"text","text":" food trail. For these two days, Kanpur's "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/food-nightlife","target":null,"rel":null,"class":null,"title":null}}],"text":"street markets"},{"type":"text","text":" are bursting with mouth-watering aromas of falahari chaats, "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Sabudana_vada","target":null,"rel":null,"class":null,"title":null}}],"text":"sabudana tikkis"},{"type":"text","text":" and kuttu delicacies. This is a dream for "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Chaat","target":null,"rel":null,"class":null,"title":null}}],"text":"chaat"},{"type":"text","text":" lovers since all the stalls tonight are tailored for people observing a fast. This is achieved because most dishes are made from "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Buckwheat","target":null,"rel":null,"class":null,"title":null}}],"text":"kuttu flour"},{"type":"text","text":" and sabudana. Just imagining the variety of fasting-friendly treats is enough to make my stomach growl!"}]},{"type":"heading","attrs":{"level":2,"id":"day-4"},"content":[{"type":"text","text":"Day 4 — Khazana Coins from the Akhand Jyoti"}]},{"type":"paragraph","content":[{"type":"text","text":"On Day 4 of Navaratri, temple priests across the Kanpur locality have a beautiful tradition of distributing coins blessed at the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Eternal_flame","target":null,"rel":null,"class":null,"title":null}}],"text":"Akhand Jyothi"},{"type":"text","text":" (an eternal flame) as Khazana (divine luck/wealth) to devotees. This tradition is used to worship the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Lakshmi","target":null,"rel":null,"class":null,"title":null}}],"text":"Goddess Lakshmi"},{"type":"text","text":", and it is believed that keeping them provides prosperity and financial blessings. The tradition also strengthens community bonds by bringing devotees together through shared faith."}]},{"type":"heading","attrs":{"level":2,"id":"day-5"},"content":[{"type":"text","text":"Day 5 — The Pandals Open a Day Early"}]},{"type":"paragraph","content":[{"type":"text","text":"Unlike in other regions in the north, where "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Durga_Puja","target":null,"rel":null,"class":null,"title":null}}],"text":"Durga Puja"},{"type":"text","text":" starts officially on Day 6, Kanpur brings it to you a day earlier. With over 300 public pandals opening, the creativity in the designs can blow your mind! Kanpur has a tradition of blending "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Bengal_temple_architecture","target":null,"rel":null,"class":null,"title":null}}],"text":"Bengali architecture"},{"type":"text","text":" with the local heritage. This includes having pandals mixed with "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/culture-history#timeline","target":null,"rel":null,"class":null,"title":null}}],"text":"industrial history"},{"type":"text","text":" and even modern social themes!"}]},{"type":"heading","attrs":{"level":2,"id":"day-6"},"content":[{"type":"text","text":"Day 6 — Garba Meets Dhunuchi Naach"}]},{"type":"paragraph","content":[{"type":"text","text":"It really isn't Navaratri without dancing, is it? Well, on Day 6, in places like Swaroop Nagar and Civil Lines, many young people head to Garba arenas in "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Ghagra_choli","target":null,"rel":null,"class":null,"title":null}}],"text":"Chaniya Cholis"},{"type":"text","text":", and across the street devotees perform the traditional "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Dhunuchi_dance","target":null,"rel":null,"class":null,"title":null}}],"text":"Dhunuchi Naach"},{"type":"text","text":" (a dance with burning coconut-husk incense burners) to the beat of Dhaks. This is a lovely mixture of both "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Culture_of_Gujarat","target":null,"rel":null,"class":null,"title":null}}],"text":"Gujarati"},{"type":"text","text":" and Bengali cultures, as both cultures dance to the beat of Dhaks."}]},{"type":"heading","attrs":{"level":2,"id":"day-7"},"content":[{"type":"text","text":"Day 7 — Sandhi Puja: 108 Lotuses in 48 Minutes"}]},{"type":"paragraph","content":[{"type":"text","text":"In the late hours of "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Durga_Ashtami","target":null,"rel":null,"class":null,"title":null}}],"text":"Maha Ashtami"},{"type":"text","text":" (Day 7) and early hours of Maha Navami, major pandals (such as the Kanpur Bengali Club) conduct a "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Sandhi_Puja","target":null,"rel":null,"class":null,"title":null}}],"text":"Sandhi puja"},{"type":"text","text":" using 108 lotus flowers and 108 brass oil lamps. The time of this puja is around midnight, as it is considered a spiritually potent tipping point where cosmic energy reaches its peak. As this sacred window opens, the clock starts ticking: devotees have precisely 48 minutes—the single "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Muhurta","target":null,"rel":null,"class":null,"title":null}},{"type":"italic"}],"text":"muhurat"},{"type":"text","text":"—to light all 108 "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Diya_(lamp)","target":null,"rel":null,"class":null,"title":null}}],"text":"diyas"},{"type":"text","text":" and offer 108 lotus flowers before the divine energy passes!"}]},{"type":"heading","attrs":{"level":2,"id":"day-8"},"content":[{"type":"text","text":"Day 8 — Kanya Pujan on Maha Navami"}]},{"type":"paragraph","content":[{"type":"text","text":"Day 8 of Navaratri is, as we all know it, when "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Maha_Navami","target":null,"rel":null,"class":null,"title":null}}],"text":"Maha Navami"},{"type":"text","text":" starts, and in the morning households across the city invite nine young girls (kanyas) for "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Kanya_Puja","target":null,"rel":null,"class":null,"title":null}}],"text":"Kanya Pujan"},{"type":"text","text":". Serving the girls sweet "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Halva","target":null,"rel":null,"class":null,"title":null}}],"text":"halwa"},{"type":"text","text":", puri, and "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Kala_chana","target":null,"rel":null,"class":null,"title":null}}],"text":"black chana"},{"type":"text","text":"."}]},{"type":"heading","attrs":{"level":2,"id":"day-9"},"content":[{"type":"text","text":"Day 9 — Sindoor Khela"}]},{"type":"paragraph","content":[{"type":"text","text":"Coming to the final day, Day 9, many married women celebrate "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Sindoor_Khela","target":null,"rel":null,"class":null,"title":null}}],"text":"Sindhoor Khela"},{"type":"text","text":". They gather at pandals dressed up in red and white "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Sari","target":null,"rel":null,"class":null,"title":null}}],"text":"Lal-par sarees"},{"type":"text","text":" to smear "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Sindoor","target":null,"rel":null,"class":null,"title":null}}],"text":"vermilion"},{"type":"text","text":" on the goddess Durga and each other. This comes across as a wish for a long marital life and prosperity!"}]},{"type":"heading","attrs":{"level":2,"id":"farewell"},"content":[{"type":"text","text":"The Farewell"}]},{"type":"paragraph","content":[{"type":"text","text":"As the festival comes to an end this year and idols of "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://en.wikipedia.org/wiki/Durga","target":null,"rel":null,"class":null,"title":null}}],"text":"Goddess Durga"},{"type":"text","text":" are carried down the river, Kanpur leaves you with memories that will stay with you long after the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/playlist","target":null,"rel":null,"class":null,"title":null}}],"text":"music fades"},{"type":"text","text":". Between the late nights, the incredible food, and the sheer fun you have with everyone, "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/celebrations","target":null,"rel":null,"class":null,"title":null}}],"text":"Navaratri in Kanpur"},{"type":"text","text":" is a must-experience!"}]}]}$kkk$::jsonb, $kkk$<p>Traditions for <a href="https://en.wikipedia.org/wiki/Navaratri" target="_blank" rel="noopener noreferrer" class="ext">Navaratri<span class="sr-only"> (opens in new tab)</span></a> have always been diverse across cities and regions. Gujarat brings the <a href="https://ich.unesco.org/en/RL/garba-of-gujarat-01962" target="_blank" rel="noopener noreferrer" class="ext">Garba<span class="sr-only"> (opens in new tab)</span></a>, Kolkata brings <a href="https://ich.unesco.org/en/RL/durga-puja-in-kolkata-01503" target="_blank" rel="noopener noreferrer" class="ext">Durga Puja pandals<span class="sr-only"> (opens in new tab)</span></a>. If you wanted to experience both of these together for one Navaratri, well, I have just the place for you: In <a href="/culture-history">Kanpur</a>, Navaratri is a cultural crossroad where <a href="/tourism?filter=temple">1,000-year-old local temples</a>, Bengal community pandals, and vibrant garba nights all coexist under one splendid skyline.</p><h2 id="day-1"><span class="day-badge">Day 1</span> Ghatasthapana and the Baradevi Chunri Ritual</h2><p>Day 1 of Navaratri begins with <a href="https://en.wikipedia.org/wiki/Ghatasthapana" target="_blank" rel="noopener noreferrer" class="ext">Ghatasthapana<span class="sr-only"> (opens in new tab)</span></a> and the midnight rush at ancient shrines. This is through a custom called the Baradevi Chunri Unfolding, where one must run to the <a href="https://www.google.com/maps/search/?api=1&amp;query=Baradevi+Temple+Kanpur" target="_blank" rel="noopener noreferrer" class="ext">Baradevi<span class="sr-only"> (opens in new tab)</span></a> to tie a red <a href="https://en.wikipedia.org/wiki/Dupatta" target="_blank" rel="noopener noreferrer" class="ext">chunri<span class="sr-only"> (opens in new tab)</span></a> (a scarf) to a temple pillar and offer a prayer for a wish to be fulfilled! If your wish is granted within the following year, you will have to return to untie the scarf and thank the goddess for granting the wish.</p><h2 id="days-2-3"><span class="day-badge">Days 2 &amp; 3</span> The Falahari Food Trail</h2><p>Now you cannot forget about food! Days 2 and 3 are celebrated through a <a href="https://en.wikipedia.org/wiki/Fasting_in_Hinduism" target="_blank" rel="noopener noreferrer" class="ext">falahari<span class="sr-only"> (opens in new tab)</span></a> food trail. For these two days, Kanpur's <a href="/food-nightlife">street markets</a> are bursting with mouth-watering aromas of falahari chaats, <a href="https://en.wikipedia.org/wiki/Sabudana_vada" target="_blank" rel="noopener noreferrer" class="ext">sabudana tikkis<span class="sr-only"> (opens in new tab)</span></a> and kuttu delicacies. This is a dream for <a href="https://en.wikipedia.org/wiki/Chaat" target="_blank" rel="noopener noreferrer" class="ext">chaat<span class="sr-only"> (opens in new tab)</span></a> lovers since all the stalls tonight are tailored for people observing a fast. This is achieved because most dishes are made from <a href="https://en.wikipedia.org/wiki/Buckwheat" target="_blank" rel="noopener noreferrer" class="ext">kuttu flour<span class="sr-only"> (opens in new tab)</span></a> and sabudana. Just imagining the variety of fasting-friendly treats is enough to make my stomach growl!</p><h2 id="day-4"><span class="day-badge">Day 4</span> Khazana Coins from the Akhand Jyoti</h2><p>On Day 4 of Navaratri, temple priests across the Kanpur locality have a beautiful tradition of distributing coins blessed at the <a href="https://en.wikipedia.org/wiki/Eternal_flame" target="_blank" rel="noopener noreferrer" class="ext">Akhand Jyothi<span class="sr-only"> (opens in new tab)</span></a> (an eternal flame) as Khazana (divine luck/wealth) to devotees. This tradition is used to worship the <a href="https://en.wikipedia.org/wiki/Lakshmi" target="_blank" rel="noopener noreferrer" class="ext">Goddess Lakshmi<span class="sr-only"> (opens in new tab)</span></a>, and it is believed that keeping them provides prosperity and financial blessings. The tradition also strengthens community bonds by bringing devotees together through shared faith.</p><h2 id="day-5"><span class="day-badge">Day 5</span> The Pandals Open a Day Early</h2><p>Unlike in other regions in the north, where <a href="https://en.wikipedia.org/wiki/Durga_Puja" target="_blank" rel="noopener noreferrer" class="ext">Durga Puja<span class="sr-only"> (opens in new tab)</span></a> starts officially on Day 6, Kanpur brings it to you a day earlier. With over 300 public pandals opening, the creativity in the designs can blow your mind! Kanpur has a tradition of blending <a href="https://en.wikipedia.org/wiki/Bengal_temple_architecture" target="_blank" rel="noopener noreferrer" class="ext">Bengali architecture<span class="sr-only"> (opens in new tab)</span></a> with the local heritage. This includes having pandals mixed with <a href="/culture-history#timeline">industrial history</a> and even modern social themes!</p><h2 id="day-6"><span class="day-badge">Day 6</span> Garba Meets Dhunuchi Naach</h2><p>It really isn't Navaratri without dancing, is it? Well, on Day 6, in places like Swaroop Nagar and Civil Lines, many young people head to Garba arenas in <a href="https://en.wikipedia.org/wiki/Ghagra_choli" target="_blank" rel="noopener noreferrer" class="ext">Chaniya Cholis<span class="sr-only"> (opens in new tab)</span></a>, and across the street devotees perform the traditional <a href="https://en.wikipedia.org/wiki/Dhunuchi_dance" target="_blank" rel="noopener noreferrer" class="ext">Dhunuchi Naach<span class="sr-only"> (opens in new tab)</span></a> (a dance with burning coconut-husk incense burners) to the beat of Dhaks. This is a lovely mixture of both <a href="https://en.wikipedia.org/wiki/Culture_of_Gujarat" target="_blank" rel="noopener noreferrer" class="ext">Gujarati<span class="sr-only"> (opens in new tab)</span></a> and Bengali cultures, as both cultures dance to the beat of Dhaks.</p><h2 id="day-7"><span class="day-badge">Day 7</span> Sandhi Puja: 108 Lotuses in 48 Minutes</h2><p>In the late hours of <a href="https://en.wikipedia.org/wiki/Durga_Ashtami" target="_blank" rel="noopener noreferrer" class="ext">Maha Ashtami<span class="sr-only"> (opens in new tab)</span></a> (Day 7) and early hours of Maha Navami, major pandals (such as the Kanpur Bengali Club) conduct a <a href="https://en.wikipedia.org/wiki/Sandhi_Puja" target="_blank" rel="noopener noreferrer" class="ext">Sandhi puja<span class="sr-only"> (opens in new tab)</span></a> using 108 lotus flowers and 108 brass oil lamps. The time of this puja is around midnight, as it is considered a spiritually potent tipping point where cosmic energy reaches its peak. As this sacred window opens, the clock starts ticking: devotees have precisely 48 minutes—the single <a href="https://en.wikipedia.org/wiki/Muhurta" target="_blank" rel="noopener noreferrer" class="ext"><em>muhurat</em><span class="sr-only"> (opens in new tab)</span></a>—to light all 108 <a href="https://en.wikipedia.org/wiki/Diya_(lamp)" target="_blank" rel="noopener noreferrer" class="ext">diyas<span class="sr-only"> (opens in new tab)</span></a> and offer 108 lotus flowers before the divine energy passes!</p><h2 id="day-8"><span class="day-badge">Day 8</span> Kanya Pujan on Maha Navami</h2><p>Day 8 of Navaratri is, as we all know it, when <a href="https://en.wikipedia.org/wiki/Maha_Navami" target="_blank" rel="noopener noreferrer" class="ext">Maha Navami<span class="sr-only"> (opens in new tab)</span></a> starts, and in the morning households across the city invite nine young girls (kanyas) for <a href="https://en.wikipedia.org/wiki/Kanya_Puja" target="_blank" rel="noopener noreferrer" class="ext">Kanya Pujan<span class="sr-only"> (opens in new tab)</span></a>. Serving the girls sweet <a href="https://en.wikipedia.org/wiki/Halva" target="_blank" rel="noopener noreferrer" class="ext">halwa<span class="sr-only"> (opens in new tab)</span></a>, puri, and <a href="https://en.wikipedia.org/wiki/Kala_chana" target="_blank" rel="noopener noreferrer" class="ext">black chana<span class="sr-only"> (opens in new tab)</span></a>.</p><h2 id="day-9"><span class="day-badge">Day 9</span> Sindoor Khela</h2><p>Coming to the final day, Day 9, many married women celebrate <a href="https://en.wikipedia.org/wiki/Sindoor_Khela" target="_blank" rel="noopener noreferrer" class="ext">Sindhoor Khela<span class="sr-only"> (opens in new tab)</span></a>. They gather at pandals dressed up in red and white <a href="https://en.wikipedia.org/wiki/Sari" target="_blank" rel="noopener noreferrer" class="ext">Lal-par sarees<span class="sr-only"> (opens in new tab)</span></a> to smear <a href="https://en.wikipedia.org/wiki/Sindoor" target="_blank" rel="noopener noreferrer" class="ext">vermilion<span class="sr-only"> (opens in new tab)</span></a> on the goddess Durga and each other. This comes across as a wish for a long marital life and prosperity!</p><h2 id="farewell">The Farewell</h2><p>As the festival comes to an end this year and idols of <a href="https://en.wikipedia.org/wiki/Durga" target="_blank" rel="noopener noreferrer" class="ext">Goddess Durga<span class="sr-only"> (opens in new tab)</span></a> are carried down the river, Kanpur leaves you with memories that will stay with you long after the <a href="/playlist">music fades</a>. Between the late nights, the incredible food, and the sheer fun you have with everyone, <a href="/celebrations">Navaratri in Kanpur</a> is a must-experience!</p>$kkk$,
  $kkk$/images/blogs/navaratri-in-kanpur/cover.jpg$kkk$, $kkk$A brightly lit Durga Puja pandal with the goddess Durga idol at night$kkk$, $kkk$Representative image$kkk$, null,
  $kkk$kanpur$kkk$, $kkk$celebrations$kkk$, array['navaratri', 'durga-puja', 'garba', 'festivals', 'kanpur-food', 'culture', 'uttar-pradesh']::text[],
  $kkk$Navaratri in Kanpur: 9-Day Guide to Rituals, Food, Pandals & Garba | Kanpur Ki Kahaani$kkk$, $kkk$From the Baradevi chunri ritual to falahari food trails, 300+ Durga Puja pandals, garba nights and Sindoor Khela — a day-by-day guide to Navaratri in Kanpur.$kkk$, $kkk$In Kanpur, Navaratri is a cultural crossroad where 1,000-year-old local temples, Bengal community pandals, and vibrant garba nights all coexist under one splendid skyline.$kkk$,
  $kkk$[{"label":"When","value":"Sharad Navaratri, usually late September–October"},{"label":"Where","value":"Temples, Swaroop Nagar, Civil Lines and community pandals citywide"},{"label":"Don't miss","value":"The Baradevi chunri ritual, Sandhi Puja and Sindoor Khela"},{"label":"Eat","value":"Kuttu, sabudana and falahari chaat"}]$kkk$::jsonb, $kkk$[{"group":"Getting here","label":"Kanpur Central railway station","url":"https://www.google.com/maps/search/?api=1&query=Kanpur+Central+railway+station"},{"group":"Getting here","label":"Kanpur Airport (Chakeri)","url":"https://www.google.com/maps/search/?api=1&query=Kanpur+Airport+Chakeri"},{"group":"Getting here","label":"How to reach Kanpur","url":"/#reach"},{"group":"Places in this story","label":"Kanpur Bengali Club","url":"https://www.google.com/maps/search/?api=1&query=Kanpur+Bengali+Club"},{"group":"Places in this story","label":"Swaroop Nagar","url":"https://www.google.com/maps/search/?api=1&query=Swaroop+Nagar%2C+Kanpur"},{"group":"Places in this story","label":"Civil Lines","url":"https://www.google.com/maps/search/?api=1&query=Civil+Lines%2C+Kanpur"},{"group":"Places in this story","label":"JK Temple","url":"https://www.google.com/maps/search/?api=1&query=JK+Temple%2C+Kanpur"},{"group":"Places in this story","label":"Bithoor ghats","url":"https://www.google.com/maps/search/?api=1&query=Bithoor+Ghat%2C+Kanpur"},{"group":"On our site","label":"Where to stay in Kanpur","url":"/accommodation"},{"group":"On our site","label":"Kanpur weather this week","url":"/weather"},{"group":"On our site","label":"Upcoming events","url":"/events"},{"group":"On our site","label":"Build your Kanpur itinerary","url":"/tourism#planner"},{"group":"Tickets","label":"Garba & dandiya nights on BookMyShow","url":"https://in.bookmyshow.com/explore/events-kanpur"}]$kkk$::jsonb, $kkk$[{"term":"Ghatasthapana","definition":"The Day 1 ritual of installing a sacred pot (kalash) that invokes the goddess for the nine nights.","url":"https://en.wikipedia.org/wiki/Kalasha","source":"Wikipedia"},{"term":"Falahar","definition":"Fasting food made without grains — fruit, kuttu, sabudana, potatoes and rock salt.","url":"https://en.wikipedia.org/wiki/Upavasa","source":"Wikipedia"},{"term":"Akhand Jyoti","definition":"An oil lamp kept burning without a break through all nine days.","url":"https://en.wikipedia.org/wiki/Aarti","source":"Wikipedia"},{"term":"Khazana","definition":"Temple-blessed coins kept at home as a token of the goddess's prosperity.","url":"https://en.wikipedia.org/wiki/Lakshmi_Puja","source":"Wikipedia"},{"term":"Pandal","definition":"A temporary, often elaborately themed structure that houses the goddess's idol during Durga Puja.","url":"https://en.wikipedia.org/wiki/Pandal","source":"Wikipedia"},{"term":"Dhunuchi","definition":"A clay incense burner filled with coconut husk and resin, swung in a devotional dance.","url":"https://en.wikipedia.org/wiki/Censer","source":"Wikipedia"},{"term":"Dhak","definition":"A large barrel-shaped drum beaten with sticks — the signature sound of Durga Puja.","url":"https://en.wikipedia.org/wiki/Dhak_(instrument)","source":"Wikipedia"},{"term":"Sandhi Puja","definition":"Worship in the 48 minutes where Ashtami ends and Navami begins.","url":"https://www.britannica.com/topic/Durga-Puja","source":"Britannica"},{"term":"Muhurat","definition":"An astrologically auspicious window of time for a ritual.","url":"https://en.wikipedia.org/wiki/Panchangam","source":"Wikipedia"},{"term":"Kanya Pujan","definition":"Honouring young girls as forms of the goddess with a meal and small gifts.","url":"https://en.wikipedia.org/wiki/Kumari_(goddess)","source":"Wikipedia"},{"term":"Sindoor Khela","definition":"Married women smearing vermilion on the goddess and each other on the last day of Durga Puja.","url":"https://www.wbtourism.gov.in/","source":"West Bengal Tourism"},{"term":"Visarjan","definition":"Immersion of the idol in a river or other water at the end of the festival.","url":"https://en.wikipedia.org/wiki/Visarjan","source":"Wikipedia"}]$kkk$::jsonb, $kkk$[{"title":"Uttar Pradesh Tourism","url":"https://uptourism.gov.in/","publisher":"Government of Uttar Pradesh"},{"title":"Ministry of Culture","url":"https://www.indiaculture.gov.in/","publisher":"Government of India"},{"title":"Navratri","url":"https://www.britannica.com/topic/Navratri","publisher":"Encyclopaedia Britannica"},{"title":"Durga","url":"https://www.britannica.com/topic/Durga","publisher":"Encyclopaedia Britannica"},{"title":"Kanpur Nagar district","url":"https://kanpurnagar.nic.in/","publisher":"Government of Uttar Pradesh"},{"title":"Kanpur","url":"https://en.wikipedia.org/wiki/Kanpur","publisher":"Wikipedia"},{"title":"Kolkata","url":"https://en.wikipedia.org/wiki/Kolkata","publisher":"Wikipedia"},{"title":"Gujarat Tourism","url":"https://www.gujarattourism.com/","publisher":"Government of Gujarat"},{"title":"Gujarat","url":"https://en.wikipedia.org/wiki/Gujarat","publisher":"Wikipedia"},{"title":"Garba (dance)","url":"https://en.wikipedia.org/wiki/Garba_(dance)","publisher":"Wikipedia"},{"title":"Culture of Bengal","url":"https://en.wikipedia.org/wiki/Culture_of_Bengal","publisher":"Wikipedia"}]$kkk$::jsonb,
  'published', '2026-10-14T10:00:00+05:30', 3, $kkk$Rakshaa Mukesh$kkk$,
  (select id from public.authors where slug = $kkk$rakshaa-mukesh$kkk$)
)
on conflict (slug) do update set
  title = excluded.title, title_emphasis = excluded.title_emphasis, excerpt = excluded.excerpt,
  standfirst = excluded.standfirst, content_json = excluded.content_json, content_html = excluded.content_html,
  cover_url = excluded.cover_url, cover_alt = excluded.cover_alt, cover_caption = excluded.cover_caption,
  cover_credit = excluded.cover_credit, city = excluded.city, category = excluded.category, tags = excluded.tags,
  seo_title = excluded.seo_title, seo_description = excluded.seo_description, pull_quote = excluded.pull_quote,
  key_facts = excluded.key_facts, plan_visit = excluded.plan_visit, glossary = excluded.glossary,
  further_reading = excluded.further_reading, status = excluded.status, published_at = excluded.published_at,
  reading_minutes = excluded.reading_minutes, author = excluded.author, author_id = excluded.author_id;

-- Refresh the Supabase API's schema cache, then show the result (expect 1 row: published).
notify pgrst, 'reload schema';
select p.slug, p.status, p.published_at, a.name as author
from public.posts p left join public.authors a on a.id = p.author_id
where p.slug = $kkk$navaratri-in-kanpur$kkk$;

-- ════════════════ 0008_admin_v6.sql ════════════════
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
