
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEpisodesSchema() {
    console.log('Checking episodes table schema...');

    // Try to select a non-existent column to trigger the "hint" error which lists valid columns
    const { data, error } = await supabase
        .from('episodes')
        .select('id, ZZZZZZ')
        .limit(1);

    if (error) {
        console.error('Error message:', error.message);
        // console.error('Full error:', error); 
    } else {
        console.log('Success? Columns:', Object.keys(data[0]));
    }
}

checkEpisodesSchema();
