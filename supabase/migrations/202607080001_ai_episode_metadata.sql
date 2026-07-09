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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'episodes_transcript_status_check'
      and conrelid = 'public.episodes'::regclass
  ) then
    alter table public.episodes
      add constraint episodes_transcript_status_check
      check (transcript_status in ('pending', 'processing', 'done', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'podcasts_ai_brand_status_check'
      and conrelid = 'public.podcasts'::regclass
  ) then
    alter table public.podcasts
      add constraint podcasts_ai_brand_status_check
      check (ai_brand_status in ('pending', 'generating', 'done'));
  end if;
end $$;

comment on column public.episodes.timestamps is
  'Array of timestamp objects, for example [{"time":"00:12:34","label":"Topic name"}].';

comment on column public.podcasts.ai_brand is
  'AI-generated brand settings: primaryColor, bgColor, accentColor, fontFamily, cornerRadius, logoUrl.';
