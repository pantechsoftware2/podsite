import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateAndSaveBrand, getOwnedPodcast } from '@/lib/ai/apiRouteActions';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => null) as { siteId?: unknown } | null;
        const podcast = await getOwnedPodcast(supabase, body?.siteId, user.id);
        const brand = await generateAndSaveBrand(supabase, podcast);

        return NextResponse.json({ brand });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Brand generation failed' },
            { status: 500 },
        );
    }
}
