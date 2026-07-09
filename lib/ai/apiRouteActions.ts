import { buildCanonicalUrl, inferHostName } from '@/lib/publicSite';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { transcribeAudioUrlWithDeepgram } from '@/lib/ai/deepgram';
import {
    autoBrandToThemeConfig,
    generateAutoBrandIdentityWithOpenRouter,
    generateEpisodeLaunchAssetsWithOpenRouter,
    generateWebsiteSeoWithOpenRouter,
    type EpisodeLaunchAssets,
} from '@/lib/ai/openrouter';
import { generateEpisodeThumbnailImage, generatePodcastLogoImage } from '@/lib/ai/openrouterImages';
import type { ThemeConfig } from '@/components/ThemeEngine';

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type OwnedEpisode = {
    id: string;
    podcast_id: string;
    title: string | null;
    description: string | null;
    audio_url: string | null;
    transcript: string | null;
    transcript_text: string | null;
    timestamps: Array<{ time: string; title: string; seconds: number | null }> | null;
    published_at: string | null;
    podcasts: {
        id: string;
        owner_id: string;
        title: string | null;
        description: string | null;
        primary_color: string | null;
        accent_color: string | null;
        theme_config: Record<string, unknown> | null;
    } | null;
};

export type OwnedPodcast = {
    id: string;
    owner_id: string;
    title: string | null;
    description: string | null;
    rss_url: string | null;
    custom_domain: string | null;
    theme_config: Record<string, unknown> | null;
};

function cleanTags(input: unknown) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20);
}

function extensionForMime(mimeType: string) {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';
}

