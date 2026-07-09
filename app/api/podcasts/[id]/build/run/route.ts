import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { fetchWebsiteSignals } from '@/lib/ai/siteSignals';
import {
  autoBrandToThemeConfig,
  generateAutoBrandIdentityWithOpenRouter,
  generateEpisodeLaunchAssetsWithOpenRouter,
  generateImportSiteBlueprintWithOpenRouter,
} from '@/lib/ai/openrouter';
import { generatePodcastLogoImage } from '@/lib/ai/openrouterImages';
import { transcribeAudioUrlWithDeepgram } from '@/lib/ai/deepgram';
import { buildPodcastSiteBlueprint } from '@/lib/podcastBlueprints';
import type { ThemeConfig } from '@/components/ThemeEngine';

type BuildState = Record<string, unknown>;

function createTrustedSupabaseClient() {
  try {
    return createSupabaseServiceRoleClient();
  } catch {
    return null;
  }
}

function shortDescription(input: string | null | undefined) {
  return (input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

async function uploadPodcastLogo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  podcastId: string,
  generated: Awaited<ReturnType<typeof generatePodcastLogoImage>>,
) {
  const storagePath = `${podcastId}/${crypto.randomUUID()}.${extensionForMime(generated.mimeType)}`;
  const { error: uploadError } = await supabase.storage
    .from('podcast-logos')
    .upload(storagePath, generated.bytes, {
      contentType: generated.mimeType,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from('podcast-logos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

async function patchBuildState(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  podcastId: string,
  themeConfig: Record<string, unknown>,
  patch: BuildState,
) {
  const nextThemeConfig = {
    ...themeConfig,
    _build: {
      ...((themeConfig._build || {}) as BuildState),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from('podcasts')
    .update({ theme_config: nextThemeConfig })
    .eq('id', podcastId);

  if (error) throw new Error(error.message);
  return nextThemeConfig;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  let supabase = authSupabase;

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .select('id, owner_id, title, description, rss_url, theme_config, page_layout')
    .eq('id', id)
    .maybeSingle();

  if (podcastError || !podcast) {
    return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
  }

  if (podcast.owner_id && podcast.owner_id !== user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!podcast.owner_id) {
    supabase = createTrustedSupabaseClient() || authSupabase;
  }

  let themeConfig = ((podcast.theme_config || {}) as Record<string, unknown>);
  const build = (themeConfig._build || {}) as BuildState;

  if (build.themeReady) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    themeConfig = await patchBuildState(supabase, id, themeConfig, {
      status: 'designing',
      themeStatus: 'generating',
      latestMessage: 'AI is designing your site...',
    });

    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, podcast_id, title, description, transcript_text, audio_url, published_at')
      .eq('podcast_id', id)
      .order('published_at', { ascending: false })
      .limit(20);

    let websiteSignals: Awaited<ReturnType<typeof fetchWebsiteSignals>> = null;
    const referenceUrl = typeof themeConfig.brandReferenceUrl === 'string'
      ? themeConfig.brandReferenceUrl
      : null;

    if (referenceUrl) {
      try {
        websiteSignals = await fetchWebsiteSignals(referenceUrl);
      } catch (error) {
        console.warn('Website signal extraction failed during build', error);
      }
    }

    const fallbackBlueprint = buildPodcastSiteBlueprint({
      title: podcast.title || 'Untitled podcast',
      description: podcast.description || '',
      websiteSignals,
      episodeSamples: (episodes || []).slice(0, 20).map((episode) => ({
        title: episode.title,
        description: episode.description,
      })),
    });

    const nextTheme: ThemeConfig = {
      ...(themeConfig as ThemeConfig),
      blueprintArchetype: fallbackBlueprint.archetype,
      generatedNav: fallbackBlueprint.navItems,
      generatedSections: fallbackBlueprint.sections,
      generatedPages: fallbackBlueprint.generatedPages,
    };
    let pageLayout = (podcast.page_layout as string[] | null) || ['hero', 'subscribe', 'product', 'grid', 'host', 'shorts'];

    try {
      const aiBlueprint = await generateImportSiteBlueprintWithOpenRouter({
        podcastTitle: podcast.title || 'Untitled podcast',
        podcastDescription: podcast.description || '',
        podcastImage: typeof themeConfig.imageUrl === 'string' ? themeConfig.imageUrl : null,
        websiteSignals,
        episodeSamples: (episodes || []).slice(0, 8).map((episode) => ({
          title: episode.title,
          publishedAt: episode.published_at,
        })),
      });

      if (aiBlueprint?.themeConfig) {
        Object.assign(nextTheme, {
          ...aiBlueprint.themeConfig,
          imageUrl: themeConfig.imageUrl,
          blueprintArchetype: aiBlueprint.themeConfig.blueprintArchetype || fallbackBlueprint.archetype,
          generatedNav: aiBlueprint.themeConfig.generatedNav?.length
            ? aiBlueprint.themeConfig.generatedNav
            : fallbackBlueprint.navItems,
          generatedSections: aiBlueprint.themeConfig.generatedSections?.length
            ? aiBlueprint.themeConfig.generatedSections
            : fallbackBlueprint.sections,
          generatedPages: aiBlueprint.themeConfig.generatedPages?.length
            ? aiBlueprint.themeConfig.generatedPages
            : fallbackBlueprint.generatedPages,
        });
      }

      if (aiBlueprint?.pageLayout?.length) {
        pageLayout = aiBlueprint.pageLayout;
      }
    } catch (error) {
      console.warn('AI import blueprint failed during build', error);
    }

    if (!themeConfig.imageUrl) {
      try {
        const brand = await generateAutoBrandIdentityWithOpenRouter({
          title: podcast.title || 'Untitled podcast',
          description: podcast.description || '',
          genre: 'general',
          hasArtwork: false,
          artworkDominantColors: [],
        });
        const autoTheme = autoBrandToThemeConfig(brand.identity);

        Object.assign(nextTheme, {
          ...autoTheme,
          brandMood: brand.identity.mood,
          generatedRationale: autoTheme.generatedRationale,
        });

        const generatedLogo = await generatePodcastLogoImage({
          title: podcast.title || 'Untitled podcast',
          description: shortDescription(podcast.description),
          mood: brand.identity.mood,
          primaryColor: brand.identity.primaryColor,
          accentColor: brand.identity.accentColor,
          backgroundColor: brand.identity.backgroundColor,
        });
        nextTheme.imageUrl = await uploadPodcastLogo(supabase, id, generatedLogo);
      } catch (error) {
        console.warn('AI auto-brand logo generation failed during build', error);
      }
    }

    themeConfig = await patchBuildState(supabase, id, nextTheme as Record<string, unknown>, {
      status: 'theme-ready',
      themeStatus: 'ready',
      themeReady: true,
      latestMessage: 'Theme ready. Transcribing latest episodes...',
    });

    await supabase
      .from('podcasts')
      .update({
        theme_config: themeConfig,
        page_layout: pageLayout,
        ai_brand: nextTheme,
        ai_brand_status: 'done',
      })
      .eq('id', id);

    const latestThree = (episodes || [])
      .filter((episode) => episode.audio_url && !episode.transcript_text)
      .slice(0, 3);

    if (latestThree.length) {
      themeConfig = await patchBuildState(supabase, id, themeConfig, {
        transcriptionStatus: 'processing',
        latestMessage: 'Transcribing latest episodes...',
      });
    } else {
      themeConfig = await patchBuildState(supabase, id, themeConfig, {
        transcriptionStatus: 'done',
        latestMessage: 'Your site is ready.',
      });
    }

    let transcribedEpisodes = 0;
    for (const episode of latestThree) {
      try {
        const transcript = await transcribeAudioUrlWithDeepgram(episode.audio_url as string);
        await supabase
          .from('episodes')
          .update({
            transcript_text: transcript.transcriptText,
            transcript_type: `deepgram/${transcript.model}`,
            transcript_fetched_at: new Date().toISOString(),
          })
          .eq('id', episode.id);

        transcribedEpisodes += 1;
        themeConfig = await patchBuildState(supabase, id, themeConfig, {
          transcribedEpisodes,
          transcriptionStatus: transcribedEpisodes === latestThree.length ? 'done' : 'processing',
        });

        const launchKit = await generateEpisodeLaunchAssetsWithOpenRouter({
          podcastTitle: podcast.title || 'Podcast',
          podcastDescription: podcast.description || '',
          episodeTitle: episode.title || 'Untitled episode',
          episodeDescription: episode.description || '',
          transcriptText: transcript.transcriptText,
          publishedAt: episode.published_at,
        });

        await supabase.from('episode_launch_assets').upsert(
          {
            episode_id: episode.id,
            podcast_id: id,
            model: launchKit.model,
            assets: launchKit.assets,
            status: 'ready',
            generated_at: new Date().toISOString(),
          },
          { onConflict: 'episode_id' },
        );
      } catch (error) {
        console.warn('Latest episode transcription failed during build', {
          podcastId: id,
          episodeId: episode.id,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    await patchBuildState(supabase, id, themeConfig, {
      status: 'ready',
      transcriptionStatus: 'done',
      latestMessage: 'Your site is ready.',
    });

    revalidatePath(`/${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Build run failed', error);
    await patchBuildState(supabase, id, themeConfig, {
      status: 'failed',
      themeStatus: 'failed',
      error: error instanceof Error ? error.message : 'Build failed',
      latestMessage: 'Build failed. Please try again.',
    }).catch(() => undefined);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Build failed' },
      { status: 500 },
    );
  }
}
