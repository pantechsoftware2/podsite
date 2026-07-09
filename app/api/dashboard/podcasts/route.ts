// app/api/dashboard/podcasts/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('podcasts')
      .select('id, title, description, rss_url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('podcasts error', error);
      return NextResponse.json(
        { podcasts: [], error: error.message },
        { status: 200 },
      );
    }

    return NextResponse.json({ podcasts: data ?? [] });
  } catch (err: any) {
    console.error('podcasts unexpected error', err);
    return NextResponse.json(
      { podcasts: [], error: 'Supabase fetch failed' },
      { status: 200 },
    );
  }
}
