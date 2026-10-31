-- Removes the three pre-written stories that an earlier version seeded (0003_seed_posts.sql,
-- now deleted). Safe to run even if they were never inserted. Blog posts now come only from
-- the admin editor.
delete from public.posts
where slug in ('48-hours-in-kanpur', 'eating-through-arya-nagar', 'mills-that-built-a-city');
