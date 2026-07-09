// app/(dashboard)/_components/NewPodcastForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewPodcastForm({ initialRss = '' }: { initialRss?: string }) {
  const [rssUrl, setRssUrl] = useState(initialRss);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/podcasts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rssUrl }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Import failed');
      return;
    }

    setMessage(`RSS parsed. Building "${json.title}" now...`);
    setRssUrl('');

    router.refresh();
    router.push(json.buildUrl || `/building/${json.podcastId}`);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="relative flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="url"
            required
            placeholder="Paste RSS Url..."
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            disabled={loading}
            className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-5 py-4 text-sm text-black shadow-inner placeholder:text-zinc-500 focus:border-[var(--podcast-primary)]/50 focus:outline-none focus:ring-4 focus:ring-[var(--podcast-primary)]/10 transition-all font-bold disabled:opacity-50 font-[family-name:var(--font-body,inherit)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-2xl bg-[var(--podcast-primary)] px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-2xl hover:scale-[1.05] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] font-[family-name:var(--font-heading,inherit)] hover:bg-black hover:text-[var(--podcast-primary)]"
        >
          {loading ? 'Importing...' : 'Import'}
        </button>

        {message && (
          <div className={`absolute top-full left-0 mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md flex items-center gap-2 ${message.toLowerCase().includes('success') ? 'text-emerald-400 border-emerald-900' : 'text-red-400 border-red-900'
            }`}>
            {message.toLowerCase().includes('success') && (
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        )}
      </form>
    </>
  );
}
