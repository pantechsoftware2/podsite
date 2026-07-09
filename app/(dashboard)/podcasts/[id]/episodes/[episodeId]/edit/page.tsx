import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import EpisodeEditor from '@/components/dashboard/EpisodeEditor';
import type { EpisodeLaunchAssets } from '@/lib/ai/openrouter';

type PageProps = {
    params: Promise<{ id: string; episodeId: string }>;
};

type LaunchAssetRow = {
    assets: EpisodeLaunchAssets | null;
};

type TimestampRow = {
    time?: string;
    title?: string;
    seconds?: number | null;
};

function cleanText(input: unknown) {
    return typeof input === 'string' ? input : '';
}

function normalizeTimestamps(input: unknown): Array<{ id: string; time: string; title: string; seconds: number | null }> {
    if (!Array.isArray(input)) return [];
    return input
        .filter((item): item is TimestampRow => Boolean(item && typeof item === 'object'))
        .map((item, index) => ({
            id: `initial-${index}`,
            time: cleanText(item.time),
            title: cleanText(item.title),
            seconds: typeof item.seconds === 'number' ? item.seconds : null,
        }))
        .filter((item) => item.time || item.title);
}

function normalizeTags(input: unknown) {
    if (!Array.isArray(input)) return [];
    return input.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()));
}

export default async function EpisodeEditPage({ params }: PageProps) {
    const supabase = await createSupabaseServerClient();
    const { id: podcastId, episodeId } = await params;

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect('/login');
    }

    const { data: podcast } = await supabase
        .from('podcasts')
        .select('id, title, owner_id')
        .eq('id', podcastId)
        .eq('owner_id', user.id)
        .maybeSingle();

    if (!podcast) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-8">
                <p>Podcast not found.</p>
            </main>
        );
    }

    const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id, podcast_id, slug, title, published_at, duration_seconds, audio_url, image_url, transcript, transcript_text, timestamps, youtube_description, spotify_description, seo_tags, thumbnail_url')
        .eq('id', episodeId)
        .eq('podcast_id', podcastId)
        .maybeSingle();

    if (episodeError) console.error('Episode edit fetch failed:', episodeError);

    if (!episode) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-8">
                <p>Episode not found.</p>
            </main>
        );
    }

    const { data: launchAsset } = await supabase
        .from('episode_launch_assets')
        .select('assets')
        .eq('episode_id', episodeId)
        .maybeSingle();

    const assets = (launchAsset as LaunchAssetRow | null)?.assets || null;
    const publicEpisodeUrl = `/${podcastId}/episodes/${episode.slug || episode.id}`;
    const initialFields = {
        title: episode.title || '',
        transcript: episode.transcript || episode.transcript_text || '',
        timestamps: normalizeTimestamps(episode.timestamps).length
            ? normalizeTimestamps(episode.timestamps)
            : normalizeTimestamps(assets?.timestamps),
        youtubeDescription: episode.youtube_description || assets?.platformDescriptions?.youtube || '',
        spotifyDescription: episode.spotify_description || assets?.platformDescriptions?.spotify || '',
        seoTags: normalizeTags(episode.seo_tags).length
            ? normalizeTags(episode.seo_tags)
            : normalizeTags(assets?.seoTags?.keywords || assets?.tags),
        thumbnailUrl: episode.thumbnail_url || episode.image_url || '',
    };

    return (
        <EpisodeEditor
            episodeId={episodeId}
            publicEpisodeUrl={publicEpisodeUrl}
            backUrl={`/podcasts/${podcastId}/episodes`}
            initialFields={initialFields}
            publishedAt={episode.published_at || null}
            durationSeconds={episode.duration_seconds || null}
            status={episode.audio_url ? 'Published' : 'Draft'}
        />
    );
}
