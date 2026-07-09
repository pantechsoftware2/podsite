import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { generateWebsiteSeoWithOpenRouter } from '@/lib/ai/openrouter';
import { buildCanonicalUrl, inferHostName } from '@/lib/publicSite';
import type { ThemeConfig } from '@/components/ThemeEngine';

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { podcastId, siteUrl } = await req.json();

        if (typeof podcastId !== 'string' || !podcastId) {
            return NextResponse.json({ error: 'podcastId is required' }, { status: 400 });
        }

        const { data: podcast, error: podcastError } = await supabase
            .from('podcasts')
            .select('id, owner_id, title, description, rss_url, custom_domain, theme_config')
            .eq('id', podcastId)
            .eq('owner_id', user.id)
            .maybeSingle();

        if (podcastError) throw new Error(podcastError.message);
        if (!podcast) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        const [{ count }, { data: latestEpisodes, error: episodesError }] = await Promise.all([
            supabase
                .from('episodes')
                .select('id', { count: 'exact', head: true })
                .eq('podcast_id', podcast.id),
            supabase
                .from('episodes')
                .select('title')
                .eq('podcast_id', podcast.id)
                .order('published_at', { ascending: false })
                .limit(5),
        ]);

        if (episodesError) throw new Error(episodesError.message);

        const themeConfig = (podcast.theme_config || {}) as ThemeConfig;
        const rssUrl = themeConfig.rssUrlOverride || podcast.rss_url || null;
        const canonicalSiteUrl = typeof siteUrl === 'string' && siteUrl.trim()
            ? siteUrl.trim()
            : await buildCanonicalUrl(podcast, podcast.id);
        const hostName = inferHostName({
            title: podcast.title,
            description: podcast.description,
            theme_config: themeConfig,
        });

        const generated = await generateWebsiteSeoWithOpenRouter({
            title: podcast.title || 'Untitled podcast',
            hostName,
            description: podcast.description || '',
            episodeCount: count || 0,
            latestEpisodeTitles: (latestEpisodes || [])
                .map((episode) => typeof episode.title === 'string' ? episode.title : '')
                .filter(Boolean),
            rssUrl,
            siteUrl: canonicalSiteUrl,
        });

        const websiteSeo = {
            ...generated.seo,
            generatedAt: new Date().toISOString(),
            model: generated.model,
        };

        const { error: updateError } = await supabase
            .from('podcasts')
            .update({
                theme_config: {
                    ...themeConfig,
                    websiteSeo,
                },
            })
            .eq('id', podcast.id)
            .eq('owner_id', user.id);

        if (updateError) throw new Error(updateError.message);

        return NextResponse.json({
            ok: true,
            websiteSeo,
        });
    } catch (error: unknown) {
        console.error('Magic SEO error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate SEO settings',
        }, { status: 500 });
    }
}
