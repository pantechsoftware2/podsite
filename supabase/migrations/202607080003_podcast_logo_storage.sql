-- Public storage for AI-generated podcast logos.

insert into storage.buckets (id, name, public, file_size_limit)
values ('podcast-logos', 'podcast-logos', true, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "public can read podcast logos" on storage.objects;
create policy "public can read podcast logos"
on storage.objects
for select
using (bucket_id = 'podcast-logos');

drop policy if exists "owners can upload podcast logos" on storage.objects;
create policy "owners can upload podcast logos"
on storage.objects
for insert
with check (
  bucket_id = 'podcast-logos'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "public can upload rss pipeline podcast logos" on storage.objects;
create policy "public can upload rss pipeline podcast logos"
on storage.objects
for insert
with check (
  bucket_id = 'podcast-logos'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id is null
  )
);

drop policy if exists "owners can update podcast logos" on storage.objects;
create policy "owners can update podcast logos"
on storage.objects
for update
using (
  bucket_id = 'podcast-logos'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'podcast-logos'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can delete podcast logos" on storage.objects;
create policy "owners can delete podcast logos"
on storage.objects
for delete
using (
  bucket_id = 'podcast-logos'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);
