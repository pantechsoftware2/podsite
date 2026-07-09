import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { episodeId, videoId } = await req.json();

    if (!episodeId || !videoId) {
      return NextResponse.json({ error: 'Missing episodeId or videoId' }, { status: 400 });
    }

    // 1. Verify ownership of the episode
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, podcast_id')
      .eq('id', episodeId)
      .single();

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const { data: podcast } = await supabase
      .from('podcasts')
      .select('id')
      .eq('id', episode.podcast_id)
      .eq('owner_id', user.id)
      .single();

    if (!podcast) {
      return NextResponse.json({ error: 'Unauthorized podcast access' }, { status: 403 });
    }

    // 2. Confirm the match
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        youtube_video_id: videoId,
        video_sync_status: 'synced'
      })
      .eq('id', episodeId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Video Sync Confirm Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
