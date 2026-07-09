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
  buildCollectionJsonLd,
  deriveGuests,
  getPublicBasePath,
  normalizeSeoEpisodes,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type PageProps = {
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ title: string | null; custom_domain?: string | null }>(
    supabase,
    subdomain,
    'title, custom_domain',
  );

  if (!podcast) return { title: 'Guests Not Found' };
  const canonical = await buildCanonicalUrl(podcast, subdomain, 'guests');
  return {
    title: `Guests | ${podcast.title}`,
    description: `Browse featured guests from ${podcast.title}.`,
    alternates: { canonical },
  };
}

export default async function GuestsPage({ params }: PageProps) {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(supabase, subdomain, '*');

  if (!podcast) notFound();

  const { data: episodes } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(200);

  const guests = deriveGuests(normalizeSeoEpisodes(episodes));
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
  const canonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
    'guests',
  );
  const homeCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
  );
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastView.title, url: homeCanonical },
      { name: 'Guests', url: canonical },
    ]),
    buildCollectionJsonLd({
      name: `${podcastView.title} Guests`,
      description: `Featured guests from ${podcastView.title}.`,
      url: canonical,
      itemUrls: guests.map((guest) => `${canonical}/${guest.slug}`),
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastView} themeConfig={themeConfig}>
        <div className="space-y-8">
          <header>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Guests
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter md:text-6xl">
              Everyone who has joined the mic
            </h1>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {guests.map((guest) => (
              <Link
                key={guest.slug}
                href={`${siteBasePath}/guests/${guest.slug}`}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 hover:border-[var(--primary)]"
              >
                <h2 className="text-2xl font-black tracking-tight">{guest.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {guest.episodes.length} episode{guest.episodes.length === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </PublicContentShell>
    </>
  );
}
