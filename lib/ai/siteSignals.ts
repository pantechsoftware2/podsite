type PageSignal = {
    url: string;
    title: string | null;
    headings: string[];
};

export type WebsiteSignals = {
    url: string;
    title: string | null;
    description: string | null;
    themeColor: string | null;
    ogImageUrl: string | null;
    imageBase64: string | null;
    navItems: string[];
    sectionHeadings: string[];
    internalPages: PageSignal[];
    platformLinks: Array<{ label: string; href: string }>;
    fontHints: string[];
    colorHints: string[];
};

const WEBSITE_TIMEOUT_MS = 5000;
const MAX_INTERNAL_PAGES = 4;
const MAX_HEADINGS = 8;
const MAX_NAV_ITEMS = 8;
const MAX_PLATFORM_LINKS = 6;

function decodeHtmlEntities(input: string) {
    return input
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function stripTags(input: string) {
    return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
}

function normalizeUrl(value: string) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function buildMetadataPattern(attribute: string, value: string) {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(
        `<meta[^>]+${attribute}=["']${escapedValue}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escapedValue}["'][^>]*>`,
        'i'
    );
}

function matchText(html: string, pattern: RegExp) {
    const match = html.match(pattern);
    return match?.[1]?.trim() || match?.[2]?.trim() || null;
}

async function fetchWithTimeout(url: string, accept: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBSITE_TIMEOUT_MS);

    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'PodSiteKiller/1.0 (+https://podsitekiller.com)',
                'Accept': accept,
            },
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function imageUrlToDataUrl(imageUrl: string): Promise<string | null> {
    const response = await fetchWithTimeout(imageUrl, 'image/*,*/*;q=0.8');
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
}

function extractAnchors(html: string, baseUrl: string) {
    const anchorPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const internalLinks: Array<{ label: string; href: string }> = [];
    const externalLinks: Array<{ label: string; href: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = anchorPattern.exec(html)) !== null) {
        const rawHref = match[1];
        const label = stripTags(match[2]).slice(0, 80);

        if (!label || label.length < 2) continue;
        if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;

        try {
            const resolvedHref = new URL(rawHref, baseUrl).toString();
            const resolved = new URL(resolvedHref);
            const root = new URL(baseUrl);

            if (resolved.origin === root.origin) {
                internalLinks.push({ label, href: resolvedHref });
            } else {
                externalLinks.push({ label, href: resolvedHref });
            }
        } catch {
            continue;
        }
    }

    return {
        internalLinks,
        externalLinks,
    };
}

function extractHeadings(html: string) {
    const matches = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
        .map((match) => stripTags(match[1]))
        .filter(Boolean);

    return uniqueStrings(matches).slice(0, MAX_HEADINGS);
}

function extractCssUrls(html: string, baseUrl: string) {
    return uniqueStrings(
        Array.from(html.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi))
            .map((match) => match[1])
            .map((href) => {
                try {
                    return new URL(href, baseUrl).toString();
                } catch {
                    return '';
                }
            })
            .filter(Boolean)
    ).slice(0, 2);
}

async function extractCssSignals(cssUrls: string[]) {
    const fontHints: string[] = [];
    const colorHints: string[] = [];

    for (const cssUrl of cssUrls) {
        try {
            const response = await fetchWithTimeout(cssUrl, 'text/css,*/*;q=0.8');
            if (!response.ok) continue;

            const css = await response.text();
            const fontMatches = Array.from(css.matchAll(/font-family:([^;]+);/gi))
                .map((match) => stripTags(match[1]).replace(/["']/g, ''))
                .filter(Boolean);
            const rootColorMatches = Array.from(css.matchAll(/--[a-z-]+:\s*([^;]+);/gi))
                .map((match) => match[1].trim())
                .filter((value) => /#|rgb|hsl/.test(value));

            fontHints.push(...fontMatches);
            colorHints.push(...rootColorMatches);
        } catch {
            continue;
        }
    }

    return {
        fontHints: uniqueStrings(fontHints).slice(0, 8),
        colorHints: uniqueStrings(colorHints).slice(0, 8),
    };
}

async function analyzeInternalPage(url: string): Promise<PageSignal | null> {
    try {
        const response = await fetchWithTimeout(url, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
        if (!response.ok) return null;

        const html = await response.text();
        return {
            url,
            title: matchText(html, /<title[^>]*>([^<]+)<\/title>/i),
            headings: extractHeadings(html),
        };
    } catch {
        return null;
    }
}

function mapPlatformLinks(externalLinks: Array<{ label: string; href: string }>) {
    return uniqueByHref(
        externalLinks.filter(({ href }) =>
            /spotify\.com|podcasts\.apple\.com|youtube\.com|youtu\.be|music\.youtube\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com/i.test(href)
        )
    ).slice(0, MAX_PLATFORM_LINKS);
}

function uniqueByHref(links: Array<{ label: string; href: string }>) {
    const seen = new Set<string>();
    return links.filter((link) => {
        if (seen.has(link.href)) return false;
        seen.add(link.href);
        return true;
    });
}

export async function fetchWebsiteSignals(websiteUrl: string): Promise<WebsiteSignals | null> {
    const normalizedUrl = normalizeUrl(websiteUrl);
    const response = await fetchWithTimeout(
        normalizedUrl,
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    );

    if (!response.ok) {
        throw new Error(`Failed to load website (${response.status})`);
    }

    const html = await response.text();
    const title = matchText(html, /<title[^>]*>([^<]+)<\/title>/i);
    const description =
        matchText(html, buildMetadataPattern('name', 'description')) ||
        matchText(html, buildMetadataPattern('property', 'og:description'));
    const themeColor = matchText(html, buildMetadataPattern('name', 'theme-color'));
    const ogImageRaw =
        matchText(html, buildMetadataPattern('property', 'og:image')) ||
        matchText(html, buildMetadataPattern('name', 'twitter:image'));

    let ogImageUrl: string | null = null;
    if (ogImageRaw) {
        try {
            ogImageUrl = new URL(ogImageRaw, normalizedUrl).toString();
        } catch {
            ogImageUrl = null;
        }
    }

    const imageBase64 = ogImageUrl ? await imageUrlToDataUrl(ogImageUrl).catch(() => null) : null;

    const { internalLinks, externalLinks } = extractAnchors(html, normalizedUrl);
    const navItems = uniqueStrings(internalLinks.map((link) => link.label)).slice(0, MAX_NAV_ITEMS);
    const sectionHeadings = extractHeadings(html);
    const cssUrls = extractCssUrls(html, normalizedUrl);
    const { fontHints, colorHints } = await extractCssSignals(cssUrls);

    const internalPages = (
        await Promise.all(
            uniqueByHref(internalLinks)
                .filter(({ href }) => !/\/feed|\.xml($|\?)/i.test(href))
                .slice(0, MAX_INTERNAL_PAGES)
                .map(({ href }) => analyzeInternalPage(href))
        )
    ).filter((page): page is PageSignal => Boolean(page));

    return {
        url: normalizedUrl,
        title,
        description,
        themeColor,
        ogImageUrl,
        imageBase64,
        navItems,
        sectionHeadings,
        internalPages,
        platformLinks: mapPlatformLinks(externalLinks),
        fontHints,
        colorHints,
    };
}
