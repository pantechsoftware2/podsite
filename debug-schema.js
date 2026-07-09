
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

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
        console.log('No podcasts found, cannot inspect columns via select *. Trying to inspect error schema.');
        // If no data, try inserting a dummy that will fail but reveal columns?
        // Or just list columns from information_schema if possible (usually not via client).
    }
}

checkSchema();
