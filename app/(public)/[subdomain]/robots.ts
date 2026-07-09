import { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { buildCanonicalUrl, resolvePodcastBySubdomain } from '@/lib/publicSite';

export default async function robots({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Robots> {
  const { subdomain } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast } = await resolvePodcastBySubdomain<{ title: string | null; custom_domain?: string | null }>(
    supabase,
    subdomain,
    'title, custom_domain',
  );

  if (!podcast) {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: await buildCanonicalUrl(podcast, subdomain, 'sitemap.xml'),
  };
}
