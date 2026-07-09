import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const podcastId = searchParams.get('podcastId');

  try {
    // 1. Verify ownership
    const { data: podcast } = await supabase
      .from('podcasts')
      .select('id, youtube_channel_id')
      .eq('id', podcastId)
      .eq('owner_id', user.id)
      .single();

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    // 2. Fetch pending episodes
    const { data: episodes } = await supabase
      .from('episodes')
      .select('*')
      .eq('podcast_id', podcastId)
      .eq('video_sync_status', 'pending');

    // 3. (Mock Logic) If no pending database entries, we could run the fuzzy matcher here
    // For this structure-only task, we'll return an empty list if nothing in DB.
    
    const matches = (episodes || []).map(ep => ({
      episodeId: ep.id,
      episodeTitle: ep.title,
      episodeDate: ep.published_at,
      // In a real scenario, we'd have the fuzzy matcher's suggested video data here
      videoId: 'example_video_id',
      videoTitle: ep.title + ' (YouTube Version)',
      videoThumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
      confidence: 0.98
    }));

    return NextResponse.json({ matches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
