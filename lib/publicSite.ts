import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/utils/slugify';

export type PublicThemeConfig = {
  imageUrl?: string;
  tagline?: string;
  layout?: 'netflix' | 'substack' | 'genz' | 'minimal';
  generatedSections?: string[];
  blueprintArchetype?: string;
  generatedPages?: Array<{
    slug: string;
    title: string;
    navLabel: string;
    intent?: string;
    seoTitle?: string;
    seoDescription?: string;
    sections: Array<{
      title: string;
      body: string;
      ctaLabel?: string;
      ctaHref?: string;
    }>;
  }>;
  applePodcastsUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
  rssUrlOverride?: string;
  websiteSeo?: WebsiteSeoSettings;
};

export type WebsiteSeoSettings = {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  ogImage: string;
  robotsDirectives: string;
  structuredData: {
    '@type': 'PodcastSeries';
    name: string;
    description: string;
    webFeed?: string;
    author?: { '@type': 'Person'; name: string };
  };
  generatedAt?: string;
  model?: string;
};

export type PublicPodcastRecord = {
  id?: string;
  title?: string | null;
  description?: string | null;
  custom_domain?: string | null;
  rss_url?: string | null;
  theme_config?: PublicThemeConfig | null;
  page_layout?: string[] | null;
  youtube_channel_id?: string | null;
  stripe_account_id?: string | null;
  [key: string]: unknown;
};

export type PublicEpisodeRecord = {
  id?: string;
  slug: string;
  title: string | null;
  description?: string | null;
  published_at?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  youtube_video_id?: string | null;
  duration_seconds?: number | null;
  [key: string]: unknown;
};

export type DerivedGuest = {
  slug: string;
  name: string;
  episodes: PublicEpisodeRecord[];
};

export type DerivedTopic = {
  slug: string;
  name: string;
  episodes: PublicEpisodeRecord[];
};

const APP_DOMAIN_FALLBACK = 'podsite-killer.vercel.app';
const MAIN_APP_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  'app.podsitekiller.com',
  'makemypodcastsite.com',
  'www.makemypodcastsite.com',
]);

const TOPIC_STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'along',
  'also',
  'because',
  'before',
  'between',
  'build',
  'could',
  'every',
  'first',
  'from',
  'have',
  'here',
  'into',
  'just',
  'more',
  'most',
  'next',
  'only',
  'over',
  'podcast',
  'podcasts',
  'show',
  'their',
  'there',
  'these',
  'they',
  'this',
  'with',
  'what',
  'when',
  'where',
  'your',
  'episode',
  'episodes',
  'host',
  'hosts',
  'guest',
  'guests',
  'ready',
  'set',
  'do',
]);

