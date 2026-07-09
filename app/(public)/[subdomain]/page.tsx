import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Metadata } from 'next';
import { ThemeConfig } from '@/components/ThemeEngine';
import HeroBlock from '@/components/blocks/HeroBlock';
import GridBlock from '@/components/blocks/GridBlock';
import SubscribeBlock from '@/components/blocks/SubscribeBlock';
import HostBlock from '@/components/blocks/HostBlock';
import ShortsBlock from '@/components/blocks/ShortsBlock';
import DigitalProductBlock from '@/components/blocks/DigitalProductBlock';
import PodcastPageWrapper from '@/components/public/PodcastPageWrapper';
import SeoDiscoveryBlock from '@/components/public/SeoDiscoveryBlock';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildPodcastSeriesJsonLd,
  buildProductJsonLd,
  deriveGuests,
  deriveTopics,
  excerpt,
  getPublicBasePath,
  getWebsiteSeoSettings,
  inferHostName,
  normalizeSeoEpisodes,
  resolvePodcastBySubdomain,
  robotsFromDirectives,
} from '@/lib/publicSite';

const PAGE_SIZE = 20;

// NOTE: params & searchParams are Promises here
type PageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ page?: string; q?: string; edit?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast, error: podcastError } = await resolvePodcastBySubdomain<{
    title: string | null;
    description: string | null;
    custom_domain?: string | null;
    rss_url?: string | null;
    theme_config?: ThemeConfig | null;
  }>(supabase, subdomain, 'title, description, custom_domain, rss_url, theme_config');
  
  if (podcastError) {
    console.error('generateMetadata - Podcast query error:', podcastError);
  }
  
  if (!podcast) return { title: 'Podcast Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain);
  const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
  const seo = getWebsiteSeoSettings(podcast);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app';
  const ogUrl = new URL(`${baseUrl}/api/og/${subdomain}`);

  return {
    title: seo.siteTitle || podcast.title || 'Podcast',
    description: seo.siteDescription || excerpt(podcast.description, 160),
    keywords: seo.keywords,
    robots: robotsFromDirectives(seo.robotsDirectives),
    alternates: {
      canonical,
    },
    openGraph: {
      title: seo.siteTitle || podcast.title || 'Podcast',
      description: seo.siteDescription || excerpt(podcast.description, 160),
      url: canonical,
      images: [themeConfig.imageUrl || ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.siteTitle || podcast.title || 'Podcast',
      description: seo.siteDescription || excerpt(podcast.description, 160),
      images: [themeConfig.imageUrl || ogUrl.toString()],
    },
  };
}

export default async function PodcastHome({ params, searchParams }: PageProps) {
  return <PodcastHomeClient params={params} searchParams={searchParams} />;
}

async function PodcastHomeClient({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { page: pageParam, q: qParam, edit: editParam } = await searchParams;
  const q = qParam?.trim();
  const editMode = editParam === 'true';

  const page = Number(pageParam ?? '1') || 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();

  const { podcast: resolvedPodcast, error: podcastError } = await resolvePodcastBySubdomain<{ id: string; [k: string]: unknown }>(
    supabase,
    subdomain,
    '*',
  );
  const podcast = resolvedPodcast;

  // Separate query for products and shorts to avoid join failures
  let products: Array<{
    id: string;
    title: string;
    description?: string | null;
    price?: number | string | null;
    podcast_id: string;
  }> = [];
  let shorts: Array<Record<string, unknown>> = [];
  if (podcast) {
    const { data: productsData } = await supabase.from('products').select('*').eq('podcast_id', podcast.id);
    products = productsData || [];

    const { data: shortsData } = await supabase.from('shorts').select('*').eq('podcast_id', podcast.id).order('published_at', { ascending: false }).limit(10);
    shorts = shortsData || [];

    // If no shorts found but we have a channel ID, try a one-time fetch and sync
    if (shorts.length === 0 && podcast.youtube_channel_id) {
       try {
         const { fetchShorts } = await import('@/lib/youtube/shorts');
         const fetchedShorts = await fetchShorts(podcast.youtube_channel_id as string);
         if (fetchedShorts.length > 0) {
            // Background sync (not blocking for this request would be better, but for "functioning well" on first load we can do a quick insert)
            const shortsToSave = fetchedShorts.map((short: {
              youtube_video_id: string;
              title: string;
              thumbnail?: string | null;
              published_at?: string | null;
              duration?: string | null;
            }) => ({ ...short, podcast_id: podcast!.id }));
            const { data: savedShorts } = await supabase.from('shorts').insert(shortsToSave).select();
            shorts = savedShorts || fetchedShorts;
         }
       } catch (e) {
         console.warn('Failed to auto-sync shorts on first load:', e);
       }
    }
  }

  if (podcastError || !podcast) {
    console.error('Podcast query error:', {
      subdomain,
      error: podcastError,
      found: !!podcast,
    });
  }

  if (podcastError || !podcast) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans selection:bg-primary/30">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-2xl rounded-full opacity-50 animate-pulse" />
            <h1 className="relative text-7xl font-black text-white tracking-tighter">404</h1>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Podcast not found</h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              We couldn&apos;t find a podcast associated with:
              <code className="block bg-white/5 px-3 py-2 rounded text-primary border border-white/10 mt-3 break-all font-mono text-xs">{String(subdomain)}</code>
            </p>
            <p className="text-slate-500 text-xs mt-4">
              This could be because the podcast hasn&apos;t been created yet, or the incorrect URL was used. Check that you&apos;ve imported the podcast in your dashboard first.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-4">
            <a
              href="https://podsitekiller.com"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Create Your Own
            </a>
            <Link href="/login" className="text-slate-400 hover:text-slate-300 text-sm transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let episodesQuery = supabase
    .from('episodes')
    .select('id, title, slug, published_at, image_url, youtube_video_id, description, video_sync_status')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false });

  if (q) {
    episodesQuery = episodesQuery.ilike('title', `%${q}%`);
  }

  const { data: episodes, error: episodesError } = await episodesQuery.range(from, to);

  if (episodesError) {
    console.error('episodesError', episodesError);
  }

  // Filter out pending/rejected youtube videos
  const safeEpisodes: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    image_url: string | null;
    youtube_video_id: string | null;
    description?: string | null;
    video_sync_status?: string | null;
  }> = (episodes || []).map((ep) => ({
    ...ep,
    youtube_video_id: (ep.video_sync_status === 'pending' || ep.video_sync_status === 'rejected' || !ep.youtube_video_id) ? null : ep.youtube_video_id
  }));

  const finalEpisodes = safeEpisodes;

  const latest = page === 1 ? finalEpisodes?.[0] : undefined;
  const { data: seoEpisodesData } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(120);

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const siteBasePath = await getPublicBasePath(subdomain, (podcast.custom_domain as string | null) || null);
  const seoEpisodes = normalizeSeoEpisodes(seoEpisodesData);
  const guests = deriveGuests(seoEpisodes);
  const topics = deriveTopics(seoEpisodes, themeConfig);
  const podcastWithImage = {
    ...podcast,
    image: themeConfig.imageUrl,
    latest_video_id: latest?.youtube_video_id,
    title: podcast.title as string,
    siteBasePath,
  };
  const defaultLayout = ['hero', 'subscribe', 'product', 'grid', 'host', 'shorts'];
  const rawLayout = (podcast.page_layout as string[]) || defaultLayout;
  const hiddenBlocks = themeConfig.hiddenBlocks || [];

  // Filter out hidden blocks
  const pageLayout = rawLayout.filter(block => !hiddenBlocks.includes(block));

  // Auto-inject product block if products exist but it's not in layout
  if (products.length > 0 && !pageLayout.includes('product') && !hiddenBlocks.includes('product')) {
    const subscribeIndex = pageLayout.indexOf('subscribe');
    if (subscribeIndex !== -1) {
      pageLayout.splice(subscribeIndex + 1, 0, 'product');
    } else {
      pageLayout.push('product');
    }
  }
  if (!pageLayout.includes('seo')) {
    pageLayout.push('seo');
  }

  // Create a properly typed podcast object for the Layout
  const layoutPodcast = {
    ...podcastWithImage,
    title: podcastWithImage.title,
    tagline: themeConfig.tagline,
    latest_video_id: latest?.youtube_video_id,
    generatedPages: themeConfig.generatedPages || [],
  };
  const canonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
    subdomain,
  );
  const hostName = inferHostName(podcast as { id: string; title: string | null; description?: string | null; theme_config?: ThemeConfig | null });
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastWithImage.title, url: canonical },
    ]),
    buildPodcastSeriesJsonLd({
      podcast: podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
      canonicalUrl: canonical,
      imageUrl: themeConfig.imageUrl,
      hostName,
      episodes: seoEpisodes.slice(0, 20).map((episode) => ({
        ...episode,
        slug: `${canonical.replace(/\/$/, '')}/episodes/${episode.slug}`,
      })),
    }),
    ...(products[0]
      ? [buildProductJsonLd({
          name: products[0].title,
          description: products[0].description,
          price: typeof products[0].price === 'number' ? products[0].price : Number(products[0].price),
          url: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app').replace(/\/$/, '')}/checkout/${products[0].id}`,
        })]
      : []),
  ];

    // Create dictionary of blocks for LiveLayoutController
    const blockDict: Record<string, React.ReactNode> = {
        hero: <HeroBlock podcast={podcastWithImage} latestEpisode={latest} />,
        shorts: <ShortsBlock shorts={shorts} podcast={podcastWithImage} />,
        grid: (
            <div className="space-y-12">
                <GridBlock podcast={podcastWithImage} episodes={finalEpisodes || []} />
                {finalEpisodes.length >= PAGE_SIZE && (
                    <div className="flex justify-center pb-20">
                        <Link
                            href={`/${subdomain}/episodes`}
                            className="group relative inline-flex items-center gap-4 rounded-full border-4 border-current px-12 py-5 text-xl font-black uppercase italic tracking-tighter transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95"
                        >
                            <span>Browse All Episodes</span>
                            <span className="transition-transform group-hover:translate-x-2">→</span>
                        </Link>
                    </div>
                )}
            </div>
        ),
        episodes: <GridBlock podcast={podcastWithImage} episodes={finalEpisodes || []} />,
        subscribe: <SubscribeBlock podcast={podcastWithImage} />,
        product: products[0] ? <DigitalProductBlock product={products[0]} /> : null,
        host: <HostBlock podcast={podcastWithImage} />,
        seo: (
          <SeoDiscoveryBlock
            podcastTitle={podcastWithImage.title}
            siteBasePath={siteBasePath}
            guests={guests}
            topics={topics}
            transcriptEpisodes={seoEpisodes}
          />
        ),
    };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PodcastPageWrapper
        podcast={layoutPodcast}
        themeConfig={themeConfig}
        pageLayout={pageLayout}
        blockDict={blockDict}
        editMode={editMode}
      />
    </>
  );
}
