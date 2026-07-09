import { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import {
  buildCanonicalUrl,
  deriveGuests,
  deriveTopics,
  normalizeSeoEpisodes,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';
import { ThemeConfig } from '@/components/ThemeEngine';

export default async function sitemap({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(supabase, subdomain, '*');

  if (!podcast) {
    return [];
  }

  const { data: episodes } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(500);

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const episodeRows = normalizeSeoEpisodes(episodes);
  const guests = deriveGuests(episodeRows);
  const topics = deriveTopics(episodeRows, themeConfig);
  const generatedPages = themeConfig.generatedPages || [];
  const latestDate = episodeRows[0]?.published_at ? new Date(episodeRows[0].published_at) : new Date();
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain),
      lastModified: latestDate,
    },
    {
      url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain, 'about'),
      lastModified: latestDate,
    },
    {
      url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain, 'episodes'),
      lastModified: latestDate,
    },
    {
      url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain, 'guests'),
      lastModified: latestDate,
    },
    {
      url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain, 'topics'),
      lastModified: latestDate,
    },
  ];

  const episodeEntries: MetadataRoute.Sitemap = [];
  for (const episode of episodeRows) {
    episodeEntries.push({
      url: await buildCanonicalUrl(
        podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
        subdomain,
        `episodes/${episode.slug}`,
      ),
      lastModified: episode.published_at ? new Date(episode.published_at) : latestDate,
    });
    episodeEntries.push({
      url: await buildCanonicalUrl(
        podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
        subdomain,
        `episodes/${episode.slug}/transcript`,
      ),
      lastModified: episode.published_at ? new Date(episode.published_at) : latestDate,
    });
  }

  const guestEntries: MetadataRoute.Sitemap = [];
  for (const guest of guests) {
    guestEntries.push({
      url: await buildCanonicalUrl(
        podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
        subdomain,
        `guests/${guest.slug}`,
      ),
      lastModified: latestDate,
    });
  }

  const topicEntries: MetadataRoute.Sitemap = [];
  for (const topic of topics) {
    topicEntries.push({
      url: await buildCanonicalUrl(
        podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
        subdomain,
        `topics/${topic.slug}`,
      ),
      lastModified: latestDate,
    });
  }

  const generatedPageEntries: MetadataRoute.Sitemap = [];
  for (const generatedPage of generatedPages) {
    generatedPageEntries.push({
      url: await buildCanonicalUrl(
        podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
        subdomain,
        generatedPage.slug,
      ),
      lastModified: latestDate,
    });
  }

  return [...baseEntries, ...generatedPageEntries, ...episodeEntries, ...guestEntries, ...topicEntries];
}
