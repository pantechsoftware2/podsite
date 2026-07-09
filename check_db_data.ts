
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
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
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkData() {
  console.log('Checking podcasts...');
  const { data: podcasts, error: pError } = await supabase.from('podcasts').select('id, title, custom_domain');
  if (pError) console.error('Podcasts error:', pError);
  else console.log('Podcasts:', podcasts);

  if (podcasts && podcasts.length > 0) {
    for (const p of podcasts) {
      const { count, error: eError } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('podcast_id', p.id);
      
      if (eError) console.error(`Episodes error for ${p.title}:`, eError);
      else console.log(`Podcast "${p.title}" (${p.id}) has ${count} episodes.`);
    }
  }
}

checkData();
