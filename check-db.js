const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed or matched to ts-node
function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return {};

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            env[key] = value;
            process.env[key] = value;
        }
    });
    return env;
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const domain = 'makemypodcastsite.com';
    console.log(`🔍 Checking podcasts for domain: ${domain}`);

    // Check by custom_domain
    const { data: byDomain, error: domainError } = await supabase
        .from('podcasts')
        .select('id, title, custom_domain')
        .eq('custom_domain', domain)
        .maybeSingle();

    if (domainError) {
        console.error('❌ Error fetching by domain:', domainError);
    } else {
        console.log('✅ Result for custom_domain lookup:', byDomain || 'Not found');
    }

    // Check all with domains
    const { data: allWithDomains, error: listError } = await supabase
        .from('podcasts')
        .select('id, title, custom_domain')
        .not('custom_domain', 'is', null);

    if (listError) {
        console.error('❌ Error listing all podcasts with domains:', listError);
    } else {
        console.log('📋 All podcasts with custom domains:', allWithDomains);
    }
}

check().catch(err => {
    console.error('💥 Execution failed:', err);
    process.exit(1);
});
