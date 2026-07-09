import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env.local as dotenv is not in package.json
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.warn('⚠️ .env.local not found');
        return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const domain = 'makemypodcastsite.com';
    console.log(`🔍 Searching for podcast with identifier: ${domain}`);

    // Safe UUID check to avoid Postgres type errors
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(domain);

    const { data, error } = await supabase
        .from('podcasts')
        .select('id, title, custom_domain')
        .or(isUuid ? `id.eq.${domain},custom_domain.eq.${domain}` : `custom_domain.eq.${domain}`)
        .maybeSingle();

    if (error) {
        console.error('❌ Database error:', error);
    } else if (data) {
        console.log('✅ Found Podcast:', data);
    } else {
        console.log('❓ No podcast found matching this identifier.');
    }

    // List all active custom domains
    const { data: allWithDomains, error: err2 } = await supabase
        .from('podcasts')
        .select('id, title, custom_domain')
        .not('custom_domain', 'is', null);

    if (err2) {
        console.error('❌ Error listing domains:', err2);
    } else {
        console.log('📋 All podcasts with custom domains set:', allWithDomains);
    }
}

check().catch(console.error);
