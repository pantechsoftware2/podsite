// lib/rss/parseRss.ts
import Parser from 'rss-parser';
import { extractTranscriptCandidate, fetchTranscriptText } from '@/lib/rss/transcripts';

type RssItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string; length?: string; type?: string };
  'content:encoded'?: string;
  content?: string;
  itunes?: {
    image?: string;
    duration?: string;
  };
  itunes_image?: { href?: string };
  itunes_duration?: string;
  media_content?: { $?: { url?: string } };
  podcast_transcript?: unknown;
};

type RssFeedExtra = {
  link?: string;
  image?: { url?: string };
  itunes?: {
    image?: string;
  };
};

type ParsedEpisode = {
  guid: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  publish_date: string | null;
  duration_seconds: number | null;
  episode_image_url: string | null;
  transcript_url: string | null;
  transcript_type: string | null;
  transcript_text: string | null;
};

// Helper to fetch XML using global fetch (handles protocols and redirects automatically)
async function fetchXml(url: string): Promise<string> {
  console.log(`[RSS V4] Fetching via global.fetch: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PodSiteKiller/1.0; +http://localhost:3000)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

export async function parseRss(
  rawUrl: string,
  options: { fetchTranscripts?: boolean; episodeLimit?: number } = {},
): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
  site_url: string | null;
  youtube_channel_id: string | null;
  episodes: ParsedEpisode[];
}> {
  const parser: Parser<RssFeedExtra, RssItem> = new Parser({
    customFields: {
      item: [
        'content:encoded',
        ['itunes:image', 'itunes_image'],
        ['itunes:duration', 'itunes_duration'],
        ['media:content', 'media_content'],
        ['podcast:transcript', 'podcast_transcript'],
      ],
    },
  });

  // 1) Normalize raw user input
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const cleanUrl = url
    .replace(/ /g, '%20')
    .replace(/"/g, '%22')
    .replace(/`/g, '%60')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/\|/g, '%7C')
    .replace(/\^/g, '%5E')
    .replace(/\\/g, '%5C');

  let xml = '';
  try {
    xml = await fetchXml(cleanUrl);
  } catch (err: unknown) {
    console.error('RSS Native Fetch Error:', err);
    throw new Error(`Failed to fetch RSS: ${err instanceof Error ? err.message : String(err)}`);
  }

  const feed = await parser.parseString(xml);

  const title = feed.title ?? null;
  const description = (feed.description as string | undefined) ?? null;
  const siteUrl = feed.link ?? null;
  const image =
    (feed.image?.url as string | undefined) ??
    (feed.itunes?.image as string | undefined) ??
    null;

  // AUTO-DETECT YouTube Channel ID from feed description/link
  const feedLink = feed.link || '';
  const searchText = ((description || '') + ' ' + (feedLink || '')).toLowerCase();
  const channelMatch = searchText.match(/youtube\.com\/(channel|c)\/([a-z0-9_-]+)/i);
  const handleMatch = searchText.match(/youtube\.com\/@([a-z0-9_-]+)/i);

  let detectedYtId: string | null = null;
  if (channelMatch && channelMatch[2]) detectedYtId = channelMatch[2];
  else if (handleMatch && handleMatch[1]) detectedYtId = '@' + handleMatch[1];

  const sourceItems = typeof options.episodeLimit === 'number'
    ? (feed.items ?? []).slice(0, Math.max(0, options.episodeLimit))
    : (feed.items ?? []);

  const episodes: ParsedEpisode[] = await Promise.all(sourceItems.map(async (item: RssItem) => {
    // ... same as before ...
    const guid =
      item.guid ||
      item.link ||
      item.title ||
      crypto.randomUUID();

    const desc =
      (item['content:encoded'] as string | undefined) ??
      (item.content as string | undefined) ??
      null;

    // AUDIO DETECTION (ENCLOSURE -> MEDIA:CONTENT -> LINK)
    let enclosureUrl = item.enclosure?.url ?? null;

    // Fallback to media:content
    if (!enclosureUrl && item.media_content?.$?.url) {
      enclosureUrl = item.media_content.$.url;
    }

    // Fallback to link if it ends in audio extension
    if (!enclosureUrl && item.link && /\.(mp3|m4a|wav|aac|ogg)($|\?)/i.test(item.link)) {
      enclosureUrl = item.link;
    }

    const publishDate = (item.isoDate || item.pubDate) ?? null;

    // Sanity check for future dates
    if (publishDate) {
      const d = new Date(publishDate);
      const now = new Date();
      if (d.getTime() > now.getTime() + 1000 * 60 * 60 * 24 * 30) {
        console.warn(`[RSS Warning] Episode "${item.title}" has a date far in the future: ${publishDate}. Check if system clock is correct!`);
      }
    }

    const durationStr =
      item.itunes_duration ||
      item.itunes?.duration ||
      null;

    let durationSeconds: number | null = null;
    if (durationStr && typeof durationStr === 'string') {
      const parts = durationStr.split(':').map((p) => parseInt(p, 10));
      if (parts.every((n) => !Number.isNaN(n))) {
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
          durationSeconds = parts[0];
        }
      }
    }

    const episodeImage =
      (item.itunes_image?.href as string | undefined) ??
      item.itunes?.image ??
      null;

    const transcript = extractTranscriptCandidate(item.podcast_transcript);
    let transcriptText: string | null = null;

    if (transcript.url && options.fetchTranscripts !== false) {
      try {
        transcriptText = await fetchTranscriptText(transcript);
      } catch (error) {
        console.warn(`[RSS Warning] Transcript fetch failed for "${item.title || guid}"`, error);
      }
    }

    return {
      guid: String(guid),
      title: item.title ?? 'Untitled episode',
      description: desc,
      audio_url: enclosureUrl,
      publish_date: publishDate,
      duration_seconds: durationSeconds,
      episode_image_url: episodeImage,
      transcript_url: transcript.url,
      transcript_type: transcript.type,
      transcript_text: transcriptText,
    };
  }));

  return { title, description, image, site_url: siteUrl, youtube_channel_id: detectedYtId, episodes };
}
