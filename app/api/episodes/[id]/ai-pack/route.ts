import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { transcribeAudioUrlWithDeepgram } from '@/lib/ai/deepgram';
import { generateEpisodeLaunchAssetsWithOpenRouter } from '@/lib/ai/openrouter';
import { generateEpisodeThumbnailImage } from '@/lib/ai/openrouterImages';

type GenerateField =
    | 'all'
    | 'transcript'
    | 'chapters'
    | 'youtubeDescription'
    | 'spotifyDescription'
    | 'seoTags'
    | 'thumbnail';

type EpisodeWithPodcast = {
    id: string;
    podcast_id: string;
    title: string | null;
    description: string | null;
    audio_url: string | null;
    transcript_text: string | null;
    transcript: string | null;
    published_at: string | null;
    podcasts: {
        id: string;
        title: string | null;
        description: string | null;
        primary_color: string | null;
        accent_color: string | null;
        theme_config: Record<string, unknown> | null;
        owner_id: string;
    } | null;
};

async function getOwnedEpisode(episodeId: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('episodes')
        .select('id, podcast_id, title, description, audio_url, transcript_text, transcript, published_at, podcasts!inner(id, title, description, primary_color, accent_color, theme_config, owner_id)')
        .eq('id', episodeId)
        .eq('podcasts.owner_id', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as EpisodeWithPodcast | null) || null;
}

function themeColor(themeConfig: Record<string, unknown> | null | undefined, key: string) {
    const value = themeConfig?.[key];
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

function hasExplicitGuestSignal(title: string | null | undefined, prompt: string) {
    return /\b(with|featuring|feat\.?|guest)\b/i.test(`${title || ''} ${prompt}`);
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null) as
        | { field?: GenerateField; draft?: { transcript?: string | null; title?: string | null } }
        | null;
    const field = body?.field || 'all';

    const episode = await getOwnedEpisode(id, user.id);
    if (!episode || !episode.podcasts) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    try {
        const fields: Record<string, unknown> = {};
        let transcriptText = body?.draft?.transcript || episode.transcript || episode.transcript_text || '';
        const draftTitle = body?.draft?.title || episode.title || 'Untitled episode';

        if ((field === 'all' || field === 'transcript') && !transcriptText && episode.audio_url) {
            const transcript = await transcribeAudioUrlWithDeepgram(episode.audio_url);
            transcriptText = transcript.transcriptText;
            fields.transcript = transcript.transcriptText;
        } else if (field === 'transcript') {
            fields.transcript = transcriptText;
        }

        if (field !== 'transcript') {
            const launchKit = await generateEpisodeLaunchAssetsWithOpenRouter({
                podcastTitle: episode.podcasts.title || 'Podcast',
                podcastDescription: episode.podcasts.description || '',
                episodeTitle: draftTitle,
                episodeDescription: episode.description || '',
                transcriptText,
                publishedAt: episode.published_at,
            });

            const assets = launchKit.assets;

            if (field === 'all' || field === 'chapters') fields.timestamps = assets.timestamps;
            if (field === 'all' || field === 'youtubeDescription') fields.youtubeDescription = assets.platformDescriptions.youtube;
            if (field === 'all' || field === 'spotifyDescription') fields.spotifyDescription = assets.platformDescriptions.spotify;
            if (field === 'all' || field === 'seoTags') fields.seoTags = assets.seoTags?.keywords?.length ? assets.seoTags.keywords : assets.tags;

            if (field === 'all' || field === 'thumbnail') {
                const brief = assets.thumbnailBriefs[0];
                if (brief?.prompt) {
                    const generated = await generateEpisodeThumbnailImage({
                        prompt: brief.prompt,
                        overlayText: brief.overlayText,
                        episodeTitle: draftTitle,
                        podcastTitle: episode.podcasts.title || 'Podcast',
                        primaryColor: episode.podcasts.primary_color || themeColor(episode.podcasts.theme_config, 'primaryColor'),
                        accentColor: episode.podcasts.accent_color || themeColor(episode.podcasts.theme_config, 'accentColor'),
                        hasGuest: hasExplicitGuestSignal(draftTitle, brief.prompt),
                    });
                    const storagePath = `${episode.podcast_id}/${episode.id}/${crypto.randomUUID()}.png`;
                    const { error: uploadError } = await supabase.storage
                        .from('episode-thumbnails')
                        .upload(storagePath, generated.bytes, {
                            contentType: generated.mimeType,
                            upsert: false,
                        });

                    if (uploadError) throw new Error(uploadError.message);

                    const { data: publicUrlData } = supabase.storage
                        .from('episode-thumbnails')
                        .getPublicUrl(storagePath);

                    fields.thumbnailUrl = publicUrlData.publicUrl;
                }
            }
        }

        return NextResponse.json({ fields });
    } catch (error: unknown) {
        console.error('Episode AI pack generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Could not generate episode content.' },
            { status: 500 },
        );
    }
}
