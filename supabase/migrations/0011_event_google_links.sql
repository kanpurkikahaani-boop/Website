-- v9 Google links: optional Google Maps / Google Images search text per event.
-- Empty means "build it from the venue and city". Safe to run more than once.
alter table public.events add column if not exists maps_query text check (maps_query is null or char_length(maps_query) <= 160);
alter table public.events add column if not exists images_query text check (images_query is null or char_length(images_query) <= 160);
