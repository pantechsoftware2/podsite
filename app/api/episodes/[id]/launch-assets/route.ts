import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateEpisodeLaunchAssetsWithOpenRouter } from '@/lib/ai/openrouter';

type EpisodeWithPodcast = {
    id: string;
    podcast_id: string;
    title: string | null;
    description: string | null;
    transcript_text: string | null;
    published_at: string | null;
    podcasts: {
        id: string;
        title: string | null;
        description: string | null;
        owner_id: string;
    } | null;
};

async function getOwnedEpisode(episodeId: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('episodes')
        .select('id, podcast_id, title, description, transcript_text, published_at, podcasts!inner(id, title, description, owner_id)')
        .eq('id', episodeId)
        .eq('podcasts.owner_id', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as EpisodeWithPodcast | null) || null;
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const episode = await getOwnedEpisode(id, user.id);

    if (!episode) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const { data, error } = await supabase
        .from('episode_launch_assets')
        .select('*')
        .eq('episode_id', id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ launchAsset: data || null });
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const episode = await getOwnedEpisode(id, user.id);

    if (!episode || !episode.podcasts) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    try {
        const launchKit = await generateEpisodeLaunchAssetsWithOpenRouter({
            podcastTitle: episode.podcasts.title || 'Podcast',
            podcastDescription: episode.podcasts.description || '',
            episodeTitle: episode.title || 'Untitled episode',
            episodeDescription: episode.description || '',
            transcriptText: episode.transcript_text,
            publishedAt: episode.published_at,
        });

        const { data, error } = await supabase
            .from('episode_launch_assets')
            .upsert(
                {
                    episode_id: episode.id,
                    podcast_id: episode.podcast_id,
                    model: launchKit.model,
                    assets: launchKit.assets,
                    status: 'ready',
                    generated_at: new Date().toISOString(),
                },
                { onConflict: 'episode_id' },
            )
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ launchAsset: data });
    } catch (error: unknown) {
        console.error('Episode launch kit generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Could not generate launch assets.' },
            { status: 500 },
        );
    }
}
