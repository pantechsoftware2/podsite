import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getOwnedEpisode, transcribeEpisode } from '@/lib/ai/apiRouteActions';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => null) as { episodeId?: unknown; audioUrl?: unknown } | null;
        const episode = await getOwnedEpisode(supabase, body?.episodeId, user.id);

        await transcribeEpisode(supabase, episode, body?.audioUrl);

        return NextResponse.json({ status: 'processing' });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Transcription failed' },
            { status: 500 },
        );
    }
}
