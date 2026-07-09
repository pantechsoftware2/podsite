import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { parseRss } from '@/lib/rss/parseRss';
import { slugify } from '@/lib/utils/slugify';
import { extractColorsFromImage } from '@/lib/utils/colorUtils';
import { buildPodcastSiteBlueprint } from '@/lib/podcastBlueprints';
import type { ThemeConfig } from '@/components/ThemeEngine';

const DEFAULT_LAYOUT = ['hero', 'subscribe', 'product', 'grid', 'host', 'shorts'];

function createTrustedSupabaseClient() {
  try {
    return createSupabaseServiceRoleClient();
  } catch {
    return null;
  }
}

function baseTheme(): ThemeConfig {
  return {
    primaryColor: '#0ea5e9',
    backgroundColor: '#0f172a',
    foregroundColor: '#f8fafc',
    accentColor: '#22c55e',
    borderColor: '#334155',
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    cornerRadius: '8px',
    layout: 'netflix',
  };
}

export async function POST(req: Request) {
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  const supabase = user ? authSupabase : createTrustedSupabaseClient() || authSupabase;

  const { rssUrl } = (await req.json().catch(() => ({ rssUrl: null }))) as {
    rssUrl: string | null;
  };

  if (!rssUrl) {
    return NextResponse.json({ error: 'rssUrl required' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await parseRss(rssUrl, { fetchTranscripts: false, episodeLimit: 150 });
  } catch (err: unknown) {
    console.error('Failed to parse RSS', err);
    return NextResponse.json(
      { error: `Failed to fetch/parse RSS: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 },
    );
  }

  let themeConfig = baseTheme();
  const artworkDetected = Boolean(parsed.image);
  let colorsExtracted = false;

  if (parsed.image) {
    try {
      const extracted = await extractColorsFromImage(parsed.image);
      colorsExtracted = true;
      themeConfig = {
        ...themeConfig,
        primaryColor: extracted.primary,
        backgroundColor: extracted.background,
        foregroundColor: extracted.foreground,
        accentColor: extracted.accent,
        borderColor: extracted.border,
      };
    } catch (error) {
      console.warn('Color extraction failed during import', error);
    }
  }

  const siteBlueprint = buildPodcastSiteBlueprint({
    title: parsed.title || 'Untitled podcast',
    description: parsed.description || '',
    websiteSignals: null,
    episodeSamples: parsed.episodes.slice(0, 20).map((episode) => ({
      title: episode.title,
      description: episode.description,
    })),
  });

  themeConfig = {
    ...themeConfig,
    imageUrl: parsed.image,
    blueprintArchetype: siteBlueprint.archetype,
    generatedNav: siteBlueprint.navItems,
    generatedSections: siteBlueprint.sections,
    generatedPages: siteBlueprint.generatedPages,
    _build: {
      status: 'queued',
      rssParsed: true,
      totalEpisodes: parsed.episodes.length,
      artworkDetected,
      colorsExtracted,
      themeReady: false,
      transcriptionStatus: 'queued',
      transcribedEpisodes: 0,
      latestMessage: artworkDetected
        ? 'Artwork found. AI theme generation is queued.'
        : 'No artwork found. AI brand generation is queued.',
      updatedAt: new Date().toISOString(),
    },
  } as ThemeConfig;

  const detectedYtId = parsed.youtube_channel_id;
  let existingPodcastQuery = supabase
    .from('podcasts')
    .select('id')
    .eq('rss_url', rssUrl);

  existingPodcastQuery = user
    ? existingPodcastQuery.eq('owner_id', user.id)
    : existingPodcastQuery.is('owner_id', null);

  const { data: existingPodcast } = await existingPodcastQuery.maybeSingle();

  const podcastData = {
    owner_id: user?.id ?? null,
    title: parsed.title || 'Untitled podcast',
    description: parsed.description || '',
    rss_url: rssUrl,
    primary_color: themeConfig.primaryColor,
    accent_color: themeConfig.accentColor,
    youtube_channel_id: detectedYtId,
    ai_brand_status: 'pending',
    theme_config: themeConfig,
    page_layout: DEFAULT_LAYOUT,
  };

  const upsertResult = existingPodcast
    ? await supabase.from('podcasts').update(podcastData).eq('id', existingPodcast.id).select().single()
    : await supabase.from('podcasts').insert(podcastData).select().single();

  if (upsertResult.error || !upsertResult.data) {
    console.error('Podcast upsert failed:', upsertResult.error);
    return NextResponse.json(
      { error: upsertResult.error?.message ?? 'Error upserting podcast' },
      { status: 500 },
    );
  }

  const podcast = upsertResult.data;
  let episodesProcessed = 0;

  for (const ep of parsed.episodes) {
    const guid = ep.guid;
    const { error } = await supabase.from('episodes').upsert(
      {
        podcast_id: podcast.id,
        guid,
        slug: slugify(ep.title || guid),
        title: ep.title,
        description: ep.description,
        audio_url: ep.audio_url,
        image_url: ep.episode_image_url,
        published_at: ep.publish_date,
        duration_seconds: ep.duration_seconds,
        transcript_url: ep.transcript_url,
        transcript_type: ep.transcript_type,
        transcript_text: ep.transcript_text,
        transcript_fetched_at: ep.transcript_text ? new Date().toISOString() : null,
        video_sync_status: 'pending',
      },
      { onConflict: 'podcast_id,guid' },
    );

    if (!error) episodesProcessed += 1;
  }

  revalidatePath('/dashboard');
  revalidatePath(`/${podcast.id}`);

  return NextResponse.json({
    ok: true,
    podcastId: podcast.id,
    title: podcast.title,
    totalItems: parsed.episodes.length,
    episodesProcessed,
    artworkDetected,
    colorsExtracted,
    buildUrl: `/building/${podcast.id}`,
  });
}
