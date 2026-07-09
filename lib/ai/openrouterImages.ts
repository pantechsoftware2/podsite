export type GeneratedImageResult = {
    model: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
    bytes: Buffer;
};

type OpenRouterImage = {
    type?: string;
    image_url?: {
        url?: string;
    };
    imageUrl?: {
        url?: string;
    };
};

type ParsedImage = {
    mimeType: GeneratedImageResult['mimeType'];
    bytes: Buffer;
};

type OpenRouterImagesApiItem = {
    b64?: string;
    url?: string;
    mime_type?: string;
    mimeType?: string;
};

type OpenRouterImagesApiResponse = {
    data?: OpenRouterImagesApiItem[];
    error?: {
        message?: string;
    };
};

type OpenRouterImageResponse = {
    choices?: Array<{
        message?: {
            images?: OpenRouterImage[];
        };
    }>;
    error?: {
        message?: string;
    };
};

function supportedMimeType(input: string | null | undefined): GeneratedImageResult['mimeType'] {
    const mimeType = input?.split(';')[0].trim().toLowerCase();
    if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/webp') {
        return mimeType;
    }

    return 'image/png';
}

function parseBase64Image(input: string, mimeType = 'image/png') {
    return {
        mimeType: supportedMimeType(mimeType),
        bytes: Buffer.from(input, 'base64'),
    };
}

function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!match) {
        throw new Error('OpenRouter returned an unsupported image format.');
    }

    return {
        mimeType: match[1] as GeneratedImageResult['mimeType'],
        bytes: Buffer.from(match[2], 'base64'),
    };
}

async function fetchImageUrl(url: string): Promise<ParsedImage> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`OpenRouter image URL download failed with ${response.status}.`);
    }

    const mimeType = supportedMimeType(response.headers.get('content-type'));
    const bytes = Buffer.from(await response.arrayBuffer());

    if (!bytes.length) {
        throw new Error('OpenRouter returned an empty image file.');
    }

    return { mimeType, bytes };
}

async function parseImagesApiPayload(payload: OpenRouterImagesApiResponse | null) {
    const image = payload?.data?.[0];
    const mimeType = image?.mime_type || image?.mimeType || 'image/png';

    if (image?.b64) {
        return parseBase64Image(image.b64, mimeType);
    }

    if (image?.url?.startsWith('data:')) {
        return parseDataUrl(image.url);
    }

    if (image?.url) {
        return fetchImageUrl(image.url);
    }

    return null;
}

async function parseChatImagePayload(payload: OpenRouterImageResponse | null) {
    const imageUrl = payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url
        || payload?.choices?.[0]?.message?.images?.[0]?.imageUrl?.url;

    if (!imageUrl) return null;
    return imageUrl.startsWith('data:') ? parseDataUrl(imageUrl) : fetchImageUrl(imageUrl);
}

export async function generateEpisodeThumbnailImage(input: {
    prompt: string;
    overlayText?: string | null;
    episodeTitle: string;
    podcastTitle: string;
    primaryColor?: string | null;
    accentColor?: string | null;
    hasGuest?: boolean;
}): Promise<GeneratedImageResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required for AI thumbnail generation.');
    }

    const model = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-image';
    const overlayText = input.overlayText?.trim() || 'Episode Hook';
    const primaryColor = input.primaryColor || '#0ea5e9';
    const accentColor = input.accentColor || '#f97316';
    const prompt = `YouTube podcast thumbnail for episode titled "${input.episodeTitle}"
from the podcast "${input.podcastTitle}".

Style requirements:
- Bold, high-contrast design that stands out at small sizes
- Include short text overlay: "${overlayText}"
- Text must be large and readable at 120x67px (YouTube mobile)
- Use colors: ${primaryColor} and ${accentColor} from brand
- ${input.hasGuest ? 'Include space for a headshot on the left third' : 'No guest headshot area required'}
- Professional podcast thumbnail aesthetic
- 16:9 aspect ratio (1280x720)
- No small text, no clutter, no more than 5 words of text

Creative brief:
${input.prompt}

Avoid fake logos, fake platform UI, and misleading celebrity likenesses.`;

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'PodSiteKiller',
    };

    const response = await fetch(`${baseUrl}/images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            prompt,
            aspect_ratio: '16:9',
            image_config: {
                image_size: '1K',
            },
        }),
    });

    const payload = await response.json().catch(() => null) as OpenRouterImagesApiResponse | null;
    if (!response.ok) {
        throw new Error(payload?.error?.message || `OpenRouter image generation failed with ${response.status}.`);
    }

    let parsed = await parseImagesApiPayload(payload);

    if (!parsed) {
        parsed = await parseChatImagePayload(payload as OpenRouterImageResponse | null);
    }

    if (!parsed) {
        throw new Error('OpenRouter did not return image data. Make sure OPENROUTER_IMAGE_MODEL supports image output.');
    }

    return {
        model,
        mimeType: parsed.mimeType,
        bytes: parsed.bytes,
    };
}

export async function generatePodcastLogoImage(input: {
    title: string;
    description: string;
    mood: string;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
}): Promise<GeneratedImageResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required for AI logo generation.');
    }

    const model = process.env.OPENROUTER_LOGO_MODEL || process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-image';
    const prompt = `Design a minimal, modern podcast logo for "${input.title}".
The podcast is about: ${input.description || 'A podcast for curious listeners'}.
Style: ${input.mood} aesthetic.
Colors: use ${input.primaryColor} and ${input.accentColor} on a ${input.backgroundColor} background.
The logo should work at 128x128 and 512x512. No text in the logo.
Square format, clean edges, no gradients.`;

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'PodSiteKiller',
    };

    const response = await fetch(`${baseUrl}/images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            prompt,
            aspect_ratio: '1:1',
            image_config: {
                image_size: '1K',
            },
        }),
    });

    const payload = await response.json().catch(() => null) as OpenRouterImagesApiResponse | null;
    if (!response.ok) {
        throw new Error(payload?.error?.message || `OpenRouter logo generation failed with ${response.status}.`);
    }

    let parsed = await parseImagesApiPayload(payload);

    if (!parsed) {
        parsed = await parseChatImagePayload(payload as OpenRouterImageResponse | null);
    }

    if (!parsed) {
        throw new Error('OpenRouter did not return logo image data. Make sure the configured image model supports image output.');
    }

    return {
        model,
        mimeType: parsed.mimeType,
        bytes: parsed.bytes,
    };
}
