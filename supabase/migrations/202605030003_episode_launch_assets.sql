-- Stores reusable launch/marketing assets generated for each episode.

create table if not exists public.episode_launch_assets (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  model text,
  status text not null default 'ready',
  assets jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id)
);

drop trigger if exists episode_launch_assets_set_updated_at on public.episode_launch_assets;
create trigger episode_launch_assets_set_updated_at
before update on public.episode_launch_assets
for each row execute function public.set_updated_at();

create index if not exists episode_launch_assets_podcast_idx
on public.episode_launch_assets(podcast_id, generated_at desc);

alter table public.episode_launch_assets enable row level security;

drop policy if exists "podcast owners can manage episode launch assets" on public.episode_launch_assets;
create policy "podcast owners can manage episode launch assets"
on public.episode_launch_assets
for all
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_launch_assets.podcast_id
    and podcasts.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_launch_assets.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);
