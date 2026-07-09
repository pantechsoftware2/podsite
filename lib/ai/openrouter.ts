import OpenAI from 'openai';
import type { WebsiteSignals } from './siteSignals';
import { sanitizeGeneratedPages, type GeneratedPageBlueprint } from '@/lib/podcastBlueprints';
import type { ThemeConfig } from '@/components/ThemeEngine';
import { sanitizeWebsiteSeoSettings, type WebsiteSeoSettings } from '@/lib/publicSite';

export type ImportSiteBlueprint = {
    themeConfig?: {
        primaryColor?: string;
        backgroundColor?: string;
        foregroundColor?: string;
        accentColor?: string;
        borderColor?: string;
        fontHeading?: string;
        fontBody?: string;
        cornerRadius?: string;
        layout?: 'netflix' | 'substack' | 'genz';
        tagline?: string;
        hiddenBlocks?: string[];
        playerMode?: 'auto' | 'audio' | 'video';
        stickyPlayer?: boolean;
        showTimestamps?: boolean;
        brandReferenceUrl?: string;
        generatedRationale?: string;
        generatedNav?: string[];
        generatedSections?: string[];
        generatedReferencePages?: Array<{ title: string; url: string }>;
        applePodcastsUrl?: string;
        spotifyUrl?: string;
        youtubeUrl?: string;
        twitterUrl?: string;
        linkedInUrl?: string;
        blueprintArchetype?: string;
        generatedPages?: GeneratedPageBlueprint[];
    };
    generatedPages?: GeneratedPageBlueprint[];
    pageLayout?: string[];
    rationale?: string;
    siteMap?: {
        navItems?: string[];
        sections?: string[];
        keyPages?: Array<{ title: string; url: string }>;
    };
};

export type EpisodeLaunchAssets = {
    titleIdeas: string[];
    youtubeTitleIdeas: string[];
    seoTitle: string;
    seoDescription: string;
    seoTags?: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
        ogTitle: string;
        ogDescription: string;
    };
    tags: string[];
    keyQuotes: string[];
    timestamps: Array<{
        time: string;
        title: string;
        seconds: number | null;
    }>;
    socialPosts: Array<{
        platform: 'x' | 'linkedin' | 'instagram' | 'newsletter';
        copy: string;
    }>;
    platformDescriptions: {
        spotify: string;
        apple: string;
        youtube: string;
    };
    thumbnailBriefs: Array<{
        concept: string;
        overlayText: string;
        prompt: string;
    }>;
};

export type WebsiteSeoGeneration = {
    model: string;
    seo: WebsiteSeoSettings;
};

export type AutoBrandIdentity = {
    primaryColor: string;
    backgroundColor: string;
    foregroundColor: string;
    accentColor: string;
    borderColor: string;
    fontFamily: 'Inter' | 'Playfair Display' | 'JetBrains Mono' | 'Space Grotesk' | 'DM Sans' | 'Lora' | 'Merriweather';
    cornerRadius: 'sharp' | 'soft' | 'round';
    mood: 'bold' | 'minimal' | 'editorial' | 'playful' | 'dark' | 'professional';
    heroLayout: 'magazine' | 'centered' | 'split' | 'fullbleed';
};

const DEFAULT_LAYOUT = ['hero', 'subscribe', 'product', 'grid', 'host', 'shorts'];
const ALLOWED_LAYOUTS = new Set(['hero', 'subscribe', 'product', 'grid', 'host', 'shorts']);
const ALLOWED_HIDDEN = new Set(['hero', 'subscribe', 'product', 'grid', 'host', 'shorts']);
const ALLOWED_VISUAL_LAYOUTS = new Set(['netflix', 'substack', 'genz']);
const ALLOWED_RADII = new Set(['0px', '8px', '16px']);
const ALLOWED_AUTO_BRAND_FONTS = new Set([
    'Inter',
    'Playfair Display',
    'JetBrains Mono',
    'Space Grotesk',
    'DM Sans',
    'Lora',
    'Merriweather',
]);
const ALLOWED_AUTO_BRAND_RADII = new Set(['sharp', 'soft', 'round']);
const ALLOWED_AUTO_BRAND_MOODS = new Set(['bold', 'minimal', 'editorial', 'playful', 'dark', 'professional']);
const ALLOWED_AUTO_BRAND_HERO_LAYOUTS = new Set(['magazine', 'centered', 'split', 'fullbleed']);
const OPENROUTER_MODEL = 'z-ai/glm-5.2';

