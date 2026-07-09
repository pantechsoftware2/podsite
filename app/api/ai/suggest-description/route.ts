import { NextResponse } from 'next/server';
import { suggestPodcastDescription } from '@/lib/ai/gemini';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, description } = await req.json();
        const suggestion = await suggestPodcastDescription(title, description);
        return NextResponse.json({ suggestion });
    } catch (error: any) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
    }
}
