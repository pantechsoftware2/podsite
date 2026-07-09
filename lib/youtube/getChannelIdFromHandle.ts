// lib/youtube/getChannelIdFromHandle.ts
const CHANNELS_API = 'https://www.googleapis.com/youtube/v3/channels';

export async function getChannelIdFromHandle(
  handle: string,
  apiKey: string,
): Promise<string | null> {
  const url = new URL(CHANNELS_API);
  url.searchParams.set('part', 'id');
  url.searchParams.set('forHandle', handle.startsWith('@') ? handle : `@${handle}`);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  console.log('getChannelIdFromHandle raw json', data);

  if (!res.ok) {
    const msg = data?.error?.message || '';
    throw new Error(`YouTube channels error: ${res.status} ${msg}`.trim());
  }

  const items = data.items ?? [];
  if (!items.length) return null;

  return items[0].id as string; // channelId
}
