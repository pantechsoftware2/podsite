
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkThemeConfig() {
    console.log('Checking latest podcast theme_config...');

    const { data, error } = await supabase
        .from('podcasts')
        .select('title, theme_config, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Podcast:', data[0].title);
        console.log('Theme Config:', JSON.stringify(data[0].theme_config, null, 2));
    } else {
        console.log('No podcasts found.');
    }
}

checkThemeConfig();
