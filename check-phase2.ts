import { createClient } from '@supabase/supabase-js';

async function checkPhase2() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    console.log('Using URL:', supabaseUrl);
    console.log('Using Key (first 10 chars):', supabaseKey.substring(0, 10));

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: podcasts, error } = await supabase
            .from('podcasts')
            .select('id, title, theme_config, page_layout');

        if (error) {
            console.error('Supabase query error:', error);
            return;
        }

        console.log('QueryResult podcasts:', podcasts?.length);
        console.log('PODCASTS FOUND:', podcasts?.length ?? 0);
        console.log('PODCASTS DATA:');
        podcasts?.forEach(p => {
            console.log(`- ${p.title} (${p.id}):`);
            console.log(`  Layout: ${JSON.stringify(p.page_layout)}`);
            console.log(`  Theme: ${JSON.stringify(p.theme_config)}`);
        });
        process.exit(0);
    } catch (e) {
        console.error('Unexpected error in checkPhase2:', e);
        process.exit(1);
    }
}

console.log('Starting checkPhase2...');
checkPhase2().catch(err => {
    console.error('Top level error:', err);
    process.exit(1);
});
