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
