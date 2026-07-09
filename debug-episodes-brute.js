
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
    'image',
    'image_url',
    'imageUrl',
    'img_url',
    'img',
    'episode_image',
    'episode_image_url',
    'cover',
    'cover_image',
    'artwork',
    'picture',
    'thumbnail'
];

async function checkEpisodesColumns() {
    console.log('Starting brute force column check for episodes...');

    for (const col of candidates) {
        process.stdout.write(`Checking '${col}'... `);
        const { data, error } = await supabase
            .from('episodes')
            .select(`id, ${col}`)
            .limit(1);

        if (!error) {
            console.log('✅ FOUND IT! Schema accepts:', col);
            return;
        } else {
            if (error.message.includes('does not exist') || error.code === '42703') {
                console.log('❌ Nope.');
            } else {
                console.log('⚠️ Error but maybe exists?', error.message);
            }
        }
    }
    console.log('Finished. No match found in candidates.');
}

checkEpisodesColumns();
