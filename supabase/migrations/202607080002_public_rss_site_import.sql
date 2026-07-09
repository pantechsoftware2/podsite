-- The RSS-to-live-site pipeline is intentionally public: paste RSS, create site, show build progress.
alter table public.podcasts
  alter column owner_id drop not null;

drop policy if exists "public can create rss pipeline podcasts" on public.podcasts;
create policy "public can create rss pipeline podcasts"
on public.podcasts
for insert
with check (owner_id is null);

drop policy if exists "public can update rss pipeline podcasts" on public.podcasts;
create policy "public can update rss pipeline podcasts"
on public.podcasts
for update
using (owner_id is null)
with check (owner_id is null);

drop policy if exists "public can create rss pipeline episodes" on public.episodes;
create policy "public can create rss pipeline episodes"
on public.episodes
for insert
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episodes.podcast_id
    and podcasts.owner_id is null
  )
);

drop policy if exists "public can update rss pipeline episodes" on public.episodes;
create policy "public can update rss pipeline episodes"
on public.episodes
for update
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episodes.podcast_id
    and podcasts.owner_id is null
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episodes.podcast_id
    and podcasts.owner_id is null
  )
);

drop policy if exists "public can create rss pipeline launch assets" on public.episode_launch_assets;
create policy "public can create rss pipeline launch assets"
on public.episode_launch_assets
for insert
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_launch_assets.podcast_id
    and podcasts.owner_id is null
  )
);

drop policy if exists "public can update rss pipeline launch assets" on public.episode_launch_assets;
create policy "public can update rss pipeline launch assets"
on public.episode_launch_assets
for update
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_launch_assets.podcast_id
    and podcasts.owner_id is null
  )
)
with check (
  exists (
    select 1 from public.podcasts
    where podcasts.id = episode_launch_assets.podcast_id
    and podcasts.owner_id is null
  )
);
