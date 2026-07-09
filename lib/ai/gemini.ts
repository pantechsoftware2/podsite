import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_build');

type SiteBlueprintRequest = {
    imageBase64: string | null;
    userText?: string;
    podcastTitle?: string;
    podcastDescription?: string;
    podcastTagline?: string;
    websiteContext?: string;
};

type SiteBlueprint = {
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
        playerMode?: 'auto' | 'audio' | 'video';
        stickyPlayer?: boolean;
        showTimestamps?: boolean;
        hiddenBlocks?: string[];
    };
    pageLayout?: string[];
    copy?: {
        title?: string;
        tagline?: string;
        description?: string;
    };
    rationale?: string;
};

export async function suggestPodcastDescription(title: string, currentDescription: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a strict summarization assistant.
    Use ONLY the provided podcast data. Do NOT invent names, dates, or details. 
    If information is missing, do not guess.
    
    Podcast Title: "${title}"
    Known Description: "${currentDescription}"
    
    Task: Write a compelling, premium, and concise SEO-optimized description for this podcast (max 2 sentences). 
    Your tone should be professional and informative.
    Return ONLY the description text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

/**
 * VISION AI: Analyze brand inspiration and return a structured site blueprint
 */
export async function generateSiteBlueprint({
    imageBase64,
    userText,
    podcastTitle,
    podcastDescription,
    podcastTagline,
    websiteContext,
}: SiteBlueprintRequest): Promise<SiteBlueprint> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a premium brand and web design strategist for podcasters.

Design a full website direction from the provided inspiration. Use the image if present. Use the brand brief, podcast info, and website context if present. Do not invent external facts. If something is unknown, leave it blank or choose a safe modern default.

Podcast title: "${podcastTitle || ''}"
Podcast tagline: "${podcastTagline || ''}"
Current podcast description: "${podcastDescription || ''}"
Brand brief: "${userText || 'Modern, distinctive, and conversion-friendly'}"
Website context: "${websiteContext || 'None provided'}"

Return STRICTLY valid JSON matching this schema:
{
  "themeConfig": {
    "primaryColor": "hex string",
    "backgroundColor": "hex string",
    "foregroundColor": "hex string",
    "accentColor": "hex string",
    "borderColor": "hex string",
    "fontHeading": "Bare Google Font family name",
    "fontBody": "Bare Google Font family name",
    "cornerRadius": "0px or 8px or 16px",
    "layout": "netflix or substack or genz",
    "tagline": "short optional tagline",
    "playerMode": "auto or audio or video",
    "stickyPlayer": true,
    "showTimestamps": true,
    "hiddenBlocks": ["shorts"]
  },
  "pageLayout": ["hero", "subscribe", "product", "grid", "host", "shorts"],
  "copy": {
    "title": "",
    "tagline": "",
    "description": ""
  },
  "rationale": "one short sentence"
}

Rules:
- Make the homepage feel intentionally designed, not generic SaaS.
- Prefer strong contrast and good readability.
- Keep "copy.description" to max 2 sentences.
- Only include pageLayout blocks from: hero, subscribe, product, grid, host, shorts.
- Use hiddenBlocks when a section does not fit the brief.
- If the podcast appears audio-first, prefer playerMode "audio"; if video-led, prefer "video".
- Use tasteful, modern Google fonts only.
- If the current title already sounds strong, leave copy.title blank.
- Return JSON only.`;

    let contents: any[] = [prompt];

    if (imageBase64) {
        // Extract mime type and base64 data
        const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error('Invalid image format. Expected data:image/...;base64,...');

        const mimeType = match[1];
        const data = match[2];

        contents.push({
            inlineData: {
                data,
                mimeType
            }
        });
    }

    const result = await model.generateContent(contents);

    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to return a valid JSON object');
    
    return JSON.parse(jsonMatch[0]);
}
