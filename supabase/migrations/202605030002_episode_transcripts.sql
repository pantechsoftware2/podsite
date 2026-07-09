-- Transcript storage and indexing for episode SEO pages.

alter table public.episodes
  add column if not exists transcript_url text,
  add column if not exists transcript_type text,
  add column if not exists transcript_text text,
  add column if not exists transcript_fetched_at timestamptz;

create index if not exists episodes_transcript_present_idx
on public.episodes(podcast_id)
where transcript_text is not null and length(transcript_text) > 0;

create index if not exists episodes_search_document_idx
on public.episodes
using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(transcript_text, '')
  )
);
