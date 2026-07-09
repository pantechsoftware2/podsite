import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

type SavePayload = {
    title?: string;
    transcript?: string;
    timestamps?: Array<{ time: string; title: string; seconds: number | null }>;
    youtubeDescription?: string;
    spotifyDescription?: string;
    seoTags?: string[];
    thumbnailUrl?: string;
};

async function getOwnedEpisode(episodeId: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('episodes')
        .select('id, podcasts!inner(owner_id)')
        .eq('id', episodeId)
        .eq('podcasts.owner_id', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

function cleanTags(input: unknown) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20);
}

function cleanTimestamps(input: unknown) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
            time: typeof item.time === 'string' ? item.time.trim() : '',
            title: typeof item.title === 'string' ? item.title.trim() : '',
            seconds: typeof item.seconds === 'number' && Number.isFinite(item.seconds) ? Math.max(0, Math.round(item.seconds)) : null,
        }))
        .filter((item) => item.time && item.title)
        .slice(0, 30);
}

export async function PATCH(
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
    if (!episode) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const payload = await req.json().catch(() => null) as SavePayload | null;
    if (!payload) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const transcript = typeof payload.transcript === 'string' ? payload.transcript : '';
    const thumbnailUrl = typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl.trim() : '';

    const { data, error } = await supabase
        .from('episodes')
        .update({
            title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : undefined,
            transcript,
            transcript_text: transcript,
            transcript_status: transcript ? 'done' : 'pending',
            timestamps: cleanTimestamps(payload.timestamps),
            youtube_description: typeof payload.youtubeDescription === 'string' ? payload.youtubeDescription : '',
            spotify_description: typeof payload.spotifyDescription === 'string' ? payload.spotifyDescription : '',
            seo_tags: cleanTags(payload.seoTags),
            thumbnail_url: thumbnailUrl || null,
            image_url: thumbnailUrl || undefined,
            ai_generated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ episode: data });
}
