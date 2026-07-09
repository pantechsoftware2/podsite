// app/api/episodes/link-youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { episodeId, youtubeVideoId } = await req.json();

  if (!episodeId || !youtubeVideoId) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  // Optional: ensure episode belongs to this user:
  // const { data: ep, error: epErr } = await supabase
  //   .from('episodes')
  //   .select('id, podcast_id, podcasts!inner(owner_id)')
  //   .eq('id', episodeId)
  //   .eq('podcasts.owner_id', session.user.id)
  //   .maybeSingle();
  // if (epErr || !ep) return new NextResponse('Forbidden', { status: 403 });

  const { error } = await supabase
    .from('episodes')
    .update({ youtube_video_id: youtubeVideoId })
    .eq('id', episodeId);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
