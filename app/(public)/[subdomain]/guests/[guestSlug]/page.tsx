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
  params: Promise<{ subdomain: string; guestSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, guestSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; title: string | null; custom_domain?: string | null }>(
    supabase,
    subdomain,
    'id, title, custom_domain',
  );
  if (!podcast) return { title: 'Guest Not Found' };

  const { data: episodes } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(200);
  const guest = deriveGuests(normalizeSeoEpisodes(episodes))
    .find((item) => item.slug === guestSlug);
  if (!guest) return { title: 'Guest Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain, `guests/${guestSlug}`);
  return {
    title: `${guest.name} | ${podcast.title}`,
    description: `Episodes featuring ${guest.name} on ${podcast.title}.`,
    alternates: { canonical },
  };
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { subdomain, guestSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(supabase, subdomain, '*');

  if (!podcast) notFound();

  const { data: episodes } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(200);
  const guest = deriveGuests(normalizeSeoEpisodes(episodes))
    .find((item) => item.slug === guestSlug);

  if (!guest) notFound();

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
    `guests/${guestSlug}`,
  );
  const guestsCanonical = await buildCanonicalUrl(
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
      { name: 'Guests', url: guestsCanonical },
      { name: guest.name, url: canonical },
    ]),
    buildCollectionJsonLd({
      name: `${guest.name} on ${podcastView.title}`,
      description: `Episodes featuring ${guest.name}.`,
      url: canonical,
      itemUrls: guest.episodes.map((episode) => `${homeCanonical.replace(/\/$/, '')}/episodes/${episode.slug}`),
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastView} themeConfig={themeConfig}>
        <div className="space-y-8">
          <header>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Guest Archive
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter md:text-6xl">
              {guest.name}
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Every episode featuring {guest.name} on {podcastView.title}.
            </p>
          </header>

          <div className="grid gap-4">
            {guest.episodes.map((episode) => (
              <Link
                key={episode.slug}
                href={`${siteBasePath}/episodes/${episode.slug}`}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 hover:border-[var(--primary)]"
              >
                <h2 className="text-2xl font-black tracking-tight">{episode.title}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {episode.published_at ? new Date(episode.published_at).toLocaleDateString() : 'Episode'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </PublicContentShell>
    </>
  );
}
