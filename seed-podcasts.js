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
// NOTE: This usually requires the SERVICE_ROLE_KEY to bypass RLS
// If you don't have it, you must be logged in to the dashboard to create a podcast.
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function seed() {
    console.log('--- DATABASE SEEDER ---');

    // 1. Get first user profile or use a dummy
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const ownerId = profiles && profiles.length > 0 ? profiles[0].id : '00000000-0000-0000-0000-000000000000';

    if (ownerId === '00000000-0000-0000-0000-000000000000') {
        console.warn('⚠️ No user profile found. The podcast will be created with a dummy owner_id.');
        console.warn('You should login to the dashboard first to create a real profile.');
    }

    console.log('Using owner_id:', ownerId);

    // 2. Insert Podcast
    const podcastData = {
        owner_id: ownerId,
        title: 'Ready Set Do',
        description: 'The ultimate podcast show for creators.',
        rss_url: 'https://feeds.simplecast.com/Sl5CSM3S',
        custom_domain: 'makemypodcastsite.com',
        primary_color: '#6366f1',
        accent_color: '#8b5cf6',
        theme_config: {
            imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=60'
        },
        page_layout: ['hero', 'shorts', 'subscribe', 'grid', 'host']
    };

    console.log('Seeding podcast in DB...');
    const { data, error } = await supabase.from('podcasts').insert(podcastData).select().single();

    if (error) {
        console.error('❌ Failed to seed:', error.message);
        if (error.code === '42501') {
            console.error('   Hint: RLS is active. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass it.');
        }
    } else {
        console.log('✅ Successfully seeded podcast:', data.id);
    }
}

seed();
