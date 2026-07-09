// lib/youtube.ts

export type YoutubeVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
};

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YOUTUBE_API_KEY');
}

const YT_API_KEY: string = YOUTUBE_API_KEY;

export async function fetchLatestVideos(channelId: string): Promise<YoutubeVideo[]> {
  // 1) Get uploads playlist id
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`,
  );
  if (!chRes.ok) {
    const text = await chRes.text();
    throw new Error(`Failed to fetch channel: ${chRes.status} ${text}`);
  }

  const chJson = await chRes.json();
  const uploadsPlaylist =
    chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) return [];

  // 2) Get last 50 videos from uploads playlist
  const plRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=50&key=${YT_API_KEY}`,
  );
  if (!plRes.ok) {
    const text = await plRes.text();
    throw new Error(`Failed to fetch playlist: ${plRes.status} ${text}`);
  }

  const plJson = await plRes.json();

  const videos: YoutubeVideo[] = (plJson.items ?? []).map((it: any) => ({
    videoId: it.snippet.resourceId.videoId,
    title: it.snippet.title,
    publishedAt: it.snippet.publishedAt,
  }));

  return videos;
}

// simple similarity: Jaccard over word sets
function titleSimilarity(a: string, b: string): number {
  const aWords = new Set(
    a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean),
  );
  const bWords = new Set(
    b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean),
  );
  if (!aWords.size || !bWords.size) return 0;

  let intersection = 0;
  for (const w of aWords) {
    if (bWords.has(w)) intersection += 1;
  }
  const union = aWords.size + bWords.size - intersection;
  return intersection / union;
}

export function matchEpisodesToVideos(
  episodes: { id: string; title: string }[],
  videos: YoutubeVideo[],
): { episodeId: string; videoId: string; score: number }[] {
  const results: { episodeId: string; videoId: string; score: number }[] = [];

  for (const ep of episodes) {
    const candidates = videos.map((v) => ({
      videoId: v.videoId,
      score: titleSimilarity(ep.title, v.title),
    }));

    const best = candidates.sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 0.5) {
      results.push({ episodeId: ep.id, videoId: best.videoId, score: best.score });
    }
  }

  return results;
}
