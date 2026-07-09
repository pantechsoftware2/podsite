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
  buildTranscriptHtml,
  excerpt,
  getPublicBasePath,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type PageProps = {
  params: Promise<{ subdomain: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; title: string | null; custom_domain?: string | null }>(
    supabase,
    subdomain,
    'id, title, custom_domain',
  );
  if (!podcast) return { title: 'Transcript Not Found' };

  const { data: episode } = await supabase
    .from('episodes')
    .select('title, description, transcript_text')
    .eq('podcast_id', podcast.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!episode) return { title: 'Transcript Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain, `episodes/${slug}/transcript`);
  return {
    title: `${episode.title} Transcript | ${podcast.title}`,
    description: excerpt(episode.transcript_text || episode.description, 160) || `Transcript for ${episode.title}.`,
    alternates: { canonical },
  };
}

export default async function TranscriptPage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(supabase, subdomain, '*');
  if (!podcast) notFound();

  const { data: episode } = await supabase
    .from('episodes')
    .select('slug, title, description, transcript_text, transcript_url, published_at')
    .eq('podcast_id', podcast.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!episode) notFound();

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
    `episodes/${slug}/transcript`,
  );
  const episodeCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
    `episodes/${slug}`,
  );
  const homeCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
  );
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastView.title, url: homeCanonical },
      { name: episode.title || 'Episode', url: episodeCanonical },
      { name: 'Transcript', url: canonical },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastView} themeConfig={themeConfig}>
        <article className="space-y-8">
          <header>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Episode Transcript
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter md:text-6xl">
              {episode.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`${siteBasePath}/episodes/${slug}`} className="rounded-full border border-current px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-primary">
                Back To Episode
              </Link>
              <Link href={`${siteBasePath}/episodes`} className="rounded-full border border-current px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-primary">
                Browse Archive
              </Link>
            </div>
          </header>

          <div
            className="prose prose-invert max-w-none prose-p:text-slate-200 prose-headings:text-white"
            dangerouslySetInnerHTML={{ __html: buildTranscriptHtml(episode.transcript_text || episode.description) }}
          />

          {!episode.transcript_text && episode.transcript_url && (
            <p className="text-sm text-slate-500">
              Full transcript source: <a href={episode.transcript_url} className="underline">original transcript file</a>
            </p>
          )}
        </article>
      </PublicContentShell>
    </>
  );
}
