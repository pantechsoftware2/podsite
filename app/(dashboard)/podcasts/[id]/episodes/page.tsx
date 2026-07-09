import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EpisodeLaunchStudio from '@/components/dashboard/EpisodeLaunchStudio';
import type { EpisodeLaunchAssets } from '@/lib/ai/openrouter';

type PageProps = {
    params: Promise<{ id: string }>;
};

type EpisodeRow = {
    id: string;
    slug: string | null;
    title: string | null;
    published_at: string | null;
    description: string | null;
    audio_url: string | null;
    transcript_text?: string | null;
};

type LaunchAssetRow = {
    id: string;
    episode_id: string;
    model: string | null;
    generated_at: string | null;
    assets: EpisodeLaunchAssets | null;
};

type ThumbnailGenerationRow = {
    id: string;
    episode_id: string;
    prompt: string;
    concept: string | null;
    overlay_text: string | null;
    model: string | null;
    public_url: string | null;
    status: string;
    error: string | null;
    created_at: string | null;
};

function cleanDescription(input: string | null | undefined) {
    return (input || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function formatPublishedDate(input: string | null) {
    return input ? new Date(input).toLocaleDateString() : '-';
}

export default async function PodcastEpisodesPage({ params }: PageProps) {
    const supabase = await createSupabaseServerClient();
    const { id: podcastId } = await params;
    console.log('Episodes Page Hit:', podcastId);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect('/login');
    }

    const { data: podcast, error: podcastError } = await supabase
        .from('podcasts')
        .select('id, title')
        .eq('id', podcastId)
        .eq('owner_id', user.id)
        .maybeSingle();

    if (podcastError) console.error('Episodes Page DB Error:', podcastError);
    if (!podcast) console.log('Episodes Page: Podcast NOT FOUND for ID:', podcastId, 'and owner:', user.id);

    if (!podcast || podcastError) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-8">
                <p>Podcast not found.</p>
            </main>
        );
    }

    const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('id, slug, title, description, audio_url, transcript_text, published_at')
        .eq('podcast_id', podcastId)
        .order('published_at', { ascending: false });

    if (episodesError) {
        console.error('Error fetching episodes:', episodesError);
    } else {
        console.log(`Episodes Page: Found ${episodes?.length || 0} episodes`);
    }

    const rows = (episodes as EpisodeRow[]) ?? [];
    const episodeIds = rows.map((episode) => episode.id);
    const { data: launchAssets, error: launchAssetsError } = episodeIds.length
        ? await supabase
            .from('episode_launch_assets')
            .select('id, episode_id, model, generated_at, assets')
            .in('episode_id', episodeIds)
        : { data: [], error: null };

    if (launchAssetsError) {
        console.error('Error fetching episode launch assets:', launchAssetsError);
    }

    const launchAssetByEpisode = new Map(
        ((launchAssets as LaunchAssetRow[]) || []).map((asset) => [asset.episode_id, asset]),
    );
    const { data: thumbnails, error: thumbnailsError } = episodeIds.length
        ? await supabase
            .from('episode_thumbnail_generations')
            .select('id, episode_id, prompt, concept, overlay_text, model, public_url, status, error, created_at')
            .in('episode_id', episodeIds)
            .order('created_at', { ascending: false })
        : { data: [], error: null };

    if (thumbnailsError) {
        console.error('Error fetching thumbnail generations:', thumbnailsError);
    }

    const thumbnailsByEpisode = ((thumbnails as ThumbnailGenerationRow[]) || []).reduce((map, thumbnail) => {
        const current = map.get(thumbnail.episode_id) || [];
        map.set(thumbnail.episode_id, [...current, thumbnail]);
        return map;
    }, new Map<string, ThumbnailGenerationRow[]>());

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
            <header className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        {podcast.title}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Manage episodes and generate launch assets for every release.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href={`/dashboard/customize?siteId=${podcastId}`}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        Customize
                    </Link>
                    <Link
                        href="/dashboard"
                        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
                    <p className="text-slate-500">No episodes yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rows.map((episode) => {
                        const description = cleanDescription(episode.description);
                        const publicEpisodeUrl = `/${podcastId}/episodes/${episode.slug || episode.id}`;
                        const editEpisodeUrl = `/podcasts/${podcastId}/episodes/${episode.id}/edit`;

                        return (
                            <article key={episode.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-100">{episode.title}</h2>
                                            {episode.audio_url ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Published</span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">Draft</span>
                                            )}
                                            {episode.transcript_text && (
                                                <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-300 ring-1 ring-inset ring-sky-500/20">Transcript SEO</span>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Published {formatPublishedDate(episode.published_at)}
                                        </p>
                                        {description && (
                                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                                                {description.slice(0, 260)}{description.length > 260 ? '...' : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <Link
                                            href={editEpisodeUrl}
                                            className="rounded-full bg-sky-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition-all hover:scale-[1.02]"
                                        >
                                            Edit
                                        </Link>
                                        <Link
                                            href={publicEpisodeUrl}
                                            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-sky-400/40 hover:text-sky-200"
                                        >
                                            Public Page
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <EpisodeLaunchStudio
                                        episodeId={episode.id}
                                        publicEpisodeUrl={publicEpisodeUrl}
                                        initialLaunchAsset={launchAssetByEpisode.get(episode.id) || null}
                                        initialThumbnails={thumbnailsByEpisode.get(episode.id) || []}
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
