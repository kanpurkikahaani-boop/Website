-- Kanpur Ki Kahaani v7 — team members as blog authors. Safe to run more than once. Run after 0008.
-- Adds a byline title to authors, gives Rakshaa her team photo, bio and title, and adds Monisha MS
-- (Blog Editor) so she can be chosen as an author in the editor. Photos are served from the site.

alter table public.authors add column if not exists title text check (title is null or char_length(title) <= 120);

insert into public.authors (slug, name, bio, avatar_url, title) values
  ('rakshaa-mukesh', 'Rakshaa Mukesh', 'Responsible for leading Kanpur''s digital presence on Reddit and Medium, creating engaging content and discussions to build awareness and interest in the city. Focused on leveraging these platforms to showcase Kanpur''s culture, attractions, and unique identity to a wider audience.', '/images/team/rakshaa-mukesh.jpg', 'Reddit & Medium Lead, Kanpur Ki Kahaani'),
  ('monisha-ms', 'Monisha MS', 'As a blog writer for Kanpur Ki Kahaani, I explore and document the city''s culture, heritage, lifestyle, and changing landscape. I aim to bring Kanpur''s stories to life, highlighting its people, places, traditions, and experiences while offering readers a fresh perspective on the city.', '/images/team/monisha-ms.jpg', 'Blog Editor, Kanpur Ki Kahaani')
on conflict (slug) do update set
  name = excluded.name, bio = excluded.bio, avatar_url = excluded.avatar_url, title = excluded.title;

notify pgrst, 'reload schema';

-- Check: expect 2 rows with photo and title.
select slug, name, title, avatar_url from public.authors where slug in ('rakshaa-mukesh', 'monisha-ms') order by slug;
