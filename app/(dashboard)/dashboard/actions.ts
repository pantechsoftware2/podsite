'use server';

import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { parseRss } from '../../../lib/rss/parseRss';
import { slugify } from '../../../lib/utils/slugify';

export async function syncRssAction(podcastId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    console.error('syncRssAction: No user session found');
    return;
  }

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .select('id, rss_url, owner_id')
    .eq('id', podcastId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (podcastError || !podcast || !podcast.rss_url) {
    console.error('syncRssAction: Podcast not found or unauthorized', podcastError);
    return;
  }

  try {
    const parsed = await parseRss(podcast.rss_url);

    for (const ep of parsed.episodes) {
      if (!ep.guid) continue;

      const slug = slugify(ep.title || ep.guid);

      const { error: upsertError } = await supabase.from('episodes').upsert({
        podcast_id: podcast.id,
        guid: ep.guid,
        slug,
        title: ep.title,
        description: ep.description,
        audio_url: ep.audio_url,
        image_url: ep.episode_image_url,
        published_at: ep.publish_date,
        duration_seconds: ep.duration_seconds,
      }, { onConflict: 'podcast_id,guid' });

      if (upsertError) {
        console.warn(`[Sync] Failed upsert for ${ep.guid}:`, upsertError.message);
      }
    }

    console.log(`[Sync] Completed for ${podcast.id}: ${parsed.episodes.length} items.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('syncRssAction exception:', message);
  }
}
