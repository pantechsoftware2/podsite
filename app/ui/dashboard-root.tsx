// app/ui/dashboard-root.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Podcast = {
  id: string;
  title: string | null;
  description: string | null;
  rss_url: string | null;
};

export default function DashboardRoot() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [youtubeChannelId, setYoutubeChannelId] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard/podcasts');
        const json = await res.json();
        setPodcasts(json.podcasts || []);
      } catch (err) {
        console.error(err);
        setMessage('Failed to load podcasts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function syncRss() {
    setMessage('Syncing RSS…');
    try {
      const res = await fetch('/api/cron/rss');
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'RSS sync failed');
      } else {
        setMessage(
          json.message || 'RSS synced (episodes pulled from all podcasts).',
        );
      }
    } catch (err) {
      console.error(err);
      setMessage('RSS sync failed (network error)');
    }
  }

  async function syncYoutube(podcastId: string) {
    const channelId = youtubeChannelId[podcastId];
    if (!channelId) {
      setMessage('Enter YouTube Channel ID');
      return;
    }

    setMessage('Syncing YouTube…');
    try {
      const res = await fetch('/api/youtube-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId, youtubeChannelId: channelId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'YouTube sync failed');
      } else {
        setMessage(
          `YouTube synced (${json.matchesCount ?? 0} episodes linked to videos).`,
        );
      }
    } catch (err) {
      console.error(err);
      setMessage('YouTube sync failed (network error)');
    }
  }

  const filtered = podcasts.filter((p) =>
    [p.title, p.description, p.id]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const active = filtered[0];

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050816] text-white">
        <p className="text-sm text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-slate-100">
      {/* subtle gradient */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              PodSite-Killer
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Dashboard</h1>
          </div>
          <button className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-300">
            New podcast
          </button>
        </header>

        {/* search + stats */}
        <section className="mb-10 grid gap-6 md:grid-cols-3">
          <input
            placeholder="Search podcasts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-2 rounded-xl bg-slate-900 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />

          <div className="rounded-xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Status</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-emerald-400">
              ● Sync ready
            </p>
          </div>
        </section>

        {/* ACTIVE PODCAST */}
        {active && (
          <section className="mb-12 rounded-3xl bg-slate-900 p-8 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Active podcast
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {active.title || active.id}
                </h2>

                {active.description && (
                  <p className="mt-3 max-w-2xl text-sm text-slate-300">
                    {active.description}
                  </p>
                )}

                {active.rss_url && (
                  <a
                    href={active.rss_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-xs text-sky-400 hover:underline"
                  >
                    {active.rss_url}
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href={`/${active.id}`}
                  className="text-sm font-medium text-sky-400 hover:underline"
                >
                  View public site →
                </Link>

                <button
                  onClick={syncRss}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Sync RSS
                </button>
              </div>
            </div>

            {/* YouTube */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <input
                placeholder="YouTube Channel ID"
                value={youtubeChannelId[active.id] || ''}
                onChange={(e) =>
                  setYoutubeChannelId((p) => ({
                    ...p,
                    [active.id]: e.target.value,
                  }))
                }
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={() => syncYoutube(active.id)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-sky-400"
              >
                Sync YouTube
              </button>
            </div>
          </section>
        )}

        {/* OTHER PODCASTS */}
        {filtered.length > 1 && (
          <section className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-400">
              Other podcasts
            </h3>

            {filtered.slice(1).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4"
              >
                <p className="font-medium">{p.title || p.id}</p>
                <Link
                  href={`/${p.id}`}
                  className="text-sm text-sky-400 hover:underline"
                >
                  Open →
                </Link>
              </div>
            ))}
          </section>
        )}

        {message && (
          <p className="mt-10 text-center text-xs text-slate-400">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}