function getOpenRouterClient() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    return new OpenAI({
        apiKey,
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'PodSite Killer',
        },
    });
}

function sanitizeLayout(input: unknown) {
    const raw = Array.isArray(input) ? input : [];
    const cleaned = raw.filter((item): item is string => typeof item === 'string' && ALLOWED_LAYOUTS.has(item));
    return cleaned.length ? Array.from(new Set(cleaned)) : DEFAULT_LAYOUT;
}

function sanitizeHiddenBlocks(input: unknown) {
    const raw = Array.isArray(input) ? input : [];
    return Array.from(
        new Set(raw.filter((item): item is string => typeof item === 'string' && ALLOWED_HIDDEN.has(item)))
    );
}

function sanitizePages(input: unknown) {
    if (!Array.isArray(input)) return [];

    return input
        .filter((page): page is { title?: unknown; url?: unknown } => Boolean(page && typeof page === 'object'))
        .map((page) => ({
            title: typeof page.title === 'string' ? page.title : '',
            url: typeof page.url === 'string' ? page.url : '',
        }))
        .filter((page) => page.title || page.url)
        .slice(0, 6);
}

function stripHtml(input: string | null | undefined) {
    return (input || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function compactText(input: string | null | undefined, maxLength = 9000) {
    const clean = stripHtml(input);
    return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}

function isHexColor(input: unknown): input is string {
    return typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input.trim());
}

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    return [
        Number.parseInt(clean.slice(0, 2), 16),
        Number.parseInt(clean.slice(2, 4), 16),
        Number.parseInt(clean.slice(4, 6), 16),
    ];
}

function rgbToHex([r, g, b]: [number, number, number]) {
    return `#${[r, g, b]
        .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
        .join('')}`;
}

function luminance(hex: string) {
    const [r, g, b] = hexToRgb(hex).map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(first: string, second: string) {
    const light = Math.max(luminance(first), luminance(second));
    const dark = Math.min(luminance(first), luminance(second));
    return (light + 0.05) / (dark + 0.05);
}

function mixWith(hex: string, target: '#ffffff' | '#000000', amount: number) {
    const rgb = hexToRgb(hex);
    const targetRgb = hexToRgb(target);
    return rgbToHex([
        rgb[0] + (targetRgb[0] - rgb[0]) * amount,
        rgb[1] + (targetRgb[1] - rgb[1]) * amount,
        rgb[2] + (targetRgb[2] - rgb[2]) * amount,
    ]);
}

function ensureReadableColor(color: string, background: string) {
    if (contrastRatio(color, background) >= 4.5) return color;

    const backgroundIsDark = luminance(background) < 0.3;
    for (const amount of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        const adjusted = mixWith(color, backgroundIsDark ? '#ffffff' : '#000000', amount);
        if (contrastRatio(adjusted, background) >= 4.5) return adjusted;
    }

    return backgroundIsDark ? '#f8fafc' : '#111827';
}

function readableForeground(background: string) {
    return contrastRatio('#f8fafc', background) >= 4.5 ? '#f8fafc' : '#111827';
}

function sanitizeAutoBrandIdentity(input: unknown): AutoBrandIdentity {
    const parsed = Boolean(input && typeof input === 'object') ? input as Record<string, unknown> : {};
    const mood = typeof parsed.mood === 'string' && ALLOWED_AUTO_BRAND_MOODS.has(parsed.mood)
        ? parsed.mood as AutoBrandIdentity['mood']
        : 'professional';
    const backgroundColor = isHexColor(parsed.backgroundColor)
        ? parsed.backgroundColor.toLowerCase()
        : mood === 'dark'
            ? '#111827'
            : '#f8fafc';
    const rawPrimary = isHexColor(parsed.primaryColor) ? parsed.primaryColor.toLowerCase() : '#2563eb';
    const rawAccent = isHexColor(parsed.accentColor) ? parsed.accentColor.toLowerCase() : '#f97316';

    return {
        primaryColor: ensureReadableColor(rawPrimary, backgroundColor),
        backgroundColor,
        foregroundColor: readableForeground(backgroundColor),
        accentColor: ensureReadableColor(rawAccent, backgroundColor),
        borderColor: luminance(backgroundColor) < 0.3 ? '#334155' : '#d4d4d8',
        fontFamily: typeof parsed.fontFamily === 'string' && ALLOWED_AUTO_BRAND_FONTS.has(parsed.fontFamily)
            ? parsed.fontFamily as AutoBrandIdentity['fontFamily']
            : 'Inter',
        cornerRadius: typeof parsed.cornerRadius === 'string' && ALLOWED_AUTO_BRAND_RADII.has(parsed.cornerRadius)
            ? parsed.cornerRadius as AutoBrandIdentity['cornerRadius']
            : 'soft',
        mood,
        heroLayout: typeof parsed.heroLayout === 'string' && ALLOWED_AUTO_BRAND_HERO_LAYOUTS.has(parsed.heroLayout)
            ? parsed.heroLayout as AutoBrandIdentity['heroLayout']
            : 'centered',
    };
}

export function autoBrandToThemeConfig(identity: AutoBrandIdentity): NonNullable<ImportSiteBlueprint['themeConfig']> {
    const radiusMap = {
        sharp: '0px',
        soft: '8px',
        round: '16px',
    } satisfies Record<AutoBrandIdentity['cornerRadius'], string>;
    const layoutMap = {
        magazine: 'substack',
        centered: 'minimal',
        split: 'genz',
        fullbleed: 'netflix',
    } satisfies Record<AutoBrandIdentity['heroLayout'], ThemeConfig['layout']>;
    const layout = layoutMap[identity.heroLayout];

    return {
        primaryColor: identity.primaryColor,
        backgroundColor: identity.backgroundColor,
        foregroundColor: identity.foregroundColor,
        accentColor: identity.accentColor,
        borderColor: identity.borderColor,
        fontHeading: identity.fontFamily,
        fontBody: identity.fontFamily,
        cornerRadius: radiusMap[identity.cornerRadius],
        layout: layout === 'minimal' ? undefined : layout,
        generatedRationale: `${identity.mood} brand identity with a ${identity.heroLayout} hero direction.`,
    };
}

function stringArray(input: unknown, maxItems: number, maxLength: number) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim().slice(0, maxLength))
        .slice(0, maxItems);
}

