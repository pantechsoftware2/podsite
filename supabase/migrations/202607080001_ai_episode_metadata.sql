-- AI-generated episode metadata and podcast branding fields.
-- This project uses public.podcasts as the site/podcast record.

alter table public.episodes
  add column if not exists transcript text,
  add column if not exists transcript_status text default 'pending',
  add column if not exists timestamps jsonb,
  add column if not exists youtube_description text,
  add column if not exists spotify_description text,
  add column if not exists seo_tags text[],
  add column if not exists thumbnail_url text,
  add column if not exists ai_generated_at timestamptz;

alter table public.podcasts
  add column if not exists ai_brand jsonb,
  add column if not exists ai_brand_status text default 'pending';
