-- AI-generated thumbnail assets for episode launch workflows.

create table if not exists public.episode_thumbnail_generations (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  prompt text not null,
  concept text,
  overlay_text text,
  model text,
  storage_path text,
  public_url text,
  status text not null default 'ready',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists episode_thumbnail_generations_set_updated_at on public.episode_thumbnail_generations;
create trigger episode_thumbnail_generations_set_updated_at
before update on public.episode_thumbnail_generations
for each row execute function public.set_updated_at();

create index if not exists episode_thumbnail_generations_episode_idx
on public.episode_thumbnail_generations(episode_id, created_at desc);

alter table public.episode_thumbnail_generations enable row level security;

drop policy if exists "podcast owners can manage thumbnail generations" on public.episode_thumbnail_generations;
create policy "podcast owners can manage thumbnail generations"
on public.episode_thumbnail_generations
for all
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_thumbnail_generations.podcast_id
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_thumbnail_generations.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('episode-thumbnails', 'episode-thumbnails', true, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "public can read episode thumbnails" on storage.objects;
create policy "public can read episode thumbnails"
on storage.objects
for select
using (bucket_id = 'episode-thumbnails');

drop policy if exists "owners can upload episode thumbnails" on storage.objects;
create policy "owners can upload episode thumbnails"
on storage.objects
for insert
with check (
  bucket_id = 'episode-thumbnails'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can update episode thumbnails" on storage.objects;
create policy "owners can update episode thumbnails"
on storage.objects
for update
using (
  bucket_id = 'episode-thumbnails'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'episode-thumbnails'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can delete episode thumbnails" on storage.objects;
create policy "owners can delete episode thumbnails"
on storage.objects
for delete
using (
  bucket_id = 'episode-thumbnails'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);
