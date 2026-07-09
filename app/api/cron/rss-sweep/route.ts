// app/api/cron/rss-sweep/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const parser = new Parser();

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, rss_url');

  for (const p of podcasts || []) {
    if (!p.rss_url) continue;
    const feed = await parser.parseURL(p.rss_url);
    // Map items → upsert episodes exactly like the import route
    // (reuse the same mapping logic)
  }

  return NextResponse.json({ ok: true });
}
