'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function PublicSearch({ podcastId, initialQuery = '', variant = 'dark' }: { podcastId: string, initialQuery?: string, variant?: 'light' | 'dark' }) {
    const [query, setQuery] = useState(initialQuery);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            router.push(`/${podcastId}`);
            return;
        }
        router.push(`/${podcastId}/episodes?q=${encodeURIComponent(query.trim())}`);
    };

    const isLight = variant === 'light';

    return (
        <form onSubmit={handleSearch} className="relative group flex items-center">
            <input
                type="text"
                placeholder="Search episodes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`w-full md:w-64 rounded-full px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 ${
                    isLight 
                    ? 'bg-black/5 text-black placeholder:text-black/40 focus:bg-black/10 focus:ring-black/20 font-medium' 
                    : 'bg-white/10 text-white placeholder:text-slate-400 focus:bg-white/20 focus:ring-sky-500/50'
                }`}
            />
            <button type="submit" className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                isLight ? 'text-black/40 group-hover:text-black' : 'text-slate-400 group-hover:text-white'
            }`}>
                <Search size={16} />
            </button>
        </form>
    );
}
