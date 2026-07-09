'use client';
import React from 'react';
import { useLayout } from '../LayoutContext';
import { Apple, Music, Youtube, Rss } from 'lucide-react';

export default function SubscribeBlock({ podcast }: { podcast: any }) {
    const layout = useLayout();
    const config = podcast.theme_config || {};

    const platforms = [
        { name: 'Apple Podcasts', Icon: Apple, url: config.applePodcastsUrl || `https://podcasts.apple.com/search?term=${encodeURIComponent(podcast.title)}` },
        { name: 'Spotify', Icon: Music, url: config.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(podcast.title)}` },
        { name: 'YouTube', Icon: Youtube, url: config.youtubeUrl || (podcast.youtube_channel_id ? `https://youtube.com/channel/${podcast.youtube_channel_id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(podcast.title)}`) },
        { name: 'RSS Feed', Icon: Rss, url: config.rssUrlOverride || podcast.rss_url },
    ];

    if (layout === 'substack') {
        return (
            <section className="mb-24 py-16 border-y border-[var(--border)] italic">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-black italic tracking-tighter mb-4 text-[var(--foreground)]">Subscribe to the newsletter</h3>
                    <p className="text-[var(--foreground)] font-medium opacity-60">Join 50,000+ others and never miss an update.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {platforms.map((p) => (
                        <a
                            key={p.name}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#171717] opacity-40 hover:opacity-100 hover:translate-x-1 active:scale-95 transition-all duration-200 group"
                        >
                            <p.Icon size={20} strokeWidth={2.5} className="group-hover:text-[var(--primary)] group-hover:scale-110 transition-all duration-200" />
                            <span className="group-hover:text-[var(--primary)] transition-colors duration-200">{p.name}</span>
                        </a>
                    ))}
                </div>
            </section>
        );
    }

    if (layout === 'genz') {
        return (
            <section className="relative mb-32 bg-black p-12 lg:p-20 text-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(var(--primary-rgb),1)] rotate-[-1deg]">
                <h3 className="text-6xl font-black uppercase italic tracking-tighter mb-12 leading-none">JOIN THE FAM</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {platforms.map((p) => (
                        <a
                            key={p.name}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-4 border-white bg-white text-black p-6 font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_var(--primary)] hover:bg-[var(--primary)] transition-all duration-200 active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center justify-center gap-4 group"
                        >
                            <p.Icon size={24} strokeWidth={3} className="transition-transform group-hover:scale-125 duration-200" />
                            <span>{p.name}</span>
                        </a>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="mb-24">
            <h3 className="mb-8 text-xl font-bold uppercase tracking-widest text-zinc-400">Where to Watch & Listen</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {platforms.map((p) => (
                    <a
                        key={p.name}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 rounded-sm bg-zinc-800/40 p-5 font-black uppercase transition-all duration-200 hover:bg-[var(--primary)] hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] active:scale-95 group"
                    >
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                            <p.Icon size={24} strokeWidth={2.5} />
                        </span>
                        <span className="text-xs tracking-widest text-zinc-300 group-hover:text-white">{p.name}</span>
                    </a>
                ))}
            </div>
        </section>
    );
}
