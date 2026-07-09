'use client';

import { useState } from 'react';

export function YoutubeForm({ podcastId }: { podcastId: string }) {
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/youtube-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, youtubeChannelId: channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(`Synced. Matched ${data.matchesCount} episodes.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync}>
      <label>YouTube Channel ID</label>
      <input
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Syncing...' : 'Sync YouTube'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
