import { DeepgramClient, type Deepgram } from '@deepgram/sdk';

export type DeepgramTranscriptResult = {
    model: string;
    transcriptText: string;
};

function formatSpeakerLabel(speaker: number | undefined) {
    return typeof speaker === 'number' ? `Speaker ${speaker + 1}` : 'Speaker';
}

function transcriptFromUtterances(results: Deepgram.ListenV1ResponseResults) {
    const utterances = results.utterances || [];

    if (!utterances.length) return null;

    return utterances
        .map((utterance) => {
            const transcript = utterance.transcript?.trim();
            if (!transcript) return null;

            return `${formatSpeakerLabel(utterance.speaker)}: ${transcript}`;
        })
        .filter(Boolean)
        .join('\n\n');
}

function transcriptFromParagraphs(results: Deepgram.ListenV1ResponseResults) {
    const alternative = results.channels?.[0]?.alternatives?.[0];
    const paragraphs = alternative?.paragraphs?.paragraphs || [];

    if (paragraphs.length) {
        return paragraphs
            .map((paragraph) => {
                const text = paragraph.sentences
                    ?.map((sentence) => sentence.text?.trim())
                    .filter(Boolean)
                    .join(' ');

                if (!text) return null;

                return typeof paragraph.speaker === 'number'
                    ? `${formatSpeakerLabel(paragraph.speaker)}: ${text}`
                    : text;
            })
            .filter(Boolean)
            .join('\n\n');
    }

    return alternative?.paragraphs?.transcript?.trim() || null;
}

function transcriptFromAlternatives(results: Deepgram.ListenV1ResponseResults) {
    return results.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || null;
}

export async function transcribeAudioUrlWithDeepgram(audioUrl: string): Promise<DeepgramTranscriptResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
        throw new Error('DEEPGRAM_API_KEY is required for Deepgram transcription.');
    }

    const model = process.env.DEEPGRAM_MODEL || 'nova-3';
    const client = new DeepgramClient({ apiKey });
    const result = await client.listen.v1.media.transcribeUrl(
        {
            url: audioUrl,
            model,
            smart_format: true,
            diarize: true,
            paragraphs: true,
            punctuate: true,
            utterances: true,
        },
        {
            timeoutInSeconds: Number.parseInt(process.env.DEEPGRAM_TIMEOUT_SECONDS || '600', 10),
        },
    );

    if (!('results' in result)) {
        throw new Error('Deepgram returned an async response instead of a completed transcript.');
    }

    const transcriptText =
        transcriptFromParagraphs(result.results) ||
        transcriptFromUtterances(result.results) ||
        transcriptFromAlternatives(result.results);

    if (!transcriptText) {
        throw new Error('Deepgram completed transcription but returned no transcript text.');
    }

    return {
        model,
        transcriptText,
    };
}
