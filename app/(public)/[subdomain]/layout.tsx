import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildCanonicalUrl,
  buildWebsiteSeoJsonLd,
  getWebsiteSeoSettings,
  resolvePodcastBySubdomain,
  robotsFromDirectives,
} from '@/lib/publicSite';
import type { ThemeConfig } from '@/components/ThemeEngine';

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata({ params }: PublicLayoutProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{
    title: string | null;
    description: string | null;
    custom_domain?: string | null;
    rss_url?: string | null;
    theme_config?: ThemeConfig | null;
  }>(supabase, subdomain, 'title, description, custom_domain, rss_url, theme_config');

  if (!podcast) return {};

  const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
  const seo = getWebsiteSeoSettings(podcast);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app';
  const ogUrl = new URL(`${baseUrl}/api/og/${subdomain}`);

  return {
    title: seo.siteTitle,
    description: seo.siteDescription,
    keywords: seo.keywords,
    robots: robotsFromDirectives(seo.robotsDirectives),
    openGraph: {
      title: seo.siteTitle,
      description: seo.siteDescription,
      siteName: seo.structuredData.name,
      images: [themeConfig.imageUrl || ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.siteTitle,
      description: seo.siteDescription,
      images: [themeConfig.imageUrl || ogUrl.toString()],
    },
  };
}

export default async function PublicPodcastLayout({ children, params }: PublicLayoutProps) {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{
    title: string | null;
    description: string | null;
    custom_domain?: string | null;
    rss_url?: string | null;
    theme_config?: ThemeConfig | null;
  }>(supabase, subdomain, 'title, description, custom_domain, rss_url, theme_config');

  if (!podcast) return children;

  const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
  const canonical = await buildCanonicalUrl(podcast, subdomain);
  const seo = getWebsiteSeoSettings(podcast);

  return (
    <>
      <JsonLd
        data={buildWebsiteSeoJsonLd({
          seo,
          canonicalUrl: canonical,
          imageUrl: themeConfig.imageUrl,
        })}
      />
      {children}
    </>
  );
}
