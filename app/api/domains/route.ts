import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { domain, podcastId } = await req.json();

        if (!domain || !podcastId) {
            return NextResponse.json({ error: 'Missing domain or podcastId' }, { status: 400 });
        }

        // 1. Verify user owns podcast
        const { data: podcast } = await supabase
            .from('podcasts')
            .select('id')
            .eq('id', podcastId)
            .eq('owner_id', user.id)
            .single();

        if (!podcast) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        // 2. Call Vercel API to add domain
        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID; // optional if personal
        const token = process.env.VERCEL_TOKEN;

        if (!projectId || !token) {
            // For now, allow it to just save to db if vercel tokens are missing (for local dev)
            console.warn('Vercel credentials missing. Skipping Vercel API call.');
        } else {
            const fetchUrl = teamId
                ? `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`
                : `https://api.vercel.com/v10/projects/${projectId}/domains`;

            const res = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: domain }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Vercel API error:', errorData);
                return NextResponse.json({ error: errorData.error?.message || 'Failed to add domain to Vercel' }, { status: res.status });
            }
        }

        // 3. Save domain to database
        const { error: dbError } = await supabase
            .from('podcasts')
            .update({ custom_domain: domain }) // Requires custom_domain column
            .eq('id', podcastId);

        if (dbError) {
            // Check if column error
            if (dbError.message.includes('column "custom_domain" of relation "podcasts" does not exist')) {
                return NextResponse.json({ error: 'Database column custom_domain is missing. Please run migration.' }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, domain });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