function shortDescription(input: string | null | undefined) {
    return (input || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
}

function themeColor(themeConfig: Record<string, unknown> | null | undefined, key: string) {
    const value = themeConfig?.[key];
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

function hasExplicitGuestSignal(title: string | null | undefined, prompt: string) {
    return /\b(with|featuring|feat\.?|guest)\b/i.test(`${title || ''} ${prompt}`);
}

export async function getOwnedEpisode(supabase: SupabaseServer, episodeId: unknown, userId: string) {
    if (typeof episodeId !== 'string' || !episodeId) {
        throw new Error('episodeId is required');
    }

    const { data, error } = await supabase
        .from('episodes')
        .select('id, podcast_id, title, description, audio_url, transcript, transcript_text, timestamps, published_at, podcasts!inner(id, owner_id, title, description, primary_color, accent_color, theme_config)')
        .eq('id', episodeId)
        .eq('podcasts.owner_id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Episode not found');

    return data as unknown as OwnedEpisode;
}

export async function getOwnedPodcast(supabase: SupabaseServer, siteId: unknown, userId: string) {
    if (typeof siteId !== 'string' || !siteId) {
        throw new Error('siteId is required');
    }

    const { data, error } = await supabase
        .from('podcasts')
        .select('id, owner_id, title, description, rss_url, custom_domain, theme_config')
        .eq('id', siteId)
        .eq('owner_id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Site not found');

    return data as unknown as OwnedPodcast;
}

export function requireTranscript(episode: OwnedEpisode) {
    const transcript = episode.transcript || episode.transcript_text || '';
    if (!transcript.trim()) {
        throw new Error('Transcript is required before this generation step.');
    }

    return transcript;
}

export async function transcribeEpisode(supabase: SupabaseServer, episode: OwnedEpisode, audioUrl?: unknown) {
    const effectiveAudioUrl = typeof audioUrl === 'string' && audioUrl.trim()
        ? audioUrl.trim()
        : episode.audio_url;

    if (!effectiveAudioUrl) {
        throw new Error('audioUrl is required');
    }

    await supabase
        .from('episodes')
        .update({ transcript_status: 'processing' })
        .eq('id', episode.id);

    try {
        const transcript = await transcribeAudioUrlWithDeepgram(effectiveAudioUrl);
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('episodes')
            .update({
                transcript: transcript.transcriptText,
                transcript_text: transcript.transcriptText,
                transcript_status: 'done',
                transcript_type: `deepgram/${transcript.model}`,
                transcript_fetched_at: now,
                ai_generated_at: now,
            })
            .eq('id', episode.id);

        if (error) throw new Error(error.message);
        return transcript;
    } catch (error) {
        await supabase
            .from('episodes')
            .update({ transcript_status: 'failed' })
            .eq('id', episode.id);
        throw error;
    }
}

export async function generateLaunchAssetsForEpisode(episode: OwnedEpisode, transcriptText?: string) {
    if (!episode.podcasts) throw new Error('Podcast not found');

    return generateEpisodeLaunchAssetsWithOpenRouter({
        podcastTitle: episode.podcasts.title || 'Podcast',
        podcastDescription: episode.podcasts.description || '',
        episodeTitle: episode.title || 'Untitled episode',
        episodeDescription: episode.description || '',
        transcriptText,
        publishedAt: episode.published_at,
    });
}

export async function generateAndSaveTimestamps(supabase: SupabaseServer, episode: OwnedEpisode) {
    const transcript = requireTranscript(episode);
    const launchKit = await generateLaunchAssetsForEpisode(episode, transcript);
    const timestamps = launchKit.assets.timestamps;

    const { error } = await supabase
        .from('episodes')
        .update({ timestamps, ai_generated_at: new Date().toISOString() })
        .eq('id', episode.id);

    if (error) throw new Error(error.message);
    return timestamps;
}

export async function generateAndSaveYoutubeDescription(supabase: SupabaseServer, episode: OwnedEpisode) {
    const transcript = requireTranscript(episode);
    if (!episode.timestamps?.length) {
        throw new Error('Timestamps are required before generating a YouTube description.');
    }

    const launchKit = await generateLaunchAssetsForEpisode(episode, transcript);
    const description = launchKit.assets.platformDescriptions.youtube;

    const { error } = await supabase
        .from('episodes')
        .update({ youtube_description: description, ai_generated_at: new Date().toISOString() })
        .eq('id', episode.id);

    if (error) throw new Error(error.message);
    return description;
}

export async function generateAndSaveSpotifyDescription(supabase: SupabaseServer, episode: OwnedEpisode) {
    const transcript = requireTranscript(episode);
    const launchKit = await generateLaunchAssetsForEpisode(episode, transcript);
    const description = launchKit.assets.platformDescriptions.spotify;

    const { error } = await supabase
        .from('episodes')
        .update({ spotify_description: description, ai_generated_at: new Date().toISOString() })
        .eq('id', episode.id);

    if (error) throw new Error(error.message);
    return description;
}

export async function generateAndSaveSeoTags(supabase: SupabaseServer, episode: OwnedEpisode) {
    const transcript = requireTranscript(episode);
    const launchKit = await generateLaunchAssetsForEpisode(episode, transcript);
    const tags = launchKit.assets.seoTags || {
        metaTitle: launchKit.assets.seoTitle,
        metaDescription: launchKit.assets.seoDescription,
        keywords: launchKit.assets.tags,
        ogTitle: launchKit.assets.seoTitle,
        ogDescription: launchKit.assets.seoDescription,
    };

    const { error } = await supabase
        .from('episodes')
        .update({
            seo_tags: cleanTags(tags.keywords),
            ai_generated_at: new Date().toISOString(),
        })
        .eq('id', episode.id);

    if (error) throw new Error(error.message);
    return tags;
}

export async function generateAndSaveThumbnail(
    supabase: SupabaseServer,
    episode: OwnedEpisode,
    launchKit?: { assets: EpisodeLaunchAssets },
) {
    if (!episode.podcasts) throw new Error('Podcast not found');

    const transcript = episode.transcript || episode.transcript_text || undefined;
    const assets = launchKit?.assets || (await generateLaunchAssetsForEpisode(episode, transcript)).assets;
    const brief = assets.thumbnailBriefs[0];

    if (!brief?.prompt) {
        throw new Error('Could not create a thumbnail prompt for this episode.');
    }

    const generated = await generateEpisodeThumbnailImage({
        prompt: brief.prompt,
        overlayText: brief.overlayText,
        episodeTitle: episode.title || 'Untitled episode',
        podcastTitle: episode.podcasts.title || 'Podcast',
        primaryColor: episode.podcasts.primary_color || themeColor(episode.podcasts.theme_config, 'primaryColor'),
        accentColor: episode.podcasts.accent_color || themeColor(episode.podcasts.theme_config, 'accentColor'),
        hasGuest: hasExplicitGuestSignal(episode.title, brief.prompt),
    });
    const storagePath = `${episode.podcast_id}/${episode.id}/${crypto.randomUUID()}.${extensionForMime(generated.mimeType)}`;

    const { error: uploadError } = await supabase.storage
        .from('episode-thumbnails')
        .upload(storagePath, generated.bytes, {
            contentType: generated.mimeType,
            upsert: false,
        });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
        .from('episode-thumbnails')
        .getPublicUrl(storagePath);

    const thumbnailUrl = publicUrlData.publicUrl;
    const now = new Date().toISOString();

    const [{ error: updateError }, { error: insertError }] = await Promise.all([
        supabase
            .from('episodes')
            .update({
                thumbnail_url: thumbnailUrl,
                image_url: thumbnailUrl,
                ai_generated_at: now,
            })
            .eq('id', episode.id),
        supabase
            .from('episode_thumbnail_generations')
            .insert({
                episode_id: episode.id,
                podcast_id: episode.podcast_id,
                prompt: brief.prompt,
                concept: brief.concept,
                overlay_text: brief.overlayText,
                model: generated.model,
                storage_path: storagePath,
                public_url: thumbnailUrl,
                status: 'ready',
            }),
    ]);

    if (updateError) throw new Error(updateError.message);
    if (insertError) throw new Error(insertError.message);

    return thumbnailUrl;
}

export async function generateAndSaveBrand(supabase: SupabaseServer, podcast: OwnedPodcast) {
    const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
    const hasArtwork = Boolean(themeConfig.imageUrl);
    const generated = await generateAutoBrandIdentityWithOpenRouter({
        title: podcast.title || 'Untitled podcast',
        description: podcast.description || '',
        genre: 'general',
        hasArtwork,
        artworkDominantColors: [],
    });
    const generatedTheme = autoBrandToThemeConfig(generated.identity);
    const nextThemeConfig: ThemeConfig = {
        ...themeConfig,
        ...generatedTheme,
        brandMood: generated.identity.mood,
        generatedRationale: generatedTheme.generatedRationale,
    };

    let logoUrl = typeof themeConfig.imageUrl === 'string' ? themeConfig.imageUrl : null;
    if (!logoUrl) {
        const logo = await generatePodcastLogoImage({
            title: podcast.title || 'Untitled podcast',
            description: shortDescription(podcast.description),
            mood: generated.identity.mood,
            primaryColor: generated.identity.primaryColor,
            accentColor: generated.identity.accentColor,
            backgroundColor: generated.identity.backgroundColor,
        });
        const storagePath = `${podcast.id}/${crypto.randomUUID()}.${extensionForMime(logo.mimeType)}`;
        const { error: uploadError } = await supabase.storage
            .from('podcast-logos')
            .upload(storagePath, logo.bytes, {
                contentType: logo.mimeType,
                upsert: false,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage
            .from('podcast-logos')
            .getPublicUrl(storagePath);

        logoUrl = data.publicUrl;
        nextThemeConfig.imageUrl = logoUrl;
    }

    const brand = {
        ...generated.identity,
        logoUrl,
        model: generated.model,
        generatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('podcasts')
        .update({
            ai_brand: brand,
            ai_brand_status: 'done',
            theme_config: nextThemeConfig,
        })
        .eq('id', podcast.id)
        .eq('owner_id', podcast.owner_id);

    if (error) throw new Error(error.message);
    return brand;
}

export async function generateAndSaveSiteSeo(
    supabase: SupabaseServer,
    podcast: OwnedPodcast,
    siteUrl?: unknown,
) {
    const [{ count }, { data: latestEpisodes, error: episodesError }] = await Promise.all([
        supabase
            .from('episodes')
            .select('id', { count: 'exact', head: true })
            .eq('podcast_id', podcast.id),
        supabase
            .from('episodes')
            .select('title')
            .eq('podcast_id', podcast.id)
            .order('published_at', { ascending: false })
            .limit(5),
    ]);

    if (episodesError) throw new Error(episodesError.message);

    const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
    const canonicalSiteUrl = typeof siteUrl === 'string' && siteUrl.trim()
        ? siteUrl.trim()
        : await buildCanonicalUrl(podcast, podcast.id);
    const hostName = inferHostName({
        title: podcast.title,
        description: podcast.description,
        theme_config: themeConfig,
    });

    const generated = await generateWebsiteSeoWithOpenRouter({
        title: podcast.title || 'Untitled podcast',
        hostName,
        description: podcast.description || '',
        episodeCount: count || 0,
        latestEpisodeTitles: (latestEpisodes || [])
            .map((episode) => typeof episode.title === 'string' ? episode.title : '')
            .filter(Boolean),
        rssUrl: themeConfig.rssUrlOverride || podcast.rss_url || null,
        siteUrl: canonicalSiteUrl,
    });

    const seo = {
        ...generated.seo,
        model: generated.model,
        generatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('podcasts')
        .update({
            theme_config: {
                ...themeConfig,
                websiteSeo: seo,
            },
        })
        .eq('id', podcast.id)
        .eq('owner_id', podcast.owner_id);

    if (error) throw new Error(error.message);
    return seo;
}
