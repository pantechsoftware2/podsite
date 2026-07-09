import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getDomainLiveEmailHtml, sendResend } from '@/lib/emails';

/** Trigger: after DNS verification — send "Your domain is live" to podcast owner */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, podcastId } = await req.json();
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain required' }, { status: 400 });
    }

    if (podcastId) {
      const { data: podcast } = await supabase
        .from('podcasts')
        .select('owner_id')
        .eq('id', podcastId)
        .eq('owner_id', user.id)
        .single();
      if (!podcast) {
        return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
      }
    }

    const html = getDomainLiveEmailHtml(domain.trim());
    const result = await sendResend(user.email, 'Your domain is live 🎉', html);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ sent: true });
  } catch (e: any) {
    console.error('Domain live email error', e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
