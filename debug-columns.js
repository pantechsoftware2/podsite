
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
    'created_at',
    'youtube_channel_id',
    'owner_id',
    'rss_url',
    'title',
    'description',
    'id',
    'subdomain',
    'slug',
    'custom_domain'
];

async function checkColumns() {
    console.log('Checking podcasts table for common columns...');

    for (const col of candidates) {
        process.stdout.write(`Checking '${col}'... `);
        const { data, error } = await supabase
            .from('podcasts')
            .select(`id, ${col}`)
            .limit(1);

        if (!error) {
            console.log('✅ OK');
        } else {
            console.log('❌ MISSING or ERROR:', error.message);
        }
    }
}

checkColumns();
