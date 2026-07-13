'use client';
// components/layouts/NetflixLayout.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowUp, Heart, Linkedin, Mail, Menu, Music2, Rss, X, Youtube } from 'lucide-react';
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
        youtubeUrl?: string;
        spotifyUrl?: string;
        rssUrl?: string;
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
    const footerNavigation = [
        { label: 'Home', href: siteBasePath || '/' },
        { label: 'Episodes', href: `${siteBasePath}/episodes` },
        ...navItems.filter((item) => !['Home', 'Archive'].includes(item.label)),
        { label: 'Archive', href: `${siteBasePath}/episodes` },
        { label: 'Sponsors', href: `${siteBasePath}#sponsors` },
        { label: 'Contact', href: `mailto:hello@${podcast.title.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'podcast'}.com` },
    ];
    const footerResources = [
        { label: 'Resources', href: `${siteBasePath}#resources` },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'Refund Policy', href: '#' },
    ];
    const socialLinks = [
        { label: 'X', href: podcast.twitterUrl || '#', icon: <span className="text-sm font-black">X</span> },
        { label: 'LinkedIn', href: podcast.linkedInUrl || '#', icon: <Linkedin size={17} /> },
        { label: 'YouTube', href: podcast.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(podcast.title)}`, icon: <Youtube size={18} /> },
        { label: 'Spotify', href: podcast.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(podcast.title)}`, icon: <Music2 size={17} /> },
        { label: 'RSS', href: podcast.rssUrl || '#', icon: <Rss size={17} /> },
    ];

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubscribeClick?.();
    };

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

                <footer className="relative z-10 overflow-hidden border-t border-white/10 bg-black px-5 py-16 sm:px-8 md:px-16 lg:py-20">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/70 to-transparent" />
                    <div className="pointer-events-none absolute -right-32 top-12 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl">
                        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.7fr_0.7fr_1.35fr] lg:gap-12 lg:p-10">
                            <section className="space-y-5">
                                <Link href={siteBasePath || '/'} className="group inline-flex items-center gap-4 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                                    {podcast.image ? (
                                        <img
                                            src={podcast.image}
                                            alt=""
                                            className="h-14 w-14 rounded-2xl border border-white/10 object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg font-black text-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                            {podcast.title.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                    <span>
                                        <span className="block text-2xl font-black uppercase tracking-tight text-white transition-colors group-hover:text-[var(--primary)]">
                                            {podcast.title}
                                        </span>
                                        {podcast.tagline && (
                                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                                                {podcast.tagline}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                                <p className="max-w-sm text-sm leading-6 text-zinc-400">
                                    {podcast.description || 'Sharp episodes, curated resources, and new releases from the show.'}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-600">
                                    © {new Date().getFullYear()} {podcast.title}
                                </p>
                            </section>

                            <section>
                                <h2 className="mb-5 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Navigation</h2>
                                <nav className="grid gap-3 text-sm font-semibold text-zinc-400" aria-label="Footer navigation">
                                    {footerNavigation.map((item) => (
                                        <Link
                                            key={`${item.label}-${item.href}`}
                                            href={item.href}
                                            className="w-fit rounded-md transition-all duration-200 hover:translate-x-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            </section>

                            <section>
                                <h2 className="mb-5 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Resources</h2>
                                <nav className="grid gap-3 text-sm font-semibold text-zinc-400" aria-label="Footer resources">
                                    {footerResources.map((item) => (
                                        <Link
                                            key={`${item.label}-${item.href}`}
                                            href={item.href}
                                            className="w-fit rounded-md transition-all duration-200 hover:translate-x-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            </section>

                            <section className="space-y-6">
                                <div>
                                    <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Social</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {socialLinks.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                aria-label={item.label}
                                                target={item.href.startsWith('http') ? '_blank' : undefined}
                                                rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                                                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                            >
                                                {item.icon}
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                                    <label htmlFor="footer-newsletter" className="block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                                        Newsletter
                                    </label>
                                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-2 shadow-inner sm:flex-row">
                                        <div className="relative flex-1">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                            <input
                                                id="footer-newsletter"
                                                type="email"
                                                placeholder="email@domain.com"
                                                className="h-12 w-full rounded-xl border border-transparent bg-white/[0.04] px-10 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--primary)]/60 focus:bg-white/[0.07]"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="h-12 rounded-xl bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_12px_35px_rgba(255,255,255,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                        >
                                            Subscribe
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>

                        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                <span>© {new Date().getFullYear()} All Rights Reserved</span>
                                <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:inline-block" />
                                <span>Built with PodSite Studio</span>
                                {podcast.rssUrl && (
                                    <>
                                        <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:inline-block" />
                                        <a href={podcast.rssUrl} className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                                            RSS Feed
                                        </a>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={scrollToTop}
                                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <ArrowUp size={14} />
                                Back to Top
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </LayoutProvider>
    );
}
