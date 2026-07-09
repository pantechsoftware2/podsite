export type TranscriptCandidate = {
  url: string | null;
  type: string | null;
};

function stripTranscriptNoise(input: string) {
  return input
    .replace(/^WEBVTT[\s\S]*?\n{2,}/i, '')
    .replace(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, '')
    .replace(/^\d+$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function transcriptFromJson(input: string) {
  try {
    const parsed = JSON.parse(input);
    const segments = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.segments)
        ? parsed.segments
        : Array.isArray(parsed.transcript)
          ? parsed.transcript
          : [];

    const text = segments
      .map((segment: unknown) => {
        if (typeof segment === 'string') return segment;
        if (segment && typeof segment === 'object' && 'text' in segment) {
          return String((segment as { text?: unknown }).text || '');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    return text || null;
  } catch {
    return null;
  }
}

export function normalizeTranscriptText(input: string, type?: string | null) {
  if (!input.trim()) return null;

  if (/json/i.test(type || '')) {
    const jsonText = transcriptFromJson(input);
    if (jsonText) return stripTranscriptNoise(jsonText);
  }

  return stripTranscriptNoise(input);
}

export function extractTranscriptCandidate(raw: unknown): TranscriptCandidate {
  const candidates = Array.isArray(raw) ? raw : raw ? [raw] : [];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === 'string') {
      return { url: candidate, type: null };
    }

    if (typeof candidate !== 'object') continue;

    const record = candidate as Record<string, unknown>;
    const attrs = (record.$ || record) as Record<string, unknown>;
    const url = attrs.url || attrs.href || record.url || record.href;
    const type = attrs.type || record.type || attrs.mime_type || record.mime_type;

    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      return {
        url,
        type: typeof type === 'string' ? type : null,
      };
    }
  }

  return { url: null, type: null };
}

export async function fetchTranscriptText(candidate: TranscriptCandidate) {
  if (!candidate.url) return null;

  const response = await fetch(candidate.url, {
    headers: {
      Accept: 'text/plain, text/vtt, application/json, application/x-subrip, text/html, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; PodSiteKiller/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Transcript fetch failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  return normalizeTranscriptText(body, candidate.type || response.headers.get('content-type'));
}
