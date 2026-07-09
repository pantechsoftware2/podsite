// app/api/rss-sync/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { slugify } from '@/lib/utils/slugify';
import { getNewEpisodeEmailHtml, sendResend } from '@/lib/emails';

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

  // robust JSON parsing
  const { rssUrl } = await req.json().catch(() => ({ rssUrl: null }));
  if (!rssUrl) {
    return NextResponse.json({ error: 'rssUrl required' }, { status: 400 });
  }

  let feed;
  try {
    feed = await parser.parseURL(rssUrl);
  } catch (err: any) {
    console.error('RSS parse error', err);
    return NextResponse.json(
      { error: 'Failed to fetch or parse RSS', details: err?.message },
      { status: 500 },
    );
  }

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .upsert(
      {
        owner_id: user.id,
        rss_url: rssUrl,
        title: feed.title || 'Untitled podcast',
        description: feed.description || '',
        image_url: feed.image?.url || null,
      },
      { onConflict: 'owner_id,rss_url' },
    )
    .select()
    .single();

  if (podcastError || !podcast) {
    return NextResponse.json(
      { error: podcastError?.message ?? 'Error upserting podcast' },
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

    let durationSeconds: number | null = null;
    const dur = (item as any)['itunes:duration'] ?? (item as any).itunes?.duration;
    if (typeof dur === 'number' && dur >= 0) durationSeconds = Math.round(dur);
    else if (typeof dur === 'string') {
      const parts = dur.split(':').map((p: string) => parseInt(p, 10));
      if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
      else if (parts.length === 1) durationSeconds = parts[0];
    }

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
        ...(durationSeconds != null && { duration_seconds: durationSeconds }),
      },
      { onConflict: 'podcast_id,guid' },
    );

    if (!error) episodesProcessed += 1;
  }

  // New episode notification (trigger: new_episode_detected)
  if (episodesProcessed > 0 && user?.email && feed?.items?.[0]) {
    const title = feed.items[0].title || 'New episode';
    const html = getNewEpisodeEmailHtml(title);
    sendResend(user.email, 'New episode detected 🎙', html).catch((e) => console.error('New episode email failed', e));
  }

  return NextResponse.json({
    ok: true,
    podcastId: podcast.id,
    episodesProcessed,
  });
}
