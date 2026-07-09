import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: podcast, error } = await supabase
      .from('podcasts')
      .select('id, owner_id, title, theme_config, ai_brand_status')
      .eq('id', id)
      .maybeSingle();

    if (error || !podcast) {
      return NextResponse.json(
        { error: error?.message || 'Podcast not found' },
        { status: error ? 500 : 404 },
      );
    }

    if (podcast.owner_id && podcast.owner_id !== user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const themeConfig = (podcast.theme_config || {}) as Record<string, unknown>;
    const build = (themeConfig._build || {}) as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      podcastId: podcast.id,
      title: podcast.title,
      aiBrandStatus: podcast.ai_brand_status,
      status: {
        rssParsed: Boolean(build.rssParsed),
        totalEpisodes: Number(build.totalEpisodes || 0),
        artworkDetected: Boolean(build.artworkDetected),
        colorsExtracted: Boolean(build.colorsExtracted),
        themeStatus: build.themeStatus || (build.themeReady ? 'ready' : 'queued'),
        themeReady: Boolean(build.themeReady),
        transcriptionStatus: build.transcriptionStatus || 'queued',
        transcribedEpisodes: Number(build.transcribedEpisodes || 0),
        latestMessage: build.latestMessage || 'Build queued.',
        error: build.error || null,
        updatedAt: build.updatedAt || null,
      },
    });
  } catch (error) {
    console.error('Build status failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load build status' },
      { status: 500 },
    );
  }
}
