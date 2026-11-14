-- Update v10: public view counts per blog post, and a tracker for cross-posted copies.
-- Safe to run more than once.

-- ── View counts ──────────────────────────────────────────────────────────────
-- One row per post. Readable by everyone (it's the public "👁 N views" number); written only by
-- record_post_view() below, which the website's server calls with the service-role key.
create table if not exists public.post_view_counts (
  post_id uuid primary key references public.posts (id) on delete cascade,
  views bigint not null default 0 check (views >= 0),
  updated_at timestamptz not null default now()
);
alter table public.post_view_counts enable row level security;
drop policy if exists "anyone reads view counts" on public.post_view_counts;
create policy "anyone reads view counts" on public.post_view_counts for select to anon, authenticated using (true);

-- Who has been counted in the last 24 hours, per post. `visitor` is a SHA-256 hash of a random
-- first-party cookie id (no IP address, no account). No policies: only the definer function and
-- the service role can touch it. Rows older than 2 days are cleared as views come in.
create table if not exists public.post_view_seen (
  post_id uuid not null references public.posts (id) on delete cascade,
  visitor text not null check (char_length(visitor) = 64),
  seen_at timestamptz not null default now(),
  primary key (post_id, visitor)
);
create index if not exists post_view_seen_seen_at_idx on public.post_view_seen (seen_at);
alter table public.post_view_seen enable row level security;

-- Count one view of a live post, at most once per visitor per 24 hours. Returns the new total
-- (or null when the slug is not a live post). Bots and admins are filtered out by the caller.
create or replace function public.record_post_view(p_slug text, p_visitor text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post uuid;
  v_views bigint;
  v_new int;
begin
  if p_visitor is null or char_length(p_visitor) <> 64 then
    raise exception 'invalid visitor';
  end if;
  select id into v_post from posts
   where slug = p_slug and status = 'published' and published_at is not null
     and published_at <= now() and deleted_at is null;
  if v_post is null then
    return null;
  end if;

  -- This visitor's previous visit, if older than 24 h, no longer blocks a new count.
  delete from post_view_seen where post_id = v_post and visitor = p_visitor and seen_at < now() - interval '24 hours';
  insert into post_view_seen (post_id, visitor) values (v_post, p_visitor) on conflict do nothing;
  get diagnostics v_new = row_count;

  if v_new > 0 then
    insert into post_view_counts (post_id, views) values (v_post, 1)
    on conflict (post_id) do update set views = post_view_counts.views + 1, updated_at = now()
    returning views into v_views;
  else
    select views into v_views from post_view_counts where post_id = v_post;
  end if;

  -- Housekeeping: forget old visits a few at a time.
  delete from post_view_seen
   where ctid in (select ctid from post_view_seen where seen_at < now() - interval '2 days' limit 200);

  return coalesce(v_views, 0);
end;
$$;
revoke all on function public.record_post_view(text, text) from public, anon, authenticated;
grant execute on function public.record_post_view(text, text) to service_role;

-- ── Syndication tracker ──────────────────────────────────────────────────────
-- Every copy of a post published elsewhere: automatic cross-posts and ones added by hand.
create table if not exists public.post_syndications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  platform text not null check (char_length(platform) between 1 and 40),
  external_url text check (external_url is null or external_url ~ '^https://'),
  external_id text check (external_id is null or char_length(external_id) <= 200),
  status text not null check (status in ('published', 'draft', 'failed', 'manual')),
  error text check (error is null or char_length(error) <= 1000),
  published_at timestamptz not null default now(),
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists post_syndications_post_idx on public.post_syndications (post_id, published_at desc);
alter table public.post_syndications enable row level security;
drop policy if exists "admin manages syndications" on public.post_syndications;
create policy "admin manages syndications" on public.post_syndications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Audit log: record cross-posting too.
alter table public.admin_audit drop constraint if exists admin_audit_action_check;
alter table public.admin_audit add constraint admin_audit_action_check check (action in (
  'login', 'login_denied', 'logout', 'create', 'update', 'publish', 'unpublish', 'schedule', 'trash', 'restore',
  'purge', 'revision_restore', 'duplicate', 'mfa_enrol', 'mfa_remove', 'syndicate'));
