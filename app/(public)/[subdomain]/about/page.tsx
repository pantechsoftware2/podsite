import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import PublicContentShell from '@/components/public/PublicContentShell';
import JsonLd from '@/components/seo/JsonLd';
import { ThemeConfig } from '@/components/ThemeEngine';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildPodcastSeriesJsonLd,
  excerpt,
  getPublicBasePath,
  inferHostName,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type PageProps = {
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{
    title: string | null;
    description?: string | null;
    custom_domain?: string | null;
  }>(supabase, subdomain, 'title, description, custom_domain');

  if (!podcast) return { title: 'About Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain, 'about');
  return {
    title: `About | ${podcast.title}`,
    description: excerpt(podcast.description, 160) || `Learn more about ${podcast.title}.`,
    alternates: { canonical },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(supabase, subdomain, '*');

  if (!podcast) notFound();

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const siteBasePath = await getPublicBasePath(subdomain, (podcast.custom_domain as string | null) || null);
  const podcastView = {
    id: podcast.id,
    title: (podcast.title as string) ?? 'Podcast',
    description: (podcast.description as string | undefined) || '',
    image: themeConfig.imageUrl,
    tagline: themeConfig.tagline,
    twitterUrl: themeConfig.twitterUrl,
    linkedInUrl: themeConfig.linkedInUrl,
    siteBasePath,
  };
  const hostName = inferHostName(podcast as { id: string; title: string | null; description?: string | null; theme_config?: ThemeConfig | null });
  const canonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
    subdomain,
    'about',
  );
  const homeCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
    subdomain,
  );
  const { data: recentEpisodes } = await supabase
    .from('episodes')
    .select('slug, title, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(6);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastView.title, url: homeCanonical },
      { name: 'About', url: canonical },
    ]),
    buildPodcastSeriesJsonLd({
      podcast: podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
      canonicalUrl: homeCanonical,
      imageUrl: themeConfig.imageUrl,
      hostName,
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastView} themeConfig={themeConfig}>
        <div className="space-y-10">
          <header className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              About The Show
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">
              {hostName ? `${hostName} on ${podcastView.title}` : `Inside ${podcastView.title}`}
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
              {podcastView.description || `${podcastView.title} publishes conversations and ideas worth revisiting.`}
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-2xl font-black uppercase tracking-tight">Brand Snapshot</h2>
              <dl className="space-y-4 text-sm text-slate-300">
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tagline</dt>
                  <dd>{themeConfig.tagline || 'No tagline set yet.'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Primary Theme</dt>
                  <dd>{themeConfig.generatedSections?.[0] || 'Editorial podcast storytelling'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Listen On</dt>
                  <dd className="flex flex-wrap gap-3 pt-2">
                    {themeConfig.spotifyUrl && <a href={themeConfig.spotifyUrl} className="underline">Spotify</a>}
                    {themeConfig.applePodcastsUrl && <a href={themeConfig.applePodcastsUrl} className="underline">Apple Podcasts</a>}
                    {themeConfig.youtubeUrl && <a href={themeConfig.youtubeUrl} className="underline">YouTube</a>}
                    {(themeConfig.spotifyUrl || themeConfig.applePodcastsUrl || themeConfig.youtubeUrl) ? null : 'Links will appear here once connected.'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-2xl font-black uppercase tracking-tight">Explore Next</h2>
              <div className="grid gap-3">
                <Link href={`${siteBasePath}/episodes`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-[var(--primary)]">
                  Browse all episodes
                </Link>
                <Link href={`${siteBasePath}/guests`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-[var(--primary)]">
                  Meet featured guests
                </Link>
                <Link href={`${siteBasePath}/topics`} className="rounded-2xl border border-white/10 px-4 py-3 hover:border-[var(--primary)]">
                  Explore topics and categories
                </Link>
              </div>
            </section>
          </div>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight">Recent Episodes</h2>
            <div className="grid gap-3">
              {(recentEpisodes || []).map((episode) => (
                <Link
                  key={episode.slug}
                  href={`${siteBasePath}/episodes/${episode.slug}`}
                  className="rounded-2xl border border-white/10 px-4 py-3 hover:border-[var(--primary)]"
                >
                  {episode.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </PublicContentShell>
    </>
  );
}
