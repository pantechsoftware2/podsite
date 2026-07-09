'use client';
// components/layouts/NetflixLayout.tsx
import React from 'react';
import Link from 'next/link';
import { Menu, X, Heart } from 'lucide-react';
import PublicSearch from '../PublicSearch';
import { LayoutProvider } from '../LayoutContext';
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

interface NetflixLayoutProps {
    children: React.ReactNode;
    podcast: {
        id: string;
        title: string;
        tagline?: string;
        image?: string;
        description?: string;
        latest_video_id?: string;
        twitterUrl?: string;
        linkedInUrl?: string;
        siteBasePath?: string;
        generatedPages?: Array<{ slug: string; navLabel: string }>;
    };
    episode?: LayoutEpisode;
    onSubscribeClick?: () => void;
    editMode?: boolean;
}

export default function NetflixLayout({ children, podcast, episode, onSubscribeClick, editMode = false }: NetflixLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const siteBasePath = podcast.siteBasePath || `/${podcast.id}`;
    const episodeId = episode?.id;
    const navItems = [
        { label: 'Home', href: siteBasePath || '/' },
        { label: 'Archive', href: `${siteBasePath}/episodes` },
        ...(podcast.generatedPages || []).slice(0, 3).map((page) => ({
            label: page.navLabel,
            href: `${siteBasePath}/${page.slug}`,
        })),
        { label: 'Shop', href: `${siteBasePath}#product` },
        { label: 'About', href: `${siteBasePath}/about` },
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
        <LayoutProvider value="netflix">
            <div className="relative min-h-screen bg-black text-white selection:bg-[var(--primary)]/30 overflow-x-hidden">
                {/* Dynamic Background */}
                <div className="fixed inset-0 z-0 mesh-gradient opacity-20 pointer-events-none" />
                <div className="fixed inset-0 z-0 grid-pattern opacity-[0.03] pointer-events-none" />

                {/* Nav Bar */}
                <header className={`fixed ${editMode ? 'top-[60px]' : 'top-0'} z-50 w-full border-b border-white/10 bg-black/82 px-4 py-3 shadow-[0_16px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors hover:bg-black/95 sm:px-6 lg:px-10 xl:px-16`}>
                    <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
                            <Link href={siteBasePath || '/'} className="group flex min-w-0 flex-col py-1">
                                <span className="max-w-[56vw] truncate text-xl font-black tracking-tight text-white transition-all group-hover:text-[var(--primary)] sm:max-w-[320px] sm:text-2xl lg:max-w-[360px] xl:max-w-[460px]">
                                    {podcast.title?.toUpperCase() || 'PODSITE'}
                                </span>
                                {podcast.tagline && (
                                    <span className="hidden max-w-[320px] truncate text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 sm:block">
                                        {podcast.tagline}
                                    </span>
                                )}
                            </Link>
                            <nav className="hidden items-center gap-5 text-xs font-bold uppercase tracking-[0.16em] lg:flex xl:gap-6">
                                {navItems.map((item) => (
                                    <Link key={`${item.label}-${item.href}`} href={item.href} className="text-white/72 transition-colors hover:text-white">
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            <div className="hidden items-center gap-3 md:flex">
                                <PublicSearch podcastId={podcast.id} />
                                
                                {/* Favorites Heart (Move Socials/Subscribe to footer) */}
                                <button 
                                    onClick={toggleFavorite}
                                    aria-label={isFavorited ? 'Remove favorite' : 'Add favorite'}
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all ${isFavorited ? 'text-red-500 fill-red-500 bg-red-500/10' : 'text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10'}`}
                                >
                                    <Heart size={20} />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Open menu"
                                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white backdrop-blur-md md:hidden"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Overlay */}
                    {isMenuOpen && (
                        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center justify-center gap-8 bg-black/98 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 md:hidden">
                            <nav className="flex flex-col items-center gap-10 text-3xl font-black">
                                {navItems.map((item) => (
                                    <Link
                                        key={`${item.label}-${item.href}`}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="hover:text-[var(--primary)] transition-all uppercase"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}
                </header>

                <main className={`relative z-10 ${editMode ? 'pt-36 sm:pt-40' : 'pt-20 sm:pt-24'} pb-12`}>
                    {children}
                </main>

                <footer className="relative z-10 border-t border-white/5 bg-black px-8 py-20 md:px-16">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 md:flex-row">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-4xl font-black tracking-tighter uppercase">{podcast.title}</h2>
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-600 italic">© {new Date().getFullYear()} All Rights Reserved</p>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4">
                                <a href={podcast.twitterUrl || '#'} className="h-12 w-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                                    <span className="text-lg font-black italic">𝕏</span>
                                </a>
                                <a href={podcast.linkedInUrl || '#'} className="h-12 w-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                                    <span className="text-base font-black italic">in</span>
                                </a>
                            </div>
                            <div className="flex flex-col gap-1 items-end md:items-start">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Legal</h4>
                                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                                    <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                                    <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
                                    <Link href="#" className="hover:text-white transition-colors">Refund Policy</Link>
                                </div>
                            </div>
                            <button 
                                onClick={onSubscribeClick}
                                className="h-14 px-10 rounded-sm bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-[var(--primary)] transition-all shadow-2xl active:scale-95"
                            >
                                Subscribe Now
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </LayoutProvider>
    );
}
