import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateAndSaveSiteSeo, getOwnedPodcast } from '@/lib/ai/apiRouteActions';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => null) as { siteId?: unknown; siteUrl?: unknown } | null;
        const podcast = await getOwnedPodcast(supabase, body?.siteId, user.id);
        const seo = await generateAndSaveSiteSeo(supabase, podcast, body?.siteUrl);

        return NextResponse.json({ seo });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Site SEO generation failed' },
            { status: 500 },
        );
    }
}
