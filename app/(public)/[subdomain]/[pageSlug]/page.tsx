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
  excerpt,
  getPublicBasePath,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type PageProps = {
  params: Promise<{ subdomain: string; pageSlug: string }>;
};

function findGeneratedPage(themeConfig: ThemeConfig, pageSlug: string) {
  return themeConfig.generatedPages?.find((page) => page.slug === pageSlug) || null;
}

function resolveGeneratedHref(siteBasePath: string, href: string) {
  if (/^https?:\/\//i.test(href)) return href;
  return `${siteBasePath}${href.startsWith('/') ? href : `/${href}`}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, pageSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{
    id: string;
    title: string | null;
    description?: string | null;
    custom_domain?: string | null;
    theme_config?: ThemeConfig | null;
  }>(supabase, subdomain, 'id, title, description, custom_domain, theme_config');

  if (!podcast) return { title: 'Page Not Found' };

  const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
  const generatedPage = findGeneratedPage(themeConfig, pageSlug);
  if (!generatedPage) return { title: 'Page Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain, pageSlug);
  return {
    title: generatedPage.seoTitle || `${generatedPage.title} | ${podcast.title}`,
    description: generatedPage.seoDescription || excerpt(generatedPage.intent || podcast.description, 160),
    alternates: { canonical },
    openGraph: {
      title: generatedPage.title,
      description: generatedPage.seoDescription || excerpt(generatedPage.intent || podcast.description, 160),
      url: canonical,
      images: themeConfig.imageUrl ? [themeConfig.imageUrl] : undefined,
    },
  };
}

export default async function GeneratedPodcastPage({ params }: PageProps) {
  const { subdomain, pageSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ id: string; [key: string]: unknown }>(
    supabase,
    subdomain,
    '*',
  );

  if (!podcast) notFound();

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const generatedPage = findGeneratedPage(themeConfig, pageSlug);
  if (!generatedPage) notFound();

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
    pageSlug,
  );
  const homeCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
  );
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastView.title, url: homeCanonical },
      { name: generatedPage.title, url: canonical },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: generatedPage.title,
      description: generatedPage.seoDescription || excerpt(generatedPage.intent, 180),
      url: canonical,
      isPartOf: {
        '@type': 'PodcastSeries',
        name: podcastView.title,
        url: homeCanonical,
      },
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastView} themeConfig={themeConfig}>
        <article className="space-y-12">
          <header className="max-w-4xl space-y-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              {generatedPage.navLabel}
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">
              {generatedPage.title}
            </h1>
            {generatedPage.intent && (
              <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
                {generatedPage.intent}
              </p>
            )}
          </header>

          <div className="grid gap-5">
            {generatedPage.sections.map((section) => (
              <section key={section.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-black uppercase tracking-tight">{section.title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">{section.body}</p>
                {section.ctaLabel && section.ctaHref && (
                  <Link
                    href={resolveGeneratedHref(siteBasePath, section.ctaHref)}
                    className="mt-6 inline-flex rounded-full border border-current px-5 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-[var(--primary)]"
                  >
                    {section.ctaLabel}
                  </Link>
                )}
              </section>
            ))}
          </div>
        </article>
      </PublicContentShell>
    </>
  );
}
