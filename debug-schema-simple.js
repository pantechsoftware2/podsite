
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yameixbeesqlctieqvgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWVpeGJlZXNxbGN0aWVxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTc2NzYsImV4cCI6MjA4NDY3MzY3Nn0.3UsmA6IFXQ6jS9lDNjvY0ZDXG-zeJl82DcYVjDJuHPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking podcasts table schema...');
    const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching podcasts:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found columns:', Object.keys(data[0]));
    } else {
        console.log('No podcasts found. Trying to insert dummy to see error schema?');
    }
}

checkSchema();