function sanitizeSeoTags(input: unknown, fallback: {
    podcastTitle: string;
    episodeTitle: string;
    seoTitle: string;
    seoDescription: string;
    tags: string[];
}): NonNullable<EpisodeLaunchAssets['seoTags']> {
    const parsed = Boolean(input && typeof input === 'object') ? input as Record<string, unknown> : {};
    const fallbackTopic = fallback.episodeTitle || 'Episode';
    const metaTitle = typeof parsed.metaTitle === 'string' && parsed.metaTitle.trim()
        ? parsed.metaTitle.trim().slice(0, 60)
        : `${fallbackTopic} | ${fallback.podcastTitle}`.slice(0, 60);
    const metaDescription = typeof parsed.metaDescription === 'string' && parsed.metaDescription.trim()
        ? parsed.metaDescription.trim().slice(0, 155)
        : fallback.seoDescription.slice(0, 155);
    const keywords = stringArray(parsed.keywords, 12, 48).length
        ? stringArray(parsed.keywords, 12, 48)
        : fallback.tags.slice(0, 12);
    const ogTitle = typeof parsed.ogTitle === 'string' && parsed.ogTitle.trim()
        ? parsed.ogTitle.trim().slice(0, 60)
        : metaTitle;
    const ogDescription = typeof parsed.ogDescription === 'string' && parsed.ogDescription.trim()
        ? parsed.ogDescription.trim().slice(0, 200)
        : metaDescription.slice(0, 200);

    return {
        metaTitle,
        metaDescription,
        keywords,
        ogTitle,
        ogDescription,
    };
}

function timestampToSeconds(input: string) {
    const parts = input.split(':').map((part) => Number.parseInt(part, 10));
    if (!parts.length || parts.some((part) => Number.isNaN(part))) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0];
}

function sanitizeTimestamps(input: unknown): EpisodeLaunchAssets['timestamps'] {
    if (!Array.isArray(input)) return [];

    return input
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => {
            const rawTime = typeof item.time === 'string' ? item.time.trim() : '';
            const title = typeof item.title === 'string' ? item.title.trim().slice(0, 90) : '';
            const parsedSeconds = typeof item.seconds === 'number' && Number.isFinite(item.seconds)
                ? Math.max(0, Math.round(item.seconds))
                : timestampToSeconds(rawTime);

            return {
                time: rawTime,
                title,
                seconds: parsedSeconds,
            };
        })
        .filter((item) => /^\d{1,2}:\d{2}(?::\d{2})?$/.test(item.time) && item.title)
        .slice(0, 12);
}

