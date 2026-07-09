// app/api/ingest-rss/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { slugify } from '@/lib/utils/slugify';

const parser = new Parser({
  customFields: {
    item: [['content:encoded', 'contentEncoded']],
  },
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { podcastId } = await req.json();
  if (!podcastId) {
    return NextResponse.json({ error: 'podcastId required' }, { status: 400 });
  }

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .select('id, owner_id, rss_url')
    .eq('id', podcastId)
    .maybeSingle();

  if (podcastError || !podcast) {
    return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
  }

  if (podcast.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!podcast.rss_url) {
    return NextResponse.json(
      { error: 'No rss_url configured for this podcast' },
      { status: 400 },
    );
  }

  let feed;
  try {
    feed = await parser.parseURL(podcast.rss_url);
  } catch (err: any) {
    console.error('RSS parse error', err);
    return NextResponse.json(
      { error: 'Failed to fetch or parse RSS', details: err?.message },
      { status: 500 },
    );
  }

  let episodesProcessed = 0;

  for (const item of feed.items) {
    const guid = item.guid || item.link || item.title;
    if (!guid) continue;

    const enclosure = item.enclosure as { url?: string } | undefined;
    const audioUrl = enclosure?.url || null;

    const description =
      (item as any).contentEncoded ||
      item.content ||
      item.contentSnippet ||
      '';

    const imageUrl =
      (item as any)['itunes:image']?.href ||
      (item as any).image?.url ||
      feed.image?.url ||
      null;

    const publishedAt = item.isoDate
      ? new Date(item.isoDate).toISOString()
      : null;

    const slug = slugify(item.title || guid);

    const { error } = await supabase.from('episodes').upsert(
      {
        podcast_id: podcast.id,
        guid,
        slug,
        title: item.title || '(Untitled episode)',
        description,
        audio_url: audioUrl,
        image_url: imageUrl,
        published_at: publishedAt,
      },
      { onConflict: 'podcast_id,guid' },
    );

    if (!error) episodesProcessed += 1;
  }

  return NextResponse.json({
    ok: true,
    episodesProcessed,
  });
}
