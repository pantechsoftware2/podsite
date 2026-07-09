'use client';

import { useState } from 'react';

export function RssForm() {
  const [rssUrl, setRssUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/rss-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rssUrl }),
      });

      console.log('rss-sync status', res.status);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }

      setMessage(`RSS synced successfully. Podcast ID: ${data.podcastId}`);
    } catch (err: any) {
      console.error('rss-sync error', err);
      setMessage(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync}>
      <label>RSS Feed URL</label>
      <input
        type="url"
        value={rssUrl}
        onChange={(e) => setRssUrl(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Syncing...' : 'Sync RSS'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
