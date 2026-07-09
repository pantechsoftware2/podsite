
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

const podcastId = process.argv[2];

if (!podcastId) {
    console.error('Please provide a podcast ID');
    process.exit(1);
}

async function debugEpisodes() {
    console.log(`Checking episodes for podcast: ${podcastId}`);

    const { data, count, error } = await supabase
        .from('episodes')
        .select('*', { count: 'exact' })
        .eq('podcast_id', podcastId);

    if (error) {
        console.error('Error fetching episodes:', error);
        return;
    }

    console.log(`Total episodes found: ${count}`);
    if (data && data.length > 0) {
        console.log('Sample episode:', {
            id: data[0].id,
            title: data[0].title,
            slug: data[0].slug,
            published_at: data[0].published_at,
            video_sync_status: data[0].video_sync_status
        });
    } else {
        console.log('No episodes found for this podcast ID.');
    }
}

debugEpisodes();
