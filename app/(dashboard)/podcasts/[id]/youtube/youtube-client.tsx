// app/(dashboard)/podcasts/[id]/youtube/youtube-client.tsx
'use client';

import { useState } from 'react';

export function YoutubeSyncClient({ podcastId }: { podcastId: string }) {
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/youtube-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podcastId,
          youtubeChannelId: channelId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          `ERROR: ${
            data.error || 'YouTube sync failed'
          } | bodySeenByServer=${JSON.stringify(data.bodySeenByServer)}`,
        );
      } else {
        setMessage(
          `Connected: podcastId=${data.receivedPodcastId}, channelId=${data.receivedChannelId}`,
        );
      }
    } catch (err: any) {
      setMessage(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 className="text-sm font-semibold text-slate-100">
        YouTube channel
      </h2>
      <p className="text-xs text-slate-400">
        Paste your channel ID (for example{' '}
        <code>UCkdnY2hNC0sdlVXPtWuNQ8g</code>).
      </p>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="text"
          required
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="UCkdnY2hNC0sdlVXPtWuNQ8g"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? 'Syncing…' : 'Sync YouTube'}
        </button>
      </form>
      {message && (
        <p className="text-[11px] text-slate-400">
          {message}
        </p>
      )}
    </section>
  );
}
