// app/ui/PodcastCard.tsx (example)
'use client';

import { useState } from 'react';

type PodcastCardProps = {
  id: string;
  title: string;
  description: string | null;
  rssUrl: string | null;
  youtubeChannelId: string | null;
};
 
export function PodcastCard({
  id,
  title,
  description,
  rssUrl,
  youtubeChannelId: initialYoutubeChannelId,
}: PodcastCardProps) {
  const [youtubeChannelId, setYoutubeChannelId] = useState(
    initialYoutubeChannelId ?? '',
  );
  const [syncingRss, setSyncingRss] = useState(false);
  const [syncingYoutube, setSyncingYoutube] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSyncRss() {
    setSyncingRss(true);
    setMessage(null);
    try {
      const res = await fetch('/api/cron/rss');
      const json = await res.json();
      setMessage(json.message || 'RSS sync done');
    } catch (err: any) {
      setMessage(err?.message || 'RSS sync failed');
    } finally {
      setSyncingRss(false);
    }
  }

  async function handleSyncYoutube() {
    if (!youtubeChannelId) {
      setMessage('Please enter a YouTube channel ID (starts with UC...)');
      return;
    }

    setSyncingYoutube(true);
    setMessage(null);

    try {
      const res = await fetch('/api/youtube-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId: id, youtubeChannelId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'YouTube sync failed');
      } else {
        setMessage(`YouTube sync ok. Matches: ${json.matchesCount}`);
      }
    } catch (err: any) {
      setMessage(err?.message || 'YouTube sync failed');
    } finally {
      setSyncingYoutube(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-300 line-clamp-3">
          {description}
        </p>
      )}
      {rssUrl && (
        <p className="mt-1 text-xs text-slate-500">
          RSS: {rssUrl}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 text-sm">
        <label className="text-xs text-slate-400">
          YouTube channel ID (starts with UC...)
          <input
            value={youtubeChannelId}
            onChange={(e) => setYoutubeChannelId(e.target.value)}
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
            className="mt-1 w-full rounded bg-slate-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncRss}
            disabled={syncingRss}
            className="rounded bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600 disabled:opacity-60"
          >
            {syncingRss ? 'Syncing RSS…' : 'Sync RSS'}
          </button>

          <button
            onClick={handleSyncYoutube}
            disabled={syncingYoutube}
            className="rounded bg-sky-400 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-sky-300 disabled:opacity-60"
          >
            {syncingYoutube ? 'Syncing YouTube…' : 'Sync YouTube'}
          </button>
        </div>

        {message && (
          <p className="mt-1 text-xs text-slate-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
