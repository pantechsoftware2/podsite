
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Attempting to select a nonexistent column "ZZZZZZ" to trigger error with column hints...');

    // Try selecting a DEFINITELY WRONG column to see if it lists valid ones
    const { data, error } = await supabase
        .from('podcasts')
        .select('id, ZZZZZZ')
        .limit(1);

    if (error) {
        console.error('FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        console.error('Error details:', error.details);
    } else {
        console.log('Weirdly succeeded?', data);
    }
}

checkSchema();
