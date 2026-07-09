import { createClient } from '@supabase/supabase-js';
import { matchEpisodesToVideos } from './lib/youtube/matchEpisodes';
import { fetchChannelUploads } from './lib/youtube/fetchUploads';

async function debugSync() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const channelId = 'UCzQUP1qoWDoEbmsQxvdjxgQ';
    const apiKey = process.env.YOUTUBE_API_KEY!;
    const podcastId = 'Ready Set Do'; // This might be the title, I need the actual ID

    const { data: podcast } = await supabase
        .from('podcasts')
        .select('id, title')
        .ilike('title', '%Ready Set Do%')
        .single();

    if (!podcast) {
        console.error('Podcast not found');
        return;
    }

    console.log('Fetching episodes for:', podcast.title);
    const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title, published_at')
        .eq('podcast_id', podcast.id)
        .order('published_at', { ascending: false });

    console.log('Fetching videos for channel:', channelId);
    const videos = await fetchChannelUploads(apiKey, channelId, 50);

    console.log('--- RSS EPISODES (Top 5) ---');
    episodes?.slice(0, 5).forEach(e => console.log(`[Episode] ${e.title} (${e.published_at})`));

    console.log('--- YT VIDEOS (Top 5) ---');
    videos.slice(0, 5).forEach(v => console.log(`[Video] ${v.title} (${v.publishedAt})`));

    console.log('--- MATCHING RESULTS ---');
    const matches = matchEpisodesToVideos(episodes || [], videos);
    console.log('Matches found:', matches.length);
}

debugSync();
