-- Adds feed-level podcast artwork used by the legacy rss-sync endpoint.

alter table public.podcasts
  add column if not exists image_url text;
