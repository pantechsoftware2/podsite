'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ActivePodcastSync({
  podcastId,
  youtubeChannelId,
}: {
  podcastId: string;
  youtubeChannelId: string | null;
}) {
  const [channelId, setChannelId] = useState(youtubeChannelId || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSync = async () => {
    if (!channelId) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/youtube-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podcastId,
          channelId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Sync failed');
      }

      setMessage(
        json.matchedCount > 0
          ? `Success! Found ${json.matchedCount} pending matches. Go to Video Sync to approve them.`
          : `Success: Checked for matches but found 0 new syncs.`
      );
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[2.5rem] bg-zinc-950 p-8 border-4 border-white/5 shadow-2xl transition-all hover:border-[var(--podcast-primary)]/50">
      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--podcast-primary)] mb-2 italic">
        YouTube Sync
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-tighter">
        Link your channel & automate video matching.
      </p>
      <div className="mt-8 space-y-4">
        <input
          type="text"
          placeholder="Channel ID (UC...)"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="w-full rounded-2xl border-2 border-white/5 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-zinc-700 focus:border-[var(--podcast-primary)]/50 focus:outline-none focus:ring-4 focus:ring-[var(--podcast-primary)]/10 transition-all font-bold"
        />
        <button
          onClick={onSync}
          disabled={loading || !channelId}
          className="w-full rounded-2xl bg-zinc-900 py-4 text-xs font-black uppercase tracking-[0.2em] text-white border-2 border-white/10 transition-all hover:bg-[var(--podcast-primary)] hover:text-black hover:border-transparent active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Connect Channel'}
        </button>
        {message && (
          <p className={`text-[10px] font-black uppercase tracking-widest text-center mt-2 ${message.includes('Success') ? 'text-emerald-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