function normalizeHost(host: string | null) {
  return (host || '').replace(/^www\./i, '').split(':')[0];
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function stripHtml(input: string | null | undefined) {
  return (input || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(input: string | null | undefined, maxLength = 160) {
  const plain = stripHtml(input);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function clampText(input: unknown, maxLength: number, fallback = '') {
  const clean = stripHtml(typeof input === 'string' ? input : fallback);
  return clean.length > maxLength ? clean.slice(0, maxLength).trimEnd() : clean;
}

function sanitizeKeywordList(input: unknown, fallback: string[] = []) {
  const raw = Array.isArray(input) ? input : fallback;
  return Array.from(
    new Set(
      raw
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => clampText(item, 48).toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export function sanitizeWebsiteSeoSettings(
  input: unknown,
  fallback: {
    title: string;
    description: string;
    rssUrl?: string | null;
    hostName?: string | null;
  },
): WebsiteSeoSettings {
  const parsed = Boolean(input && typeof input === 'object') ? input as Record<string, unknown> : {};
  const structuredData = Boolean(parsed.structuredData && typeof parsed.structuredData === 'object')
    ? parsed.structuredData as Record<string, unknown>
    : {};
  const author = Boolean(structuredData.author && typeof structuredData.author === 'object')
    ? structuredData.author as Record<string, unknown>
    : {};
  const fallbackDescription = excerpt(fallback.description, 155) || `Listen to ${fallback.title}.`;

  return {
    siteTitle: clampText(parsed.siteTitle, 60, fallback.title || 'Podcast'),
    siteDescription: clampText(parsed.siteDescription, 155, fallbackDescription),
    keywords: sanitizeKeywordList(parsed.keywords, [fallback.title, 'podcast', 'episodes']),
    ogImage: clampText(parsed.ogImage, 300, `Podcast artwork for ${fallback.title}`),
    robotsDirectives: clampText(parsed.robotsDirectives, 40, 'index, follow') || 'index, follow',
    structuredData: {
      '@type': 'PodcastSeries',
      name: clampText(structuredData.name, 90, fallback.title || 'Podcast'),
      description: clampText(structuredData.description, 220, fallback.description || fallbackDescription),
      webFeed: clampText(structuredData.webFeed, 500, fallback.rssUrl || '') || undefined,
      author: {
        '@type': 'Person',
        name: clampText(author.name, 80, fallback.hostName || fallback.title || 'Podcast host'),
      },
    },
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : undefined,
    model: typeof parsed.model === 'string' ? parsed.model : undefined,
  };
}

export function getWebsiteSeoSettings(podcast: PublicPodcastRecord) {
  const themeConfig = (podcast.theme_config || {}) as PublicThemeConfig;
  const rssUrl = themeConfig.rssUrlOverride || podcast.rss_url || null;
  return sanitizeWebsiteSeoSettings(themeConfig.websiteSeo, {
    title: podcast.title || 'Podcast',
    description: podcast.description || '',
    rssUrl,
    hostName: inferHostName(podcast),
  });
}

export function robotsFromDirectives(directives: string) {
  const normalized = directives.toLowerCase();
  return {
    index: !normalized.includes('noindex'),
    follow: !normalized.includes('nofollow'),
  };
}

export function toSchemaDateTime(input: string | null | undefined) {
  if (!input) return undefined;

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

export function toSchemaDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return undefined;

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [
    'PT',
    hours ? `${hours}H` : '',
    minutes ? `${minutes}M` : '',
    remainingSeconds || (!hours && !minutes) ? `${remainingSeconds}S` : '',
  ].join('');
}

export function normalizeYouTubeVideoId(input: string | null | undefined) {
  const raw = (input || '').trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const candidate = url.pathname.split('/').filter(Boolean)[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate || '') ? candidate : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const watchId = url.searchParams.get('v');
      if (/^[a-zA-Z0-9_-]{11}$/.test(watchId || '')) return watchId;

      const parts = url.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
      const candidate = markerIndex >= 0 ? parts[markerIndex + 1] : null;
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate || '') ? candidate : null;
    }
  } catch {
    return null;
  }

  return null;
}

function splitPeople(raw: string) {
  return raw
    .replace(/\([^)]*\)/g, ' ')
    .split(/,|&| and /i)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => {
      const words = part.split(' ').filter(Boolean);
      return words.length >= 1 && words.length <= 5 && /[a-z]/i.test(part);
    })
    .slice(0, 3);
}

function titleCase(input: string) {
  return input
    .split(' ')
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ');
}

function maybeName(input: string) {
  const cleaned = input
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;
  if (cleaned.length > 60) return null;
  if (/podcast|episode|show|career|immigration|startup|guide|lessons/i.test(cleaned)) return null;

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 5) return null;

  return titleCase(cleaned);
}

export function inferHostName(podcast: PublicPodcastRecord) {
  const themeConfig = (podcast.theme_config || {}) as PublicThemeConfig;
  const haystack = `${podcast.title || ''} ${podcast.description || ''} ${themeConfig.tagline || ''}`;
  const patterns = [
    /hosted by ([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/i,
    /with ([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/i,
    /by ([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/i,
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    const name = maybeName(match?.[1] || '');
    if (name) return name;
  }

  return null;
}

export function deriveGuests(episodes: PublicEpisodeRecord[]) {
  const guestMap = new Map<string, DerivedGuest>();
  const patterns = [
    /(?:w\/|with|feat\.?|featuring)\s+([^|–—:-]+)/i,
    /guest[:\s]+([^|–—:-]+)/i,
  ];

  for (const episode of episodes) {
    const haystack = `${episode.title || ''} ${stripHtml(episode.description)}`;

    for (const pattern of patterns) {
      const match = haystack.match(pattern);
      if (!match?.[1]) continue;

      for (const candidate of splitPeople(match[1])) {
        const name = maybeName(candidate);
        if (!name) continue;

        const slug = slugify(name);
        const existing = guestMap.get(slug);
        if (existing) {
          existing.episodes.push(episode);
        } else {
          guestMap.set(slug, { slug, name, episodes: [episode] });
        }
      }
    }
  }

  return Array.from(guestMap.values())
    .filter((guest) => guest.episodes.length > 0)
    .sort((a, b) => b.episodes.length - a.episodes.length || a.name.localeCompare(b.name));
}

function tokenizeTopicWords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => {
      if (!word) return false;
      if (TOPIC_STOP_WORDS.has(word)) return false;
      if (word.length < 3 && word !== 'ai' && word !== 'ux' && word !== 'pm') return false;
      if (/^\d+$/.test(word)) return false;
      return true;
    });
}

function seedTopicsFromTheme(themeConfig: PublicThemeConfig | null | undefined) {
  return (themeConfig?.generatedSections || [])
    .map((section) => section.replace(/^browse by /i, '').trim())
    .filter((section) => section && section.length <= 40)
    .slice(0, 6);
}

export function deriveTopics(
  episodes: PublicEpisodeRecord[],
  themeConfig?: PublicThemeConfig | null,
) {
  const frequency = new Map<string, { label: string; count: number }>();

  for (const seed of seedTopicsFromTheme(themeConfig)) {
    const slug = slugify(seed);
    frequency.set(slug, { label: seed, count: 2 });
  }

  for (const episode of episodes) {
    const tokens = [
      ...tokenizeTopicWords(episode.title || ''),
      ...tokenizeTopicWords(episode.title || ''),
      ...tokenizeTopicWords(stripHtml(episode.description)),
    ];

    for (const token of tokens) {
      const slug = slugify(token);
      const current = frequency.get(slug);
      frequency.set(slug, {
        label: token.toUpperCase() === token ? token : titleCase(token),
        count: (current?.count || 0) + 1,
      });
    }
  }

  const candidateTopics = Array.from(frequency.entries())
    .filter(([, value]) => value.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12);

  const topics: DerivedTopic[] = [];

  for (const [slug, value] of candidateTopics) {
    const episodesForTopic = episodes.filter((episode) => {
      const haystack = `${episode.title || ''} ${stripHtml(episode.description)}`.toLowerCase();
      return haystack.includes(value.label.toLowerCase()) || haystack.includes(slug.replace(/-/g, ' '));
    });

    if (episodesForTopic.length === 0) continue;
    topics.push({
      slug,
      name: value.label,
      episodes: episodesForTopic,
    });
  }

  return topics.sort((a, b) => b.episodes.length - a.episodes.length || a.name.localeCompare(b.name));
}

export function buildTranscriptHtml(description: string | null | undefined) {
  const source = description?.trim();
  if (!source) {
    return '<p>Transcript coming soon.</p>';
  }

  if (/<(p|ul|ol|blockquote|h2|h3|table|pre|br)\b/i.test(source)) {
    return source;
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export async function resolvePodcastBySubdomain<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  subdomain: string,
  columns = '*',
) {
  let podcast: T | null = null;
  let error: unknown = null;

  if (isUuid(subdomain)) {
    const byId = await supabase.from('podcasts').select(columns).eq('id', subdomain).maybeSingle();
    podcast = (byId.data as T | null) || null;
    error = byId.error;

    if (!podcast) {
      const byDomain = await supabase.from('podcasts').select(columns).eq('custom_domain', subdomain).maybeSingle();
      podcast = (byDomain.data as T | null) || null;
      error = byDomain.error;
    }
  } else {
    const byDomain = await supabase.from('podcasts').select(columns).eq('custom_domain', subdomain).maybeSingle();
    podcast = (byDomain.data as T | null) || null;
    error = byDomain.error;

    if (!podcast) {
      const byId = await supabase.from('podcasts').select(columns).eq('id', subdomain).maybeSingle();
      podcast = (byId.data as T | null) || null;
      error = byId.error;
    }
  }

  return { podcast, error };
}

export function sortEpisodesDescending<T extends PublicEpisodeRecord>(episodes: T[]) {
  return [...episodes].sort((a, b) => {
    const aValue = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bValue = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bValue - aValue;
  });
}

export function normalizeSeoEpisodes(
  rows: Array<{
    slug?: unknown;
    title?: unknown;
    description?: unknown;
    published_at?: unknown;
  }> | null | undefined,
): PublicEpisodeRecord[] {
  return (rows || [])
    .filter((row) => typeof row?.slug === 'string' && row.slug.length > 0)
    .map((row) => ({
      slug: row.slug as string,
      title: typeof row.title === 'string' ? row.title : null,
      description: typeof row.description === 'string' ? row.description : null,
      published_at: typeof row.published_at === 'string' ? row.published_at : null,
    }));
}

function isMainAppHost(host: string) {
  const normalized = normalizeHost(host);
  return MAIN_APP_HOSTS.has(normalized) || normalized === normalizeHost(process.env.NEXT_PUBLIC_APP_DOMAIN || null) || normalized.endsWith('.vercel.app');
}

export async function getPublicBasePath(subdomain: string, customDomain?: string | null) {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const normalizedHost = normalizeHost(host);

  if (customDomain && normalizedHost === normalizeHost(customDomain)) {
    return '';
  }

  if (host && !isMainAppHost(host)) {
    return '';
  }

  return `/${subdomain}`;
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || `https://${APP_DOMAIN_FALLBACK}`;
}

export async function buildCanonicalUrl(
  podcast: PublicPodcastRecord,
  subdomain: string,
  pathname = '',
) {
  const safePathname = pathname ? `/${pathname.replace(/^\/+/, '')}` : '';

  if (podcast.custom_domain) {
    return `https://${normalizeHost(podcast.custom_domain)}${safePathname || '/'}`;
  }

  const origin = await getRequestOrigin();
  const basePath = await getPublicBasePath(subdomain, podcast.custom_domain || null);
  return new URL(`${basePath}${safePathname}`, origin).toString();
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildPodcastSeriesJsonLd(input: {
  podcast: PublicPodcastRecord;
  canonicalUrl: string;
  imageUrl?: string | null;
  hostName?: string | null;
  episodes?: PublicEpisodeRecord[];
}) {
  const themeConfig = (input.podcast.theme_config || {}) as PublicThemeConfig;
  const sameAs = [
    themeConfig.applePodcastsUrl,
    themeConfig.spotifyUrl,
    themeConfig.youtubeUrl,
    themeConfig.twitterUrl,
    themeConfig.linkedInUrl,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: input.podcast.title,
    description: excerpt(input.podcast.description, 220),
    url: input.canonicalUrl,
    image: input.imageUrl || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    author: input.hostName ? { '@type': 'Person', name: input.hostName } : undefined,
    hasPart: (input.episodes || []).slice(0, 20).map((episode) => ({
      '@type': 'PodcastEpisode',
      name: episode.title,
      url: episode.slug,
      datePublished: toSchemaDateTime(episode.published_at),
    })),
  };
}

export function buildWebsiteSeoJsonLd(input: {
  seo: WebsiteSeoSettings;
  canonicalUrl: string;
  imageUrl?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    ...input.seo.structuredData,
    url: input.canonicalUrl,
    image: input.imageUrl || undefined,
  };
}

export function buildEpisodeJsonLd(input: {
  podcast: PublicPodcastRecord;
  episode: PublicEpisodeRecord;
  episodeUrl: string;
  seriesUrl: string;
  transcriptUrl?: string;
  imageUrl?: string | null;
  hostName?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: input.episode.title,
    url: input.episodeUrl,
    datePublished: toSchemaDateTime(input.episode.published_at),
    description: excerpt(input.episode.description, 220),
    associatedMedia: input.episode.audio_url
      ? {
          '@type': 'AudioObject',
          contentUrl: input.episode.audio_url,
        }
      : undefined,
    image: input.imageUrl || undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: input.podcast.title,
      url: input.seriesUrl,
    },
    author: input.hostName ? { '@type': 'Person', name: input.hostName } : undefined,
    transcript: input.transcriptUrl || undefined,
  };
}

export function buildEpisodeVideoJsonLd(input: {
  episode: PublicEpisodeRecord;
  episodeUrl: string;
  podcastTitle?: string | null;
  hostName?: string | null;
}) {
  const videoId = normalizeYouTubeVideoId(input.episode.youtube_video_id);
  if (!videoId) return null;

  const description =
    excerpt(input.episode.description, 500) ||
    `Watch ${input.episode.title || 'this Ready Set Do episode'} from ${input.podcastTitle || 'Ready Set Do'}.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.episode.title || 'Ready Set Do episode',
    description,
    uploadDate: toSchemaDateTime(input.episode.published_at),
    duration: toSchemaDuration(input.episode.duration_seconds),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: [`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`],
    mainEntityOfPage: input.episodeUrl,
    publisher: {
      '@type': 'Organization',
      name: input.podcastTitle || 'Ready Set Do',
    },
    creator: input.hostName ? { '@type': 'Person', name: input.hostName } : undefined,
  };
}

export function buildCollectionJsonLd(input: {
  name: string;
  description: string;
  url: string;
  itemUrls: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.itemUrls.map((itemUrl, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: itemUrl,
      })),
    },
  };
}

export function buildProductJsonLd(input: {
  name: string;
  description?: string | null;
  price?: number | null;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: excerpt(input.description, 220),
    url: input.url,
    offers: typeof input.price === 'number'
      ? {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: input.price.toFixed(2),
          availability: 'https://schema.org/InStock',
          url: input.url,
        }
      : undefined,
  };
}
