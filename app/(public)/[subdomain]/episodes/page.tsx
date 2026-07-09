// app/(public)/[subdomain]/episodes/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { Metadata } from 'next';
import { ThemeConfig } from '@/components/ThemeEngine';
import NetflixLayout from '@/components/layouts/NetflixLayout';
import SubstackLayout from '@/components/layouts/SubstackLayout';
import GenZLayout from '@/components/layouts/GenZLayout';
import EpisodesPageWrapper from '@/components/public/EpisodesPageWrapper';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildCollectionJsonLd,
  excerpt,
  getPublicBasePath,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type EpisodesIndexProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: EpisodesIndexProps): Promise<Metadata> {
  const { subdomain } = await params;
  const { q } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{
    title: string | null;
    description: string | null;
    custom_domain?: string | null;
  }>(supabase, subdomain, 'title, description, custom_domain');

  if (!podcast) {
    return { title: 'Episodes Not Found' };
  }

  const canonical = await buildCanonicalUrl(podcast, subdomain, 'episodes');

  return {
    title: q ? `Search episodes for ${podcast.title}` : `Episodes | ${podcast.title}`,
    description: q
      ? `Search results for "${q}" on ${podcast.title}.`
      : excerpt(podcast.description, 160) || `Browse the episode archive for ${podcast.title}.`,
    alternates: {
      canonical,
    },
  };
}

export default async function EpisodesIndex({ params, searchParams }: EpisodesIndexProps) {
  return <EpisodesIndexClient params={params} searchParams={searchParams} />;
}

async function EpisodesIndexClient({ params, searchParams }: EpisodesIndexProps) {
  const { subdomain } = await params;
  const { q } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subdomain);

  // Debug log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Episodes page - Looking for podcast with subdomain:', subdomain, 'isUuid:', isUuid);
  }

  let podcast: { id: string; [k: string]: unknown } | null = null;
  let podcastError: unknown = null;
  
  if (isUuid) {
    // First try by ID (UUID)
    const byId = await supabase.from('podcasts').select('*').eq('id', subdomain).maybeSingle();
    if (process.env.NODE_ENV === 'development') {
      console.log('Episodes page - Query by ID result:', byId);
    }
    podcast = byId.data;
    podcastError = byId.error;
    
    // Fallback to custom_domain
    if (!podcast) {
      const byDomain = await supabase.from('podcasts').select('*').eq('custom_domain', subdomain).maybeSingle();
      if (process.env.NODE_ENV === 'development') {
        console.log('Episodes page - Query by custom_domain result:', byDomain);
      }
      podcast = byDomain.data;
      podcastError = byDomain.error;
    }
  } else {
    // Try by custom_domain first
    const byDomain = await supabase.from('podcasts').select('*').eq('custom_domain', subdomain).maybeSingle();
    if (process.env.NODE_ENV === 'development') {
      console.log('Episodes page - Query by custom_domain:', byDomain);
    }
    podcast = byDomain.data;
    podcastError = byDomain.error;
    
    // Fallback to ID
    if (!podcast) {
      const byId = await supabase.from('podcasts').select('*').eq('id', subdomain).maybeSingle();
      if (process.env.NODE_ENV === 'development') {
        console.log('Episodes page - Fallback query by ID:', byId);
      }
      podcast = byId.data;
      podcastError = byId.error;
    }
  }

  if (podcastError) {
    console.error('Episodes page - Podcast query error:', podcastError);
  }

  if (podcastError || !podcast) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Podcast not found.</p>
      </main>
    );
  }

  let query = supabase
    .from('episodes')
    .select('id, slug, title, published_at, image_url, description, audio_url')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: episodes, error: episodesError } = await query;

  if (episodesError) {
    console.error('episodes index error', episodesError);
  }

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const siteBasePath = await getPublicBasePath(subdomain, (podcast.custom_domain as string | null) || null);
  const podcastWithImage = {
    id: podcast.id,
    title: (podcast.title as string) ?? '',
    tagline: (podcast.tagline as string | undefined),
    description: (podcast.description as string | undefined),
    image: themeConfig.imageUrl,
    siteBasePath,
  };
  const layout = themeConfig.layout || 'netflix';

  const LayoutComponent =
    layout === 'substack' ? SubstackLayout :
      layout === 'genz' ? GenZLayout :
        NetflixLayout;

  const canonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
    'episodes',
  );
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastWithImage.title, url: await buildCanonicalUrl(podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null }, subdomain) },
      { name: 'Episodes', url: canonical },
    ]),
    buildCollectionJsonLd({
      name: `${podcastWithImage.title} Episodes`,
      description: `Episode archive for ${podcastWithImage.title}.`,
      url: canonical,
      itemUrls: (episodes || []).map((episode) => `${canonical.replace(/\/episodes$/, '')}/episodes/${episode.slug}`),
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <EpisodesPageWrapper 
        podcast={podcastWithImage}
        themeConfig={themeConfig}
        layoutComponent={LayoutComponent}
        episodes={episodes || []}
        subdomain={subdomain}
        q={q}
      />
    </>
  );
}
