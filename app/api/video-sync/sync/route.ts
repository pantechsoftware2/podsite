import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { fetchShorts } from '@/lib/youtube/shorts'; // Existing YouTube logic
import { fuzzyMatchEpisodesToVideos } from '@/lib/youtube/fuzzyMatcher';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { podcastId } = await req.json();

        // 1. Fetch podcast channel ID
        const { data: podcast } = await supabase
            .from('podcasts')
            .select('id, youtube_channel_id, title')
            .eq('id', podcastId)
            .eq('owner_id', user.id)
            .single();

        if (!podcast || !podcast.youtube_channel_id) {
            return NextResponse.json({ error: 'Podcast or YouTube Channel ID not found' }, { status: 404 });
        }

        // 2. Fetch episodes with no video link and videos from YouTube
        const { data: episodes } = await supabase
            .from('episodes')
            .select('id, title, published_at')
            .eq('podcast_id', podcastId)
            .is('youtube_video_id', null);

        if (!episodes || episodes.length === 0) {
            return NextResponse.json({ success: true, message: 'No episodes need matching' });
        }

        // 3. Fetch videos from YouTube channel
        const apiKey = process.env.YOUTUBE_API_KEY;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${podcast.youtube_channel_id}&part=snippet&order=date&maxResults=50&type=video`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        const videos = (searchData.items || []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails
        }));

        // 4. Run Fuzzy Matcher
        const matches = fuzzyMatchEpisodesToVideos(episodes, videos);

        // 5. Store matches in episodes table (using video_sync_status and suggest_match column if exists)
        // For this structure, we'll mark them as 'pending' and store matched video in metadata or a temp column
        for (const match of matches) {
            await supabase
                .from('episodes')
                .update({ 
                    video_sync_status: 'pending',
                    // We'll assume a JSON column exists or we use metadata
                })
                .eq('id', match.episodeId);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Found ${matches.length} matches. View them in the Video Sync dashboard.`,
            matches 
        });
    } catch (error: any) {
        console.error('Sync Trigger Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
