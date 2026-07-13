import { createSupabaseServerClient } from '@/lib/supabaseServer';
import {
    generateAndSaveThumbnail,
    generateAndSaveSeoTags,
    generateAndSaveSpotifyDescription,
    generateAndSaveTimestamps,
    generateAndSaveYoutubeDescription,
    generateLaunchAssetsForEpisode,
    getOwnedEpisode,
    transcribeEpisode,
    type OwnedEpisode,
} from '@/lib/ai/apiRouteActions';

function sse(event: string, data: Record<string, unknown>) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response(sse('error', { error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }

    const body = await req.json().catch(() => null) as { episodeId?: unknown } | null;

    let episode: OwnedEpisode;
    try {
        episode = await getOwnedEpisode(supabase, body?.episodeId, user.id);
    } catch (error) {
        return new Response(
            sse('error', { error: error instanceof Error ? error.message : 'Episode not found' }),
            {
                status: 404,
                headers: { 'Content-Type': 'text/event-stream' },
            },
        );
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const send = (event: string, data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(sse(event, data)));
            };

            try {
                send('progress', { step: 'transcribe', status: 'started' });
                if (!episode.transcript && !episode.transcript_text) {
                    const transcript = await transcribeEpisode(supabase, episode);
                    episode = {
                        ...episode,
                        transcript: transcript.transcriptText,
                        transcript_text: transcript.transcriptText,
                    };
                }
                send('progress', { step: 'transcribe', status: 'done' });

                send('progress', { step: 'timestamps', status: 'started' });
                const timestamps = await generateAndSaveTimestamps(supabase, episode);
                episode = { ...episode, timestamps };
                send('progress', { step: 'timestamps', status: 'done', timestamps });

                send('progress', { step: 'youtubeDescription', status: 'started' });
                const youtubeDescription = await generateAndSaveYoutubeDescription(supabase, episode);
                send('progress', { step: 'youtubeDescription', status: 'done', description: youtubeDescription });

                send('progress', { step: 'spotifyDescription', status: 'started' });
                const spotifyDescription = await generateAndSaveSpotifyDescription(supabase, episode);
                send('progress', { step: 'spotifyDescription', status: 'done', description: spotifyDescription });

                send('progress', { step: 'seoTags', status: 'started' });
                const tags = await generateAndSaveSeoTags(supabase, episode);
                send('progress', { step: 'seoTags', status: 'done', tags });

                send('progress', { step: 'thumbnail', status: 'started' });
                const launchKit = await generateLaunchAssetsForEpisode(
                    episode,
                    episode.transcript || episode.transcript_text || '',
                );
                const thumbnailUrl = await generateAndSaveThumbnail(supabase, episode, launchKit);
                send('progress', { step: 'thumbnail', status: 'done', thumbnailUrl });

                send('done', {
                    status: 'complete',
                    episodeId: episode.id,
                    transcript: episode.transcript || episode.transcript_text || '',
                    timestamps,
                    youtubeDescription,
                    spotifyDescription,
                    tags,
                    thumbnailUrl,
                });
            } catch (error) {
                send('error', {
                    error: error instanceof Error ? error.message : 'Full AI generation failed',
                });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