function sanitizeSocialPosts(input: unknown): EpisodeLaunchAssets['socialPosts'] {
    const allowed = new Set(['x', 'linkedin', 'instagram', 'newsletter']);
    if (!Array.isArray(input)) return [];

    return input
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
            platform: typeof item.platform === 'string' && allowed.has(item.platform)
                ? item.platform as EpisodeLaunchAssets['socialPosts'][number]['platform']
                : 'linkedin',
            copy: typeof item.copy === 'string' ? item.copy.trim().slice(0, 1200) : '',
        }))
        .filter((item) => item.copy)
        .slice(0, 6);
}

function sanitizeThumbnailBriefs(input: unknown): EpisodeLaunchAssets['thumbnailBriefs'] {
    if (!Array.isArray(input)) return [];

    return input
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
            concept: typeof item.concept === 'string' ? item.concept.trim().slice(0, 90) : 'Editorial thumbnail',
            overlayText: typeof item.overlayText === 'string' ? item.overlayText.trim().slice(0, 42) : '',
            prompt: typeof item.prompt === 'string' ? item.prompt.trim().slice(0, 700) : '',
        }))
        .filter((item) => item.prompt)
        .slice(0, 4);
}

function sanitizeEpisodeLaunchAssets(input: unknown, fallback: {
    podcastTitle: string;
    episodeTitle: string;
}): EpisodeLaunchAssets {
    const parsed = Boolean(input && typeof input === 'object') ? input as Record<string, unknown> : {};
    const platformDescriptions = Boolean(parsed.platformDescriptions && typeof parsed.platformDescriptions === 'object')
        ? parsed.platformDescriptions as Record<string, unknown>
        : {};
    const seoTitle = typeof parsed.seoTitle === 'string'
        ? parsed.seoTitle.trim().slice(0, 60)
        : `${fallback.episodeTitle} | ${fallback.podcastTitle}`.slice(0, 60);
    const seoDescription = typeof parsed.seoDescription === 'string'
        ? parsed.seoDescription.trim().slice(0, 155)
        : '';
    const tags = stringArray(parsed.tags, 12, 48);

    return {
        titleIdeas: stringArray(parsed.titleIdeas, 8, 90),
        youtubeTitleIdeas: stringArray(parsed.youtubeTitleIdeas, 8, 90),
        seoTitle,
        seoDescription,
        seoTags: sanitizeSeoTags(parsed.seoTags, {
            podcastTitle: fallback.podcastTitle,
            episodeTitle: fallback.episodeTitle,
            seoTitle,
            seoDescription,
            tags,
        }),
        tags,
        keyQuotes: stringArray(parsed.keyQuotes, 6, 220),
        timestamps: sanitizeTimestamps(parsed.timestamps),
        socialPosts: sanitizeSocialPosts(parsed.socialPosts),
        platformDescriptions: {
            spotify: typeof platformDescriptions.spotify === 'string' ? platformDescriptions.spotify.trim().slice(0, 600) : '',
            apple: typeof platformDescriptions.apple === 'string' ? platformDescriptions.apple.trim().slice(0, 900) : '',
            youtube: typeof platformDescriptions.youtube === 'string' ? platformDescriptions.youtube.trim().slice(0, 1400) : '',
        },
        thumbnailBriefs: sanitizeThumbnailBriefs(parsed.thumbnailBriefs),
    };
}

