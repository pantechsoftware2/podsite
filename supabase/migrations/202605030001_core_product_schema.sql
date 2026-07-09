-- Core schema for PodSite Killer.
-- Apply this in Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  rss_url text not null,
  custom_domain text unique,
  youtube_channel_id text,
  primary_color text,
  accent_color text,
  theme_config jsonb not null default '{}'::jsonb,
  page_layout jsonb not null default '[]'::jsonb,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, rss_url)
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  guid text not null,
  slug text not null,
  title text not null,
  description text default '',
  audio_url text,
  image_url text,
  published_at timestamptz,
  duration_seconds integer,
  transcript_url text,
  transcript_type text,
  transcript_text text,
  transcript_fetched_at timestamptz,
  youtube_video_id text,
  video_sync_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (podcast_id, guid),
  unique (podcast_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  title text not null,
  description text default '',
  price numeric(10, 2) not null check (price >= 0),
  file_path text not null,
  file_name text not null,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shorts (
  id uuid primary key default gen_random_uuid(),
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  thumbnail text,
  published_at timestamptz,
  duration text,
  created_at timestamptz not null default now(),
  unique (podcast_id, youtube_video_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists podcasts_set_updated_at on public.podcasts;
create trigger podcasts_set_updated_at
before update on public.podcasts
for each row execute function public.set_updated_at();

drop trigger if exists episodes_set_updated_at on public.episodes;
create trigger episodes_set_updated_at
before update on public.episodes
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists podcasts_owner_id_idx on public.podcasts(owner_id);
create index if not exists podcasts_custom_domain_idx on public.podcasts(custom_domain);
create index if not exists podcasts_rss_url_idx on public.podcasts(rss_url);
create index if not exists episodes_podcast_published_idx on public.episodes(podcast_id, published_at desc);
create index if not exists episodes_podcast_slug_idx on public.episodes(podcast_id, slug);
create index if not exists products_podcast_created_idx on public.products(podcast_id, created_at desc);
create index if not exists shorts_podcast_published_idx on public.shorts(podcast_id, published_at desc);

alter table public.podcasts enable row level security;
alter table public.episodes enable row level security;
alter table public.products enable row level security;
alter table public.shorts enable row level security;

drop policy if exists "podcast owners can manage podcasts" on public.podcasts;
create policy "podcast owners can manage podcasts"
on public.podcasts
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "public can read podcasts" on public.podcasts;
create policy "public can read podcasts"
on public.podcasts
for select
using (true);

drop policy if exists "podcast owners can manage episodes" on public.episodes;
create policy "podcast owners can manage episodes"
on public.episodes
for all
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episodes.podcast_id
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episodes.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "public can read episodes" on public.episodes;
create policy "public can read episodes"
on public.episodes
for select
using (true);

drop policy if exists "podcast owners can manage products" on public.products;
create policy "podcast owners can manage products"
on public.products
for all
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = products.podcast_id
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = products.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "public can read products" on public.products;
create policy "public can read products"
on public.products
for select
using (true);

drop policy if exists "podcast owners can manage shorts" on public.shorts;
create policy "podcast owners can manage shorts"
on public.shorts
for all
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = shorts.podcast_id
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = shorts.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "public can read shorts" on public.shorts;
create policy "public can read shorts"
on public.shorts
for select
using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('products', 'products', false, 524288000)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "owners can read product files" on storage.objects;
create policy "owners can read product files"
on storage.objects
for select
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can upload product files" on storage.objects;
create policy "owners can upload product files"
on storage.objects
for insert
with check (
  bucket_id = 'products'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can update product files" on storage.objects;
create policy "owners can update product files"
on storage.objects
for update
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'products'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "owners can delete product files" on storage.objects;
create policy "owners can delete product files"
on storage.objects
for delete
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.podcasts
    where podcasts.id::text = (storage.foldername(name))[1]
    and podcasts.owner_id = auth.uid()
  )
);
