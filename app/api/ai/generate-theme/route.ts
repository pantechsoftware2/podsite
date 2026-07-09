import { NextResponse } from 'next/server';
import { generateSiteBlueprint } from '@/lib/ai/gemini';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { fetchWebsiteSignals } from '@/lib/ai/siteSignals';
import {
    autoBrandToThemeConfig,
    generateAutoBrandIdentityWithOpenRouter,
} from '@/lib/ai/openrouter';
import { generatePodcastLogoImage } from '@/lib/ai/openrouterImages';
import { extractColorsFromImage } from '@/lib/utils/colorUtils';
import type { ThemeConfig } from '@/components/ThemeEngine';

function sanitizePageLayout(input: unknown) {
    const allowed = new Set(['hero', 'subscribe', 'product', 'grid', 'host', 'shorts']);
    const raw = Array.isArray(input) ? input : [];
    const cleaned = raw.filter((item): item is string => typeof item === 'string' && allowed.has(item));
    return cleaned.length ? Array.from(new Set(cleaned)) : ['hero', 'subscribe', 'product', 'grid', 'host', 'shorts'];
}

function shortDescription(input: string | null | undefined) {
    return (input || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
}

function extensionForMime(mimeType: string) {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';
}

async function getOwnedPodcast(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    podcastId: unknown,
    userId: string,
) {
    if (typeof podcastId !== 'string' || !podcastId) return null;

    const { data, error } = await supabase
        .from('podcasts')
        .select('id, owner_id, title, description, theme_config, page_layout')
        .eq('id', podcastId)
        .eq('owner_id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

async function uploadPodcastLogo(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    podcastId: string,
    generated: Awaited<ReturnType<typeof generatePodcastLogoImage>>,
) {
    const extension = extensionForMime(generated.mimeType);
    const storagePath = `${podcastId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
        .from('podcast-logos')
        .upload(storagePath, generated.bytes, {
            contentType: generated.mimeType,
            upsert: false,
        });

    if (uploadError) {
        throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
        .from('podcast-logos')
        .getPublicUrl(storagePath);

    return data.publicUrl;
}

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const {
            image,
            prompt,
            websiteUrl,
            questionnaire,
            podcastId,
            podcastTitle,
            podcastDescription,
            podcastTagline,
            genre,
            magicTheme,
            imageUrl,
            artworkDominantColors,
        } = await req.json();

        const ownedPodcast = await getOwnedPodcast(supabase, podcastId, user.id);
        const existingThemeConfig = (ownedPodcast?.theme_config || {}) as ThemeConfig;
        const effectiveTitle = podcastTitle || ownedPodcast?.title || 'Untitled podcast';
        const effectiveDescription = podcastDescription || ownedPodcast?.description || '';
        const effectiveImageUrl = imageUrl || existingThemeConfig.imageUrl || null;
        const hasInput = Boolean(image || prompt || websiteUrl || questionnaire);
        const shouldAutoBrand = Boolean(magicTheme) || !hasInput;

        if (!hasInput && !shouldAutoBrand) {
            return NextResponse.json({ error: 'Add inspiration, a prompt, or a website URL first.' }, { status: 400 });
        }

        if (shouldAutoBrand) {
            let dominantColors = Array.isArray(artworkDominantColors)
                ? artworkDominantColors.filter((color): color is string => typeof color === 'string')
                : [];

            if (!dominantColors.length && effectiveImageUrl) {
                try {
                    const extracted = await extractColorsFromImage(effectiveImageUrl);
                    dominantColors = [extracted.primary, extracted.accent, extracted.background];
                } catch (error) {
                    console.warn('Artwork color extraction failed during Magic Theme', error);
                }
            }

            const brand = await generateAutoBrandIdentityWithOpenRouter({
                title: effectiveTitle,
                description: effectiveDescription,
                genre: genre || 'general',
                hasArtwork: Boolean(effectiveImageUrl),
                artworkDominantColors: dominantColors,
            });
            const generatedTheme = autoBrandToThemeConfig(brand.identity);
            const nextThemeConfig: ThemeConfig = {
                ...existingThemeConfig,
                ...generatedTheme,
                brandMood: brand.identity.mood,
                generatedRationale: generatedTheme.generatedRationale,
            };

            let generatedLogoUrl: string | null = null;
            if (!effectiveImageUrl && ownedPodcast?.id) {
                const generatedLogo = await generatePodcastLogoImage({
                    title: effectiveTitle,
                    description: shortDescription(effectiveDescription),
                    mood: brand.identity.mood,
                    primaryColor: brand.identity.primaryColor,
                    accentColor: brand.identity.accentColor,
                    backgroundColor: brand.identity.backgroundColor,
                });
                generatedLogoUrl = await uploadPodcastLogo(supabase, ownedPodcast.id, generatedLogo);
                nextThemeConfig.imageUrl = generatedLogoUrl;
            } else if (effectiveImageUrl) {
                nextThemeConfig.imageUrl = effectiveImageUrl;
            }

            const pageLayout = sanitizePageLayout(ownedPodcast?.page_layout);

            if (ownedPodcast?.id) {
                await supabase
                    .from('podcasts')
                    .update({
                        theme_config: nextThemeConfig,
                        page_layout: pageLayout,
                        ai_brand: {
                            ...brand.identity,
                            imageUrl: nextThemeConfig.imageUrl || null,
                            model: brand.model,
                            generatedAt: new Date().toISOString(),
                        },
                        ai_brand_status: 'done',
                    })
                    .eq('id', ownedPodcast.id)
                    .eq('owner_id', user.id);
            }

            return NextResponse.json({
                themeConfig: nextThemeConfig,
                pageLayout,
                copy: {
                    title: effectiveTitle,
                    tagline: existingThemeConfig.tagline,
                    description: effectiveDescription,
                },
                rationale: generatedTheme.generatedRationale,
                brandIdentity: brand.identity,
                logoUrl: generatedLogoUrl,
                websiteContext: null,
            });
        }

        const websiteContext = websiteUrl ? await fetchWebsiteSignals(String(websiteUrl)) : null;
        const brandBriefParts = [
            prompt ? `Founder direction: ${prompt}` : null,
            questionnaire?.mood ? `Desired mood: ${questionnaire.mood}` : null,
            questionnaire?.energy ? `Energy: ${questionnaire.energy}` : null,
            questionnaire?.structure ? `Homepage personality: ${questionnaire.structure}` : null,
            questionnaire?.contentFocus ? `Content emphasis: ${questionnaire.contentFocus}` : null,
            questionnaire?.audience ? `Audience: ${questionnaire.audience}` : null,
            questionnaire?.mustAvoid ? `Avoid: ${questionnaire.mustAvoid}` : null,
            websiteContext?.title ? `Reference website title: ${websiteContext.title}` : null,
            websiteContext?.description ? `Reference website description: ${websiteContext.description}` : null,
            websiteContext?.themeColor ? `Reference website theme color: ${websiteContext.themeColor}` : null,
            websiteContext?.url ? `Reference website URL: ${websiteContext.url}` : null,
            websiteContext?.navItems?.length ? `Reference navigation: ${websiteContext.navItems.join(', ')}` : null,
            websiteContext?.sectionHeadings?.length ? `Reference sections: ${websiteContext.sectionHeadings.join(' | ')}` : null,
        ].filter(Boolean).join('\n');

        const blueprint = await generateSiteBlueprint({
            imageBase64: image || websiteContext?.imageBase64 || null,
            userText: brandBriefParts,
            podcastTitle: effectiveTitle,
            podcastDescription: effectiveDescription,
            podcastTagline,
            websiteContext: websiteContext
                ? JSON.stringify({
                    url: websiteContext.url,
                    title: websiteContext.title,
                    description: websiteContext.description,
                    themeColor: websiteContext.themeColor,
                    navItems: websiteContext.navItems,
                    sectionHeadings: websiteContext.sectionHeadings,
                    internalPages: websiteContext.internalPages,
                    platformLinks: websiteContext.platformLinks,
                    fontHints: websiteContext.fontHints,
                    colorHints: websiteContext.colorHints,
                })
                : undefined,
        });

        const themeConfig = blueprint.themeConfig || {};
        const pageLayout = sanitizePageLayout(blueprint.pageLayout);

        return NextResponse.json({
            themeConfig,
            pageLayout,
            copy: blueprint.copy || {},
            rationale: blueprint.rationale || '',
            websiteContext: websiteContext
                ? {
                    url: websiteContext.url,
                    title: websiteContext.title,
                    description: websiteContext.description,
                    themeColor: websiteContext.themeColor,
                    ogImageUrl: websiteContext.ogImageUrl,
                }
                : null,
        });
    } catch (error: unknown) {
        console.error('Vision AI Error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate theme from image'
        }, { status: 500 });
    }
}
