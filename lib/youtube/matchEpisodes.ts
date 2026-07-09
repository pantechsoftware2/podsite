// lib/youtube/matchEpisodes.ts
import type { YouTubeVideo } from './fetchUploads';

const STOP_WORDS = new Set([
  'the', 'and', 'a', 'an', 'in', 'on', 'at', 'with', 'to', 'for', 'of', 'from', 'is', 'it', 'this', 'that',
  'episode', 'ep', 'podcast', 'video', 'show', 'audio', 'official', 'part', 'pt',
]);

function getWords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

export type EpisodeForMatch = {
  id: string;
  title: string | null;
  published_at: string | null;
  duration_seconds?: number | null;
};

export type MatchResult = {
  episodeId: string;
  videoId: string;
  score: number; // 0–100, only matches with score > 70 are returned
};

// Score: date 30 pts, title 40 pts, duration 30 pts. > 70 auto-match, 40–70 suggest, < 40 ignore.
function scoreMatch(
  ep: EpisodeForMatch,
  vid: YouTubeVideo,
): number {
  let datePoints = 0;
  if (ep.published_at && vid.publishedAt) {
    const diffHours = Math.abs(new Date(ep.published_at).getTime() - new Date(vid.publishedAt).getTime()) / (1000 * 60 * 60);
    if (diffHours <= 48) datePoints = 30;
    else if (diffHours <= 168) datePoints = Math.max(0, 30 - (diffHours - 48) / 4);
  }

  let titlePoints = 0;
  if (ep.title && vid.title) {
    const epWords = getWords(ep.title);
    const vidWords = new Set(getWords(vid.title));
    if (epWords.length > 0) {
      const overlap = epWords.filter((w) => vidWords.has(w)).length;
      titlePoints = (overlap / epWords.length) * 40;
    }
  }

  let durationPoints = 0;
  const epDur = ep.duration_seconds ?? 0;
  const vidDur = vid.durationSeconds ?? 0;
  if (epDur > 0 && vidDur > 0) {
    const ratio = Math.min(epDur, vidDur) / Math.max(epDur, vidDur);
    durationPoints = ratio >= 0.9 ? 30 : ratio >= 0.5 ? ratio * 30 : 0;
  }

  return datePoints + titlePoints + durationPoints;
}

export function matchEpisodesToVideos(
  episodes: EpisodeForMatch[],
  videos: YouTubeVideo[],
): MatchResult[] {
  if (!episodes.length || !videos.length) return [];

  const results: MatchResult[] = [];
  const usedVideoIds = new Set<string>();
  const MAX_LINKS = 100;

  for (const ep of episodes) {
    if (!ep.title) continue;

    let best: { videoId: string; score: number } | null = null;

    for (const vid of videos) {
      if (usedVideoIds.has(vid.id)) continue;
      const score = scoreMatch(ep, vid);
      if (score < 40) continue; // ignore
      if (!best || score > best.score) best = { videoId: vid.id, score };
    }

    // Only auto-match when score > 70
    if (best && best.score > 70) {
      results.push({ episodeId: ep.id, videoId: best.videoId, score: best.score });
      usedVideoIds.add(best.videoId);
      if (results.length >= MAX_LINKS) break;
    }
  }

  return results;
}