function fallbackEpisodeLaunchAssets(input: {
    podcastTitle: string;
    episodeTitle: string;
    episodeDescription: string;
}): EpisodeLaunchAssets {
    const baseTitle = input.episodeTitle || 'New Episode';
    const description = compactText(input.episodeDescription, 220);
    const seoTitle = `${baseTitle} | ${input.podcastTitle}`.slice(0, 60);
    const seoDescription = (description || `Listen to ${baseTitle} from ${input.podcastTitle}.`).slice(0, 155);
    const fallbackTags = [
        baseTitle,
        input.podcastTitle,
        `${baseTitle} episode`,
        `${input.podcastTitle} ${baseTitle}`,
    ].filter(Boolean).slice(0, 12);

    return {
        titleIdeas: [
            baseTitle,
            `${baseTitle}: What Listeners Should Know`,
            `The Big Ideas Behind ${baseTitle}`,
        ],
        youtubeTitleIdeas: [
            `${baseTitle} | ${input.podcastTitle}`,
            `${baseTitle} Explained`,
            `What ${baseTitle} Reveals`,
        ],
        seoTitle,
        seoDescription,
        seoTags: {
            metaTitle: seoTitle,
            metaDescription: seoDescription,
            keywords: fallbackTags,
            ogTitle: seoTitle,
            ogDescription: seoDescription,
        },
        tags: fallbackTags,
        keyQuotes: [],
        timestamps: [],
        socialPosts: [
            {
                platform: 'linkedin',
                copy: `New episode: ${baseTitle}\n\n${description || 'A useful conversation for listeners who want the key ideas without the fluff.'}`,
            },
            {
                platform: 'x',
                copy: `New episode: ${baseTitle}\n\nListen now and explore the full notes on the site.`,
            },
        ],
        platformDescriptions: {
            spotify: description.slice(0, 600),
            apple: description,
            youtube: `${description}\n\nListen to ${input.podcastTitle} and explore more episodes on the site.`,
        },
        thumbnailBriefs: [
            {
                concept: 'Editorial hero thumbnail',
                overlayText: baseTitle.slice(0, 42),
                prompt: `Create a clean editorial podcast thumbnail for an episode titled "${baseTitle}". Use bold readable typography, strong contrast, and a premium creator-brand feel.`,
            },
        ],
    };
}

function fallbackWebsiteSeo(input: {
    title: string;
    hostName: string | null;
    description: string;
    episodeTitles: string[];
    rssUrl: string | null;
}): WebsiteSeoSettings {
    const topicKeywords = input.episodeTitles
        .flatMap((title) => title.split(/\s+/))
        .map((word) => word.toLowerCase().replace(/[^a-z0-9-]/g, ''))
        .filter((word) => word.length > 4)
        .slice(0, 8);

    return sanitizeWebsiteSeoSettings(
        {
            siteTitle: input.title,
            siteDescription: compactText(input.description, 155) || `Listen to ${input.title} episodes, show notes, and podcast updates.`,
            keywords: [
                input.title,
                `${input.title} episodes`,
                `${input.title} podcast`,
                ...(input.hostName ? [`${input.hostName} podcast`] : []),
                ...topicKeywords,
            ],
            ogImage: `A clean podcast website share image for ${input.title} with bold title typography and show artwork.`,
            robotsDirectives: 'index, follow',
            structuredData: {
                '@type': 'PodcastSeries',
                name: input.title,
                description: compactText(input.description, 220),
                webFeed: input.rssUrl || undefined,
                author: {
                    '@type': 'Person',
                    name: input.hostName || input.title,
                },
            },
        },
        {
            title: input.title,
            description: input.description,
            rssUrl: input.rssUrl,
            hostName: input.hostName,
        },
    );
}

