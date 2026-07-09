// app/api/admin/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { parseRss } from '@/lib/rss/parseRss';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const rssUrl = body.rssUrl as string | undefined;
  const ytChannelId = body.ytChannelId as string | undefined;

  if (!rssUrl) {
    return new NextResponse('Missing RSS', { status: 400 });
  }

  try {
    const parsed = await parseRss(rssUrl);

    const { data: podcast, error: insertErr } = await supabase
      .from('podcasts')
      .insert({
        owner_id: session.user.id,
        rss_url: rssUrl,
        title: parsed.title,
        description: parsed.description,
        image_url: parsed.image,            // ← only this
        youtube_channel_id: ytChannelId ?? null,
      })
      .select()
      .single();

    if (insertErr || !podcast) {
      throw insertErr ?? new Error('Failed to insert podcast');
    }

    for (const ep of parsed.episodes) {
      const { error: epErr } = await supabase.from('episodes').upsert(
        {
          podcast_id: podcast.id,
          guid: ep.guid,
          slug: null,
          title: ep.title,
          description: ep.description,
          audio_url: ep.audio_url,
          image_url: ep.episode_image_url,
          published_at: ep.publish_date,
          duration_seconds: ep.duration_seconds,
        },
        { onConflict: 'podcast_id,guid' },
      );

      if (epErr) {
        console.error('episode upsert error', epErr);
      }
    }

    return NextResponse.json({ podcastId: podcast.id });
  } catch (e: any) {
    console.error(e);
    return new NextResponse(e?.message ?? 'Failed', { status: 500 });
  }
}
