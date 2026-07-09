'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, RefreshCcw } from 'lucide-react';
import ThemeEngine from '@/components/ThemeEngine';
import { NewPodcastForm } from '../_components/NewPodcastForm';
import { ActivePodcastSync } from '../_components/ActivePodcastSync';
import { SearchForm } from '../_components/SearchForm';
import { DashboardFooter } from '../_components/DashboardFooter';

interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

interface Podcast {
  id: string;
  title: string | null;
  description: string | null;
  rss_url: string | null;
  owner_id: string | null;
  youtube_channel_id: string | null;
  theme_config: ThemeConfig;
}

type FavoriteEpisode = {
  id: string;
  podcastId: string;
  slug: string;
  title: string;
  image?: string;
  published_at: string;
};

export default function DashboardClient({ 
  activePodcast, 
  allPodcasts,
  showFavorites,
  q,
  displayName
}: { 
  activePodcast: Podcast | undefined;
  allPodcasts: Podcast[];
  showFavorites: boolean;
  q: string;
  displayName: string;
}) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteEpisodes, setFavoriteEpisodes] = useState<FavoriteEpisode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const loadFavs = () => {
      const saved = localStorage.getItem('pk_favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load favorites', e);
        }
      }
      const savedEps = localStorage.getItem('pk_episode_favorites');
      if (savedEps) {
        try {
          setFavoriteEpisodes(JSON.parse(savedEps));
        } catch {}
      }
    };

    loadFavs();

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pk_favorites' || e.key === 'pk_episode_favorites') {
        loadFavs();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavs = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    
    setFavorites(newFavs);
    localStorage.setItem('pk_favorites', JSON.stringify(newFavs));
  };

  const toggleEpisodeFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavs = favoriteEpisodes.filter(fav => fav.id !== id);
    setFavoriteEpisodes(newFavs);
    localStorage.setItem('pk_episode_favorites', JSON.stringify(newFavs));
  };

  // Auto-refresh logic (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 2000);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [router]);

  const displayedPodcasts = showFavorites 
    ? allPodcasts.filter(p => favorites.includes(p.id))
    : allPodcasts;

  const primaryColor = activePodcast?.theme_config?.primaryColor || '#6366f1';
  const accentColor = activePodcast?.theme_config?.accentColor || '#8b5cf6';

  return (
    <div 
      className="dashboard-active-scope space-y-8 animate-in fade-in duration-700"
      style={{
        '--podcast-primary': primaryColor,
        '--podcast-accent': accentColor,
      } as React.CSSProperties}
    >
      <ThemeEngine config={activePodcast?.theme_config || {}} scope=":root" />

      {/* Header Info & Auto Refresh Status */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 px-6 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-4">
            <span className={showFavorites ? 'text-[var(--podcast-primary)] animate-pulse' : ''}>
                {showFavorites ? '• Favorites View' : '• All Shows'}
            </span>
            {isRefreshing && (
                <span className="flex items-center gap-1 text-[var(--podcast-primary)] animate-pulse">
                    <RefreshCcw size={10} className="animate-spin" /> Auto-Refreshing...
                </span>
            )}
        </div>
        <button 
            onClick={() => { router.refresh(); setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1000); }}
            className="hover:text-[var(--podcast-primary)] transition-all duration-300 flex items-center gap-1 font-[family-name:var(--font-heading)] hover:scale-105 active:scale-95"
        >
            <RefreshCcw size={10} /> Force Refresh
        </button>
      </div>

      {/* Top Welcome Section (Vibrant & Magic) */}
      {!showFavorites && (
        <section className="animate-fade-in-up rounded-[2.5rem] relative overflow-hidden p-10 mb-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 group"
          style={{
            background: `radial-gradient(circle at top right, ${primaryColor}44, transparent), radial-gradient(circle at bottom left, ${accentColor}22, #000)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-50" />
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[var(--podcast-primary)] blur-[100px] opacity-20 animate-pulse group-hover:opacity-30 transition-opacity duration-700" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="space-y-3">
              <h1 className="text-5xl font-black tracking-tighter text-white leading-none italic drop-shadow-2xl">
                Welcome back, <span className="text-[var(--podcast-primary)]">{displayName}</span>
              </h1>
              <p className="max-w-md text-[10px] leading-relaxed text-zinc-500 font-black uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Studio Live / Paste RSS Feed
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 sm:w-auto">
              <div className="rounded-2xl bg-white/5 p-1 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl hover:ring-white/20 transition-all duration-500">
                <NewPodcastForm />
              </div>
            </div>
          </div>
        </section>
      )}


      {!allPodcasts.length && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.02] py-24 text-center">
          {q && (q.startsWith('http://') || q.startsWith('https://')) ? (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-sky-500/10 p-5 ring-1 ring-sky-500/20 animate-pulse">
                  <span className="text-3xl">🎙️</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Import this Podcast?</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                {`"${q}" isn't in your library yet. We can import it and build your premium site instantly.`}
              </p>
              <div className="mt-8">
                <NewPodcastForm initialRss={q} />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-inner">
                <span className="text-4xl filter grayscale">📡</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {q ? `No matches for "${q}"` : 'Your Studio is Ready'}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                {q
                  ? 'Try a different search term or paste an RSS URL to import a new show.'
                  : 'Import your first RSS feed to generate a stunning, auto-updating podcast website.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Show favorites empty state */}
      {showFavorites && displayedPodcasts.length === 0 && favoriteEpisodes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.02] py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--podcast-primary)]/10 text-[var(--podcast-primary)]">
              <Star size={40} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">No Favorites Yet</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
              Click the star or heart on any podcast or episode to add it to your favorites list for quick access.
            </p>
          </div>
      )}

      {/* Active Selection (Vibrant & Neo-Brutalist Magic) */}
      {activePodcast && !showFavorites && (
        <section className="animate-fade-in-up [animation-delay:100ms] grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[3rem] bg-zinc-950/80 border-4 border-white/5 p-10 transition-all hover:border-[var(--podcast-primary)]/50 hover:shadow-[0_0_50px_-12px_var(--podcast-primary)] backdrop-blur-xl">
              {/* Permanent subtle ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--podcast-primary)]/5 via-transparent to-transparent opacity-60" />
              <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[var(--podcast-primary)]/5 blur-[100px]" />
              <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[var(--podcast-primary)]/10 blur-[120px]" />

              <div className="relative flex flex-col gap-10 sm:flex-row items-center sm:items-start">
                <div className="flex-1 space-y-6 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="rounded-full bg-[var(--podcast-primary)]/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--podcast-primary)] border border-[var(--podcast-primary)]/30">
                      Primary Workspace
                    </span>
                    <Link
                      href={`/${activePodcast.id}`}
                      target="_blank"
                      className="flex items-center gap-2 rounded-full border-2 border-[var(--podcast-primary)]/20 bg-[var(--podcast-primary)]/10 px-5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--podcast-primary)] transition-all hover:bg-[var(--podcast-primary)]/20 hover:border-[var(--podcast-primary)]/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Live Site <span className="text-[10px]">↗</span>
                    </Link>
                    <button
                      onClick={(e) => toggleFavorite(activePodcast.id, e)}
                      className={`p-2 rounded-full border-2 transition-all ${favorites.includes(activePodcast.id) ? 'bg-[var(--podcast-primary)] text-black border-[var(--podcast-primary)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)]'}`}
                    >
                      <Star size={18} fill={favorites.includes(activePodcast.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="flex items-center gap-6 justify-center sm:justify-start">
                    {activePodcast.theme_config?.imageUrl && (
                      <div className="shrink-0 relative">
                        <img
                          src={activePodcast.theme_config.imageUrl}
                          alt={activePodcast.title || 'Podcast'}
                          className="h-24 w-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10 group-hover:scale-[1.05] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 rounded-2xl ring-inset ring-1 ring-white/20" />
                      </div>
                    )}
                      <div className="space-y-2 text-left">
                        <h2 className="text-5xl font-black tracking-tighter text-white italic leading-tight">
                          {activePodcast.title}
                        </h2>
                        {!showFavorites && (
                          <p className="text-[10px] font-bold text-[var(--podcast-primary)] font-mono uppercase tracking-widest bg-[var(--podcast-primary)]/10 w-fit px-3 py-1 rounded">
                            {activePodcast.rss_url}
                          </p>
                        )}
                      </div>
                  </div>

                  <p className="text-lg leading-relaxed text-zinc-400 line-clamp-2 font-medium">
                    {activePodcast.description || 'Launch your podcast world. No description set.'}
                  </p>
                </div>
              </div>

              <div className="relative mt-12 grid grid-cols-2 gap-6">
                <Link
                  href={`/podcasts/${activePodcast.id}/episodes`}
                  className="flex flex-1 items-center justify-center gap-3 rounded-lg bg-[#0f172a] py-4 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-[var(--podcast-primary)] hover:text-black hover:shadow-[0_0_20px_var(--podcast-primary)] font-[family-name:var(--font-heading)]"
                >
                  Manage Show
                </Link>
                <Link
                  href={`/dashboard/customize?siteId=${activePodcast.id}`}
                  className="flex flex-1 items-center justify-center gap-3 rounded-lg bg-[#0f172a] py-4 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-[var(--podcast-primary)] hover:text-black hover:shadow-[0_0_20px_var(--podcast-primary)] font-[family-name:var(--font-heading)]"
                >
                  Customize Site
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <ActivePodcastSync
              podcastId={activePodcast.id}
              youtubeChannelId={activePodcast.youtube_channel_id}
            />
          </div>
        </section>
      )}

      {/* Library Section (Clean Grid) */}
      {/* Favorites View (Re-prioritized) */}
      {showFavorites ? (
        <div className="space-y-20">
          {/* 1. Favorite Episodes (TOP PRIORITY) */}
          {favoriteEpisodes.length > 0 && (
            <section className="animate-fade-in-up [animation-delay:200ms]">
              <div className="mb-10 p-8 rounded-[3rem] bg-gradient-to-r from-[var(--podcast-primary)]/10 via-[var(--podcast-primary)]/5 to-transparent border-l-8 border-[var(--podcast-primary)] shadow-2xl">
                <h3 className="text-4xl font-black tracking-tighter text-[var(--podcast-primary)] italic uppercase flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--podcast-primary)] text-black not-italic text-2xl animate-bounce">🎙️</span>
                  Favorite Episodes
                </h3>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 mt-3 opacity-70 ml-16">
                  Your High-Priority Saved Content
                </p>
              </div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {favoriteEpisodes.map(ep => (
                  <Link 
                    key={ep.id} 
                    href={`/${ep.podcastId}/episodes/${ep.slug}`} 
                    target="_blank" 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-zinc-950 border-4 border-white/5 p-6 transition-all hover:-translate-y-3 hover:border-[var(--podcast-primary)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
                  >
                    <div className="aspect-video w-full mb-8 relative rounded-2xl overflow-hidden ring-2 ring-white/5 shadow-2xl">
                        <img src={ep.image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'} alt={ep.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4">
                           <span className="px-2 py-1 bg-[var(--podcast-primary)] text-black text-[8px] font-black uppercase tracking-widest rounded-sm">Episode</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xl font-black tracking-tighter text-white italic line-clamp-2 leading-[1.1] group-hover:text-[var(--podcast-primary)] transition-colors">
                        {ep.title}
                      </h4>
                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-[var(--podcast-primary)] animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                             {new Date(ep.published_at).toLocaleDateString()}
                           </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => toggleEpisodeFavorite(ep.id, e)} 
                      className="absolute top-8 right-8 p-3 rounded-full bg-[var(--podcast-primary)] text-black border-4 border-black transition-all z-20 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-90"
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                    
                    {/* Background Glow */}
                    <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[var(--podcast-primary)]/10 blur-[80px] pointer-events-none group-hover:bg-[var(--podcast-primary)]/20 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. Favorite Podcasts */}
          {displayedPodcasts.length > 0 && (
            <section className="animate-fade-in-up [animation-delay:400ms]">
              <div className="mb-10 p-8 rounded-[3rem] bg-zinc-900/40 border border-white/5 shadow-xl">
                <h3 className="text-3xl font-black tracking-tighter text-white italic uppercase flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl not-italic border border-white/10">✨</span>
                  Favorite Podcasts
                </h3>
              </div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {displayedPodcasts.map((p) => {
                  const pColor = p.theme_config?.primaryColor || '#6366f1';
                  return (
                    <div key={p.id} className="relative group">
                        <Link
                        href={`/${p.id}`}
                        target="_blank"
                        className={`flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-zinc-950 border-4 p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] h-full ${activePodcast?.id === p.id ? 'border-[var(--podcast-primary)] shadow-[0_0_30px_-5px_var(--podcast-primary)]' : 'border-white/5 hover:border-[var(--podcast-primary)]/50'}`}
                        style={{ '--podcast-item-primary': pColor } as React.CSSProperties}
                        >
                        <div className="flex gap-6">
                            {p.theme_config?.imageUrl && (
                            <div className="shrink-0 relative">
                                <img
                                src={p.theme_config.imageUrl}
                                alt={p.title || 'Show'}
                                className="h-24 w-24 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 rounded-2xl ring-inset ring-1 ring-white/20" />
                            </div>
                            )}
                            <div className="space-y-2 min-w-0">
                            <h4 className="text-2xl font-black tracking-tighter text-white italic group-hover:text-[var(--podcast-item-primary)] transition-colors truncate">
                                {p.title || 'Untitled'}
                            </h4>
                            {p.description && (
                                <p className="text-sm leading-relaxed text-zinc-500 line-clamp-2 font-bold uppercase tracking-tighter opacity-80">
                                {p.description}
                                </p>
                            )}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between border-t-2 border-white/5 pt-6 relative z-10">
                            <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[var(--podcast-item-primary)] shadow-[0_0_10px_var(--podcast-item-primary)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Podcast Site</span>
                            </div>
                            <div className="flex items-center gap-1 text-[var(--podcast-item-primary)] animate-pulse">
                              <Star size={10} fill="currentColor" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Favorited</span>
                            </div>
                        </div>
                        </Link>
                        
                        <button
                            onClick={(e) => toggleFavorite(p.id, e)}
                            className={`absolute top-6 right-6 p-2 rounded-full border-2 transition-all z-20 ${favorites.includes(p.id) ? 'bg-[var(--podcast-primary)] text-black border-[var(--podcast-primary)]' : 'bg-black/50 text-white/40 border-white/10 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)] backdrop-blur-md opacity-0 group-hover:opacity-100'}`}
                        >
                            <Star size={14} fill={favorites.includes(p.id) ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Original Library View */
        <section className="animate-fade-in-up [animation-delay:200ms] space-y-10 pt-8 pb-32">
            <div className={`flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-10`}>
              <div className="space-y-2">
                <h3 className={`text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100`}>
                  {q ? `Results for "${q}"` : 'Your Studio Library'}
                </h3>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest opacity-80">
                  Connected RSS Feeds
                </p>
              </div>
              <div className="w-full max-w-xs">
                <SearchForm initialQuery={q} />
              </div>
            </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayedPodcasts.map((p) => {
              const pColor = p.theme_config?.primaryColor || '#6366f1';
              return (
                <div key={p.id} className="relative group">
                    <Link
                    href={`/dashboard?active=${p.id}`}
                    className={`flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-zinc-950 border-4 p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] h-full ${activePodcast?.id === p.id ? 'border-[var(--podcast-primary)] shadow-[0_0_30px_-5px_var(--podcast-primary)]' : 'border-white/5 hover:border-[var(--podcast-primary)]/50'}`}
                    style={{ '--podcast-item-primary': pColor } as React.CSSProperties}
                    >
                    <div className="flex gap-6">
                        {p.theme_config?.imageUrl && (
                        <div className="shrink-0 relative">
                            <img
                            src={p.theme_config.imageUrl}
                            alt={p.title || 'Show'}
                            className="h-24 w-24 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-inset ring-1 ring-white/20" />
                        </div>
                        )}
                        <div className="space-y-2 min-w-0">
                        <h4 className="text-2xl font-black tracking-tighter text-white italic group-hover:text-[var(--podcast-item-primary)] transition-colors truncate">
                            {p.title || 'Untitled'}
                        </h4>
                        {p.description && (
                            <p className="text-sm leading-relaxed text-zinc-500 line-clamp-2 font-bold uppercase tracking-tighter opacity-80">
                            {p.description}
                            </p>
                        )}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t-2 border-white/5 pt-6 relative z-10">
                        <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[var(--podcast-item-primary)] shadow-[0_0_10px_var(--podcast-item-primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Podcast Admin</span>
                        </div>
                        <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-mono text-zinc-500 border border-white/10">
                          {p.id.slice(0, 8)}
                        </span>
                    </div>
                    </Link>
                    
                    <button
                        onClick={(e) => toggleFavorite(p.id, e)}
                        className={`absolute top-6 right-6 p-2 rounded-full border-2 transition-all z-20 ${favorites.includes(p.id) ? 'bg-[var(--podcast-primary)] text-black border-[var(--podcast-primary)]' : 'bg-black/50 text-white/40 border-white/10 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)] backdrop-blur-md opacity-0 group-hover:opacity-100'}`}
                    >
                        <Star size={14} fill={favorites.includes(p.id) ? 'currentColor' : 'none'} />
                    </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <DashboardFooter />
    </div>
  );
}
