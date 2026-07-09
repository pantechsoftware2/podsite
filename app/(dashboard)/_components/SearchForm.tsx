// app/(dashboard)/_components/SearchForm.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function SearchForm({
  initialQuery,
  placeholder = "Search podcasts...",
  className = ""
}: {
  initialQuery: string;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQuery);

  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q);
    else params.delete('q');
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className={`flex items-center bg-white rounded-2xl border border-zinc-200 px-4 py-2 focus-within:border-sky-500/50 transition-all ${className}`}>
      <input
        type="text"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-black focus:outline-none placeholder:text-slate-400 font-bold font-[family-name:var(--font-body,inherit)]"
      />
      <button
        type="submit"
        className="ml-2 text-slate-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>
    </form>
  );
}
