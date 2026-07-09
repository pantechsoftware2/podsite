/**
 * YouTube Shorts Fetching Logic
 */

export async function fetchShorts(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY missing');
    return [];
  }

  try {
    // 1. Fetch recent videos from the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=20&type=video`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // 2. Fetch video details to check duration
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,snippet`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (!detailsData.items) return [];

    // 3. Filter for Shorts (duration < 60s)
    // ISO 8601 duration parser (simple version for PTxxS or PT1MxxS)
    const parseDuration = (duration: string) => {
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const minutes = parseInt(match[1] || '0');
      const seconds = parseInt(match[2] || '0');
      return minutes * 60 + seconds;
    };

    const shorts = detailsData.items
      .filter((item: any) => parseDuration(item.contentDetails.duration) <= 61) // Allowing 1s buffer
      .map((item: any) => {
        const durationSeconds = parseDuration(item.contentDetails.duration);
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        const formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

        return {
          youtube_video_id: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          published_at: item.snippet.publishedAt,
          duration: formattedDuration
        };
      });

    return shorts;
  } catch (error) {
    console.error('Error fetching YouTube Shorts:', error);
    return [];
  }
}
