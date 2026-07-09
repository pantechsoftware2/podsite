'use client';
// components/layouts/GenZLayout.tsx
import React from 'react';
import Link from 'next/link';
import { Menu, X, Heart } from 'lucide-react';
import { LayoutProvider } from '../LayoutContext';
import PublicSearch from '../PublicSearch';
import { useState, useEffect } from 'react';

type LayoutEpisode = {
    id?: string;
    title?: string;
    slug?: string;
    image_url?: string | null;
    published_at?: string | null;
};

type FavoriteEpisode = LayoutEpisode & {
    podcastId?: string;
    image?: string;
};

function readStoredArray<T>(key: string): T[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

interface GenZLayoutProps {
    children: React.ReactNode;
    podcast: {
        id: string;
        title: string;
        tagline?: string;
        image?: string;
        description?: string;
        twitterUrl?: string;
        linkedInUrl?: string;
        siteBasePath?: string;
        generatedPages?: Array<{ slug: string; navLabel: string }>;
    };
    episode?: LayoutEpisode;
    onSubscribeClick?: () => void;
}

export default function GenZLayout({ children, podcast, episode, onSubscribeClick }: GenZLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const siteBasePath = podcast.siteBasePath || `/${podcast.id}`;
    const episodeId = episode?.id;
    const navItems = [
        { label: 'HOME', href: siteBasePath || '/' },
        { label: 'ARCHIVE', href: `${siteBasePath}/episodes` },
        ...(podcast.generatedPages || []).slice(0, 3).map((page) => ({
            label: page.navLabel.toUpperCase(),
            href: `${siteBasePath}/${page.slug}`,
        })),
        { label: 'SHOP', href: `${siteBasePath}#product` },
        { label: 'ABOUT', href: `${siteBasePath}/about` },
    ];

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (episodeId) {
                const favs = readStoredArray<FavoriteEpisode>('pk_episode_favorites');
                setIsFavorited(favs.some((favorite) => favorite.id === episodeId));
            } else {
                const favorites = readStoredArray<string>('pk_favorites');
                setIsFavorited(favorites.includes(podcast.id));
            }
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [podcast.id, episodeId]);

    const toggleFavorite = () => {
        if (episode?.id) {
            const favs = readStoredArray<FavoriteEpisode>('pk_episode_favorites');
            const exists = favs.find((favorite) => favorite.id === episode.id);
            let newFavs;
            if (exists) {
                newFavs = favs.filter((favorite) => favorite.id !== episode.id);
                setIsFavorited(false);
            } else {
                newFavs = [...favs, {
                    id: episode.id,
                    title: episode.title,
                    podcastId: podcast.id,
                    slug: episode.slug,
                    image: episode.image_url || podcast.image,
                    published_at: episode.published_at
                }];
                setIsFavorited(true);
            }
            localStorage.setItem('pk_episode_favorites', JSON.stringify(newFavs));
        } else {
            const favorites = readStoredArray<string>('pk_favorites');
            let newFavorites;
            if (favorites.includes(podcast.id)) {
                newFavorites = favorites.filter((id: string) => id !== podcast.id);
                setIsFavorited(false);
            } else {
                newFavorites = [...favorites, podcast.id];
                setIsFavorited(true);
            }
            localStorage.setItem('pk_favorites', JSON.stringify(newFavorites));
        }
    };

    return (
        <LayoutProvider value="genz">
            <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/30 overflow-x-hidden">
                {/* Dynamic Background */}
                <div className="fixed inset-0 z-0 mesh-gradient opacity-15 pointer-events-none" />
                <div className="fixed inset-0 z-0 grid-pattern opacity-[0.04] pointer-events-none" />

                {/* Aggressive Brutalist Header */}
                <header className="sticky top-0 z-50 border-b-8 border-black bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
                        <div className="flex items-center gap-2">
                            <Link href={siteBasePath || '/'} className="group relative flex flex-col leading-none">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black uppercase italic tracking-tighter transition-colors group-hover:text-[var(--primary)]">
                                        {podcast.title}
                                    </span>
                                    <span className="text-3xl font-black italic tracking-tighter text-zinc-400">
                                        {">"} TOP STORIES
                                    </span>
                                </div>
                                {podcast.tagline && (
                                    <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500 mt-1">
                                        {podcast.tagline}
                                    </span>
                                )}
                            </Link>
                        </div>

                        <div className="flex items-center gap-6">
                            <nav className="hidden items-center gap-8 md:flex">
                                {navItems.map((item) => (
                                    <a
                                        key={`${item.label}-${item.href}`}
                                        href={item.href}
                                        className="text-lg font-black uppercase italic transition-all hover:text-[color:var(--primary)]"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </nav>
                            <div className="hidden md:flex items-center gap-4">
                                <PublicSearch podcastId={podcast.id} variant="light" />
                                
                                <button 
                                    onClick={toggleFavorite}
                                    className={`transition-all p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${isFavorited ? 'text-red-500 fill-red-500 bg-red-100' : 'text-zinc-600 hover:text-black bg-white'}`}
                                >
                                    <Heart size={24} strokeWidth={3} className={isFavorited ? 'animate-bounce' : ''} />
                                </button>

                            </div>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex h-12 w-12 items-center justify-center border-4 border-black md:hidden"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="fixed inset-0 top-[88px] z-40 bg-white p-8 animate-in slide-in-from-right duration-300 md:hidden border-l-8 border-black">
                            <nav className="flex flex-col gap-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={`${item.label}-${item.href}`}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-6xl font-black uppercase italic border-b-8 border-black pb-4"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}
                </header>

                {/* Brutalist Main Content */}
                <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8 space-y-32">
                    {children}
                </main>

                {/* Loud Footer */}
                <footer className="border-t-8 border-black bg-[var(--primary)] p-12 lg:p-24 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-xl">
                                <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-8">
                                    STAY<br />FRESH
                                </h2>
                                <p className="text-2xl font-bold uppercase italic tracking-tight">
                                    © {new Date().getFullYear()} {podcast.title}. All rights reserved.
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex gap-3">
                                    <a href={podcast.twitterUrl || '#'} className="h-14 w-14 border-4 border-black bg-black text-white flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <span className="text-2xl font-black italic">𝕏</span>
                                    </a>
                                    <a href={podcast.linkedInUrl || '#'} className="h-14 w-14 border-4 border-black bg-black text-white flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <span className="text-xl font-black italic">in</span>
                                    </a>
                                </div>
                                <div className="flex flex-col gap-2 text-right">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50">Legal</h4>
                                    <div className="flex flex-col gap-1 items-end">
                                        <Link href="#" className="text-xs font-black uppercase italic hover:underline">Privacy Policy</Link>
                                        <Link href="#" className="text-xs font-black uppercase italic hover:underline">Terms of Service</Link>
                                        <Link href="#" className="text-xs font-black uppercase italic hover:underline">Cookie Policy</Link>
                                        <Link href="#" className="text-xs font-black uppercase italic hover:underline">Refund Policy</Link>
                                    </div>
                                </div>
                                <button 
                                    onClick={onSubscribeClick}
                                    className="border-4 border-black bg-black text-white px-12 py-5 text-2xl font-black uppercase italic shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:bg-white hover:text-black hover:scale-105 active:scale-90 transition-all duration-200"
                                >
                                    Subscribe Now
                                </button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </LayoutProvider>
    );
}
