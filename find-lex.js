const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function l() {
    const c = fs.readFileSync('.env.local', 'utf8');
    const e = {};
    c.split('\n').filter(Boolean).forEach(x => {
        const parts = x.split('=');
        if (parts.length > 1) e[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/['\"]/g, '');
    });
    return e;
}

const env = l();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log('Searching for Lex...');
    const { data, error } = await supabase.from('podcasts').select('id, title').ilike('title', '%Lex%');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found:', data);
    }
}

run();
