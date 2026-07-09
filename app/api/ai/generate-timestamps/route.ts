import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateAndSaveTimestamps, getOwnedEpisode } from '@/lib/ai/apiRouteActions';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => null) as { episodeId?: unknown } | null;
        const episode = await getOwnedEpisode(supabase, body?.episodeId, user.id);
        const timestamps = await generateAndSaveTimestamps(supabase, episode);

        return NextResponse.json({ timestamps });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Timestamp generation failed' },
            { status: 500 },
        );
    }
}
