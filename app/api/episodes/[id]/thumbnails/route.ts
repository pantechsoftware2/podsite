import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateEpisodeThumbnailImage } from '@/lib/ai/openrouterImages';

type EpisodeWithPodcast = {
    id: string;
    podcast_id: string;
    title: string | null;
    podcasts: {
        id: string;
        title: string | null;
        primary_color: string | null;
        accent_color: string | null;
        theme_config: Record<string, unknown> | null;
        owner_id: string;
    } | null;
};

function themeColor(themeConfig: Record<string, unknown> | null | undefined, key: string) {
    const value = themeConfig?.[key];
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

function hasExplicitGuestSignal(title: string | null | undefined, prompt: string) {
    return /\b(with|featuring|feat\.?|guest)\b/i.test(`${title || ''} ${prompt}`);
}

async function getOwnedEpisode(episodeId: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('episodes')
        .select('id, podcast_id, title, podcasts!inner(id, title, primary_color, accent_color, theme_config, owner_id)')
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
        .from('episode_thumbnail_generations')
        .select('*')
        .eq('episode_id', id)
        .order('created_at', { ascending: false })
        .limit(12);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ thumbnails: data || [] });
}

export async function POST(
    req: Request,
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

    const body = await req.json().catch(() => null) as
        | { prompt?: string; concept?: string; overlayText?: string }
        | null;

    const prompt = body?.prompt?.trim();
    if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const concept = body?.concept?.trim() || 'Generated thumbnail';
    const overlayText = body?.overlayText?.trim() || null;

    try {
        const generated = await generateEpisodeThumbnailImage({
            prompt,
            overlayText,
            episodeTitle: episode.title || 'Untitled episode',
            podcastTitle: episode.podcasts.title || 'Podcast',
            primaryColor: episode.podcasts.primary_color || themeColor(episode.podcasts.theme_config, 'primaryColor'),
            accentColor: episode.podcasts.accent_color || themeColor(episode.podcasts.theme_config, 'accentColor'),
            hasGuest: hasExplicitGuestSignal(episode.title, prompt),
        });
        const storagePath = `${episode.podcast_id}/${episode.id}/${crypto.randomUUID()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('episode-thumbnails')
            .upload(storagePath, generated.bytes, {
                contentType: generated.mimeType,
                upsert: false,
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
            .from('episode-thumbnails')
            .getPublicUrl(storagePath);

        const { data, error } = await supabase
            .from('episode_thumbnail_generations')
            .insert({
                episode_id: episode.id,
                podcast_id: episode.podcast_id,
                prompt,
                concept,
                overlay_text: overlayText,
                model: generated.model,
                storage_path: storagePath,
                public_url: publicUrlData.publicUrl,
                status: 'ready',
            })
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ thumbnail: data });
    } catch (error: unknown) {
        console.error('Episode thumbnail generation failed:', error);

        const { data } = await supabase
            .from('episode_thumbnail_generations')
            .insert({
                episode_id: episode.id,
                podcast_id: episode.podcast_id,
                prompt,
                concept,
                overlay_text: overlayText,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Thumbnail generation failed.',
            })
            .select('*')
            .maybeSingle();

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Thumbnail generation failed.',
                thumbnail: data || null,
            },
            { status: 500 },
        );
    }
}