export async function generateWebsiteSeoWithOpenRouter(input: {
    title: string;
    hostName: string | null;
    description: string;
    episodeCount: number;
    latestEpisodeTitles: string[];
    rssUrl: string | null;
    siteUrl: string;
}): Promise<WebsiteSeoGeneration> {
    const client = getOpenRouterClient();
    const model = process.env.OPENROUTER_MODEL || OPENROUTER_MODEL;

    if (!client) {
        return {
            model: 'fallback',
            seo: fallbackWebsiteSeo({
                title: input.title,
                hostName: input.hostName,
                description: input.description,
                episodeTitles: input.latestEpisodeTitles,
                rssUrl: input.rssUrl,
            }),
        };
    }

    const systemPrompt = `You are a podcast website SEO optimizer.

Given a podcast's metadata and episode list, generate complete website
SEO settings. Return ONLY valid JSON.

Schema:
{
  "siteTitle": "max 60 chars",
  "siteDescription": "max 155 chars",
  "keywords": ["8-12 keywords"],
  "ogImage": "description of ideal OG image to generate",
  "robotsDirectives": "index, follow",
  "structuredData": {
    "@type": "PodcastSeries",
    "name": "...",
    "description": "...",
    "webFeed": "RSS URL",
    "author": { "@type": "Person", "name": "..." }
  }
}`;

    const userPrompt = `Podcast: ${input.title}
Host: ${input.hostName || 'Unknown'}
Description: ${compactText(input.description, 1800)}
Number of episodes: ${input.episodeCount}
Latest episode topics: ${input.latestEpisodeTitles.slice(0, 5).join(' | ') || 'No episodes available'}
RSS URL: ${input.rssUrl || 'Not available'}
Site URL: ${input.siteUrl}`;

    const response = await client.chat.completions.create({
        model,
        temperature: 0.35,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('OpenRouter returned an empty SEO response.');
    }

    return {
        model,
        seo: sanitizeWebsiteSeoSettings(
            JSON.parse(content),
            {
                title: input.title,
                description: input.description,
                rssUrl: input.rssUrl,
                hostName: input.hostName,
            },
        ),
    };
}

function pickPlatformLinks(links: WebsiteSignals['platformLinks']) {
    const mapped: Record<string, string> = {};

    for (const link of links) {
        if (/podcasts\.apple\.com/i.test(link.href) && !mapped.applePodcastsUrl) mapped.applePodcastsUrl = link.href;
        if (/open\.spotify\.com/i.test(link.href) && !mapped.spotifyUrl) mapped.spotifyUrl = link.href;
        if (/(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(link.href) && !mapped.youtubeUrl) mapped.youtubeUrl = link.href;
        if (/(twitter\.com|x\.com)/i.test(link.href) && !mapped.twitterUrl) mapped.twitterUrl = link.href;
        if (/linkedin\.com/i.test(link.href) && !mapped.linkedInUrl) mapped.linkedInUrl = link.href;
    }

    return mapped;
}

export async function generateAutoBrandIdentityWithOpenRouter(input: {
    title: string;
    description: string;
    genre?: string | null;
    hasArtwork: boolean;
    artworkDominantColors?: string[];
}) {
    const client = getOpenRouterClient();
    const model = process.env.OPENROUTER_MODEL || OPENROUTER_MODEL;

    if (!client) {
        return {
            model: 'fallback',
            identity: sanitizeAutoBrandIdentity({
                primaryColor: input.hasArtwork ? '#0ea5e9' : '#7c3aed',
                backgroundColor: '#0f172a',
                accentColor: '#f59e0b',
                fontFamily: 'Space Grotesk',
                cornerRadius: 'soft',
                mood: 'bold',
                heroLayout: 'fullbleed',
            }),
        };
    }

    const systemPrompt = `You are a brand designer for podcast websites.

Given a podcast's title, description, and genre, generate a complete
brand identity. Return ONLY valid JSON, no markdown, no explanation.

Schema:
{
  "primaryColor": "#hex - main brand color",
  "backgroundColor": "#hex - page background (dark or light)",
  "accentColor": "#hex - buttons, links, highlights",
  "fontFamily": "one of: Inter, Playfair Display, JetBrains Mono, Space Grotesk, DM Sans, Lora, Merriweather",
  "cornerRadius": "one of: sharp, soft, round",
  "mood": "one of: bold, minimal, editorial, playful, dark, professional",
  "heroLayout": "one of: magazine, centered, split, fullbleed"
}

Rules:
- Colors must have enough contrast for WCAG AA accessibility
- Background should be dark (#0a-#1a range) for "dark" mood, light (#f5-#ff range) otherwise
- Match the brand feel to the podcast's content and audience
- Be opinionated. Do not pick safe/generic combinations.`;

    const userPrompt = `Podcast: ${input.title || 'Untitled podcast'}
Description: ${compactText(input.description, 1800)}
Genre: ${input.genre || 'general'}
Has artwork: ${input.hasArtwork ? 'true' : 'false'}
Artwork dominant colors: ${input.artworkDominantColors?.length ? input.artworkDominantColors.join(', ') : 'none available'}`;

    const response = await client.chat.completions.create({
        model,
        temperature: 0.75,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('OpenRouter returned an empty brand response.');
    }

    return {
        model,
        identity: sanitizeAutoBrandIdentity(JSON.parse(content)),
    };
}

export async function generateImportSiteBlueprintWithOpenRouter(input: {
    podcastTitle: string;
    podcastDescription: string;
    podcastImage: string | null;
    websiteSignals: WebsiteSignals | null;
    episodeSamples: Array<{ title: string; publishedAt: string | null }>;
}) {
    const client = getOpenRouterClient();
    if (!client) return null;

    const model = process.env.OPENROUTER_MODEL || OPENROUTER_MODEL;
    const systemPrompt = `You are an expert podcast website strategist.

You are designing the initial structure and style of a podcast website at import time.
Use the podcast metadata and any existing website signals to create a blueprint that feels intentional, premium, and scalable.

Return STRICTLY valid JSON with this shape:
{
  "themeConfig": {
    "primaryColor": "#hex",
    "backgroundColor": "#hex",
    "foregroundColor": "#hex",
    "accentColor": "#hex",
    "borderColor": "#hex",
    "fontHeading": "Google Font family name",
    "fontBody": "Google Font family name",
    "cornerRadius": "0px or 8px or 16px",
    "layout": "netflix or substack or genz",
    "tagline": "short site tagline",
    "hiddenBlocks": ["host"],
    "playerMode": "auto or audio or video",
    "stickyPlayer": true,
    "showTimestamps": true
  },
  "generatedPages": [
    {
      "slug": "start-here",
      "title": "Start Here",
      "navLabel": "Start Here",
      "intent": "Help first-time visitors understand the show and find the right episodes.",
      "seoTitle": "Start Here | Podcast Name",
      "seoDescription": "Start with the best episodes, topics, and links for Podcast Name.",
      "sections": [
        { "title": "What This Show Helps With", "body": "Specific useful copy based on the show." },
        { "title": "Where To Begin", "body": "Specific useful copy based on the archive.", "ctaLabel": "Browse Episodes", "ctaHref": "/episodes" }
      ]
    }
  ],
  "pageLayout": ["hero", "subscribe", "product", "grid", "host", "shorts"],
  "rationale": "one short sentence",
  "siteMap": {
    "navItems": ["Start Here", "Guests", "Episodes"],
    "sections": ["Hero", "Browse by topic", "Latest episodes"],
    "keyPages": [{ "title": "Start Here", "url": "https://example.com/start" }]
  }
}

Rules:
- Only use pageLayout blocks from hero, subscribe, product, grid, host, shorts.
- Prefer audio-first choices unless the reference site clearly leans video-first.
- Keep the siteMap concise and useful.
- Generate 1-4 durable generatedPages for the show's archetype: start-here, resources, playbooks, newsletter, sponsors, seasons, or briefings.
- generatedPages should be useful enough to publish immediately and should avoid generic filler.
- Make strong but tasteful design decisions.
- Return JSON only.`;

    const userPrompt = JSON.stringify(
        {
            podcastTitle: input.podcastTitle,
            podcastDescription: input.podcastDescription,
            podcastImage: input.podcastImage,
            websiteSignals: input.websiteSignals,
            episodeSamples: input.episodeSamples,
        },
        null,
        2
    );

    const response = await client.chat.completions.create({
        model,
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('OpenRouter returned an empty response.');
    }

    const parsed = JSON.parse(content) as ImportSiteBlueprint;
    const platformLinks = pickPlatformLinks(input.websiteSignals?.platformLinks || []);

    return {
        themeConfig: {
            ...parsed.themeConfig,
            ...platformLinks,
            layout:
                parsed.themeConfig?.layout && ALLOWED_VISUAL_LAYOUTS.has(parsed.themeConfig.layout)
                    ? parsed.themeConfig.layout
                    : undefined,
            cornerRadius:
                parsed.themeConfig?.cornerRadius && ALLOWED_RADII.has(parsed.themeConfig.cornerRadius)
                    ? parsed.themeConfig.cornerRadius
                    : undefined,
            hiddenBlocks: sanitizeHiddenBlocks(parsed.themeConfig?.hiddenBlocks),
            brandReferenceUrl: input.websiteSignals?.url || undefined,
            generatedRationale: parsed.rationale,
            generatedNav: parsed.siteMap?.navItems?.slice(0, 8) || input.websiteSignals?.navItems || [],
            generatedSections: parsed.siteMap?.sections?.slice(0, 8) || input.websiteSignals?.sectionHeadings || [],
            generatedReferencePages: sanitizePages(parsed.siteMap?.keyPages).length
                ? sanitizePages(parsed.siteMap?.keyPages)
                : (input.websiteSignals?.internalPages || []).map((page) => ({
                    title: page.title || page.url,
                    url: page.url,
                })),
            generatedPages: sanitizeGeneratedPages(
                parsed.themeConfig?.generatedPages?.length
                    ? parsed.themeConfig.generatedPages
                    : parsed.generatedPages
            ),
        },
        pageLayout: sanitizeLayout(parsed.pageLayout),
        rationale: parsed.rationale,
        siteMap: {
            navItems: parsed.siteMap?.navItems || input.websiteSignals?.navItems || [],
            sections: parsed.siteMap?.sections || input.websiteSignals?.sectionHeadings || [],
            keyPages: sanitizePages(parsed.siteMap?.keyPages).length
                ? sanitizePages(parsed.siteMap?.keyPages)
                : (input.websiteSignals?.internalPages || []).map((page) => ({
                    title: page.title || page.url,
                    url: page.url,
                })),
        },
    };
}

export async function generateEpisodeLaunchAssetsWithOpenRouter(input: {
    podcastTitle: string;
    podcastDescription: string;
    episodeTitle: string;
    episodeDescription: string;
    transcriptText?: string | null;
    publishedAt?: string | null;
}) {
    const client = getOpenRouterClient();
    const model = process.env.OPENROUTER_MODEL || OPENROUTER_MODEL;

    if (!client) {
        return {
            model: 'fallback',
            assets: fallbackEpisodeLaunchAssets(input),
        };
    }

    const systemPrompt = `You are an expert podcast launch strategist.

Create a reusable launch kit for one podcast episode. Optimize for discovery, SEO, platform-native copy, and creator workflows.

Return STRICTLY valid JSON with this shape:
{
  "titleIdeas": ["short sharp website title ideas"],
  "youtubeTitleIdeas": ["YouTube-first title ideas with curiosity but no clickbait"],
  "seoTitle": "max 70 chars",
  "seoDescription": "max 160 chars",
  "seoTags": {
    "metaTitle": "max 60 chars, include podcast name and episode topic",
    "metaDescription": "max 155 chars, compelling summary with primary keyword",
    "keywords": ["array of 8-12 specific relevant keywords"],
    "ogTitle": "max 60 chars, optimized for social sharing",
    "ogDescription": "max 200 chars, written to get clicks on social media"
  },
  "tags": ["search tags and topic tags"],
  "keyQuotes": ["short memorable quotes or paraphrased hooks from the episode"],
  "timestamps": [
    { "time": "00:00", "title": "Concise chapter title", "seconds": 0 }
  ],
  "socialPosts": [
    { "platform": "linkedin", "copy": "post copy" },
    { "platform": "x", "copy": "post copy" },
    { "platform": "instagram", "copy": "caption copy" },
    { "platform": "newsletter", "copy": "newsletter blurb" }
  ],
  "platformDescriptions": {
    "spotify": "listener-facing episode description",
    "apple": "listener-facing episode description",
    "youtube": "YouTube description with chapter/listening CTA if useful"
  },
  "thumbnailBriefs": [
    {
      "concept": "short name",
      "overlayText": "3-6 words max",
      "prompt": "visual generation prompt for a podcast/video thumbnail"
    }
  ]
}

Rules:
- Do not invent guest names, companies, or facts that are not in the input.
- If transcript text is limited, use careful framing instead of fake quotes.
- Make the outputs specific to the episode, not generic podcast marketing filler.
- If transcript text contains clear topic shifts, generate 4-10 useful timestamps. If timing evidence is absent, return an empty timestamps array.
- Spotify description must be 400-600 characters, use • bullets, no timestamps, no hashtags, no links.
- Spotify structure: one-sentence hook, blank line, 3-5 bullets under 80 chars, blank line, follow CTA only if a clear publish schedule is known, blank line, guest info only if explicit.
- SEO metaTitle format: "{{Topic}} | {{Podcast Name}}".
- SEO keywords should be specific; avoid generic words like podcast, interview, conversation.
- Include the guest's name in SEO keywords only if an explicit guest is present.
- Tags should include specific topics, audience intent, and searchable phrases.
- Thumbnail prompts should request a bold 16:9 YouTube podcast thumbnail with a 2-4 word readable overlay and no more than 5 words of text.
- Return JSON only.`;

    const userPrompt = JSON.stringify(
        {
            podcastTitle: input.podcastTitle,
            podcastDescription: compactText(input.podcastDescription, 1200),
            episodeTitle: input.episodeTitle,
            episodeDescription: compactText(input.episodeDescription, 2200),
            transcriptExcerpt: compactText(input.transcriptText, 3000),
            seoTranscriptExcerpt: compactText(input.transcriptText, 2000),
            publishedAt: input.publishedAt,
            guest: 'none unless explicitly named in the episode title, description, or transcript excerpt',
            publishSchedule: 'omit if not available from RSS metadata',
        },
        null,
        2,
    );

    const response = await client.chat.completions.create({
        model,
        temperature: 0.45,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('OpenRouter returned an empty launch kit response.');
    }

    return {
        model,
        assets: sanitizeEpisodeLaunchAssets(JSON.parse(content), {
            podcastTitle: input.podcastTitle,
            episodeTitle: input.episodeTitle,
        }),
    };
}
