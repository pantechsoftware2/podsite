// app/api/cron/rss/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { parseRss } from '@/lib/rss/parseRss';

type PodcastRow = {
  id: string;
  rss_url: string | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: podcasts, error: podcastsError } = await supabase
    .from('podcasts')
    .select('id, rss_url');

  if (podcastsError) {
    console.error('podcastsError', podcastsError);
    return NextResponse.json(
      { ok: false, error: podcastsError.message },
      { status: 500 },
    );
  }

  if (!podcasts || podcasts.length === 0) {
    return NextResponse.json({ ok: true, message: 'No podcasts found' });
  }

  let totalEpisodesProcessed = 0;
  const errors: Array<{ podcastId: string; error: string }> = [];

  for (const p of podcasts as PodcastRow[]) {
    if (!p.rss_url) continue;

    try {
      const data = await parseRss(p.rss_url);

      for (const ep of data.episodes) {
        if (!ep.guid) continue;

        const { error: upsertError } = await supabase.from('episodes').upsert(
          {
            podcast_id: p.id,
            guid: ep.guid,
            title: ep.title,
            description: ep.description,
            audio_url: ep.audio_url,
            image_url: ep.episode_image_url,
            published_at: ep.publish_date
              ? new Date(ep.publish_date).toISOString()
              : null,
            duration_seconds: ep.duration_seconds,
            transcript_url: ep.transcript_url,
            transcript_type: ep.transcript_type,
            transcript_text: ep.transcript_text,
            transcript_fetched_at: ep.transcript_text ? new Date().toISOString() : null,
          },
          { onConflict: 'podcast_id,guid' },
        );

        if (upsertError) {
          console.error('episode upsert error', upsertError, {
            podcastId: p.id,
            guid: ep.guid,
          });
          errors.push({
            podcastId: p.id,
            error: upsertError.message ?? 'Unknown upsert error',
          });
        } else {
          totalEpisodesProcessed += 1;
        }
      }
    } catch (err: unknown) {
      console.error('rss fetch/parse error', err, { podcastId: p.id });
      errors.push({
        podcastId: p.id,
        error: err instanceof Error ? err.message : 'RSS fetch/parse failed',
      });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    message: `RSS sync finished. Episodes processed: ${totalEpisodesProcessed}. Errors: ${errors.length}.`,
    errors,
  });
}
