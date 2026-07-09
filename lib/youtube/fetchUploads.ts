export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds?: number | null;
};

export async function fetchChannelUploads(
  apiKey: string,
  channelId: string,
  maxResults = 100,
): Promise<YouTubeVideo[]> {
  // 1) Get uploads playlist for channel
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
    { cache: 'no-store' },
  );

  if (!channelRes.ok) return [];

  const channelJson = await channelRes.json();
  const uploadsPlaylistId =
    channelJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  // 2) Get videos from uploads playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`,
    { cache: 'no-store' },
  );

  if (!playlistRes.ok) return [];

  const playlistJson = await playlistRes.json();

  interface YouTubeItem {
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      description: string;
      publishedAt: string;
    };
  }

  let videos: YouTubeVideo[] =
    (playlistJson.items as YouTubeItem[])?.map((item: YouTubeItem) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    })) ?? [];

  // Fetch durations (contentDetails.duration is ISO 8601 e.g. PT45M30S)
  if (videos.length > 0) {
    const idList = videos.map((v) => v.id);
    const durationMap = await fetchVideoDurations(apiKey, idList);
    videos = videos.map((v) => ({
      ...v,
      durationSeconds: durationMap.get(v.id) ?? null,
    }));
  }

  return videos;
}

/** Parse ISO 8601 duration (e.g. PT1H2M10S) to seconds */
export function parseISO8601Duration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h || '0', 10) * 3600) + (parseInt(m || '0', 10) * 60) + parseInt(s || '0', 10);
}

/** Fetch duration in seconds for video IDs (batch of 50). */
export async function fetchVideoDurations(
  apiKey: string,
  videoIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const batch = videoIds.slice(0, 50);
  if (batch.length === 0) return map;

  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return map;

  const json = await res.json();
  const items = (json.items as { id: string; contentDetails?: { duration?: string } }[]) ?? [];
  for (const item of items) {
    const dur = item.contentDetails?.duration;
    if (dur) map.set(item.id, parseISO8601Duration(dur));
  }
  return map;
}
