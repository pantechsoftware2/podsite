// components/blocks/GridBlock.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLayout } from '../LayoutContext';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

const EpisodeFavoriteButton = ({ episode, podcast, className = '' }: { episode: any, podcast: any, className?: string }) => {
    const [isFav, setIsFav] = useState(false);
    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('pk_episode_favorites') || '[]');
        setIsFav(favs.some((f: any) => f.id === episode.id));
    }, [episode.id]);
    
    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const favs = JSON.parse(localStorage.getItem('pk_episode_favorites') || '[]');
        const exists = favs.find((f: any) => f.id === episode.id);
        if (exists) {
            const newFavs = favs.filter((f: any) => f.id !== episode.id);
            localStorage.setItem('pk_episode_favorites', JSON.stringify(newFavs));
            setIsFav(false);
        } else {
            const newFavs = [...favs, {
                id: episode.id,
                title: episode.title,
                podcastId: podcast.id,
                slug: episode.slug,
                image: episode.image_url || podcast.image,
                published_at: episode.published_at
            }];
            localStorage.setItem('pk_episode_favorites', JSON.stringify(newFavs));
            setIsFav(true);
        }
    };
    return (
        <button onClick={toggle} className={`z-20 flex items-center justify-center p-2 rounded-full transition-all cursor-pointer ${isFav ? 'text-red-500 fill-red-500 bg-red-100 opacity-100' : 'text-zinc-400 bg-black/40 hover:bg-black/80 hover:text-white'} ${className}`}>
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'animate-bounce' : ''} />
        </button>
    );
};

export default function GridBlock({ podcast, episodes }: { podcast: any, episodes: any[] }) {
    const [limit, setLimit] = React.useState(8);
    const layout = useLayout();
    const siteBasePath = podcast.siteBasePath || `/${podcast.id}`;
    
    const displayedEpisodes = episodes.slice(0, limit);
    const hasMore = episodes.length > limit;

    const ExploreButton = () => (
        <div className="flex justify-center mt-12 mb-20">
            <button 
                onClick={() => setLimit(prev => prev + 12)}
                className="group relative inline-flex items-center gap-4 rounded-full border-4 border-current px-12 py-5 text-xl font-black uppercase italic tracking-tighter transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95"
            >
                <span>Explore More</span>
                <span className="transition-transform group-hover:translate-x-2">↓</span>
            </button>
        </div>
    );

    if (layout === 'substack') {
        return (
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">Recent Writing & Audio</h3>
                    <div className="h-px flex-1 bg-zinc-100" />
                </div>
                <div className="space-y-4 md:space-y-8">
                    {displayedEpisodes.map((ep) => (
                        <div key={ep.id} className="relative group">
                            <Link
                                href={`${siteBasePath}/episodes/${ep.slug}`}
                                className="block border-l-4 border-transparent hover:border-[var(--primary)] pl-6 py-4 -ml-6 hover:bg-zinc-50/50 hover:translate-x-2 transition-all duration-300 ease-in-out rounded-r-xl no-underline"
                            >
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-[var(--primary)] transition-colors duration-200">
                                        {new Date(ep.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                    </span>
                                    <h4 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200 leading-tight">
                                        {ep.title}
                                    </h4>
                                    <p className="text-base md:text-lg text-zinc-500 line-clamp-2 max-w-2xl font-serif font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                        Listen to the full episode on {podcast.title}. Available now.
                                    </p>
                                    <div className="mt-4 flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-[var(--foreground)] transition-all duration-200">
                                        <span className="opacity-60">{ep.youtube_video_id ? 'Video Available' : 'Audio Only'}</span>
                                        <span className="opacity-20">•</span>
                                        <span className="text-[var(--foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-3 transition-all duration-300 font-black inline-block">Listen Now →</span>
                                    </div>
                                </div>
                            </Link>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <EpisodeFavoriteButton episode={ep} podcast={podcast} className="shadow-md !bg-white border border-zinc-200" />
                            </div>
                        </div>
                    ))}
                </div>
                {hasMore && <ExploreButton />}
            </section>
        );
    }

    if (layout === 'genz') {
        return (
            <section className="mb-32">
                <h3 className="mb-12 text-6xl font-black italic uppercase tracking-tighter rotate-[-1deg] inline-block bg-[var(--primary)] text-black px-6 py-2 border-4 border-black">The Vault</h3>
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                    {displayedEpisodes.map((ep) => (
                        <div key={ep.id} className="relative group block">
                            <Link
                                href={`${siteBasePath}/episodes/${ep.slug}`}
                                className="block relative border-8 border-black bg-white p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(var(--accent-rgb),1)] hover:-translate-x-2 hover:-translate-y-2 transition-all duration-200 active:translate-x-0 active:translate-y-0 active:shadow-none no-underline"
                            >
                                <div className="aspect-video w-full border-4 border-black overflow-hidden mb-6 relative">
                                    <div className="absolute inset-0 bg-[var(--primary)] mix-blend-multiply opacity-0 group-hover:opacity-30 transition-opacity z-10" />
                                    <Image
                                        src={ep.image_url || podcast.image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'}
                                        alt={ep.title || 'Episode'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all scale-100 group-hover:scale-115 duration-500"
                                    />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest block mb-2 bg-black text-white px-2 py-1 inline-block group-hover:bg-[var(--primary)] group-hover:text-black transition-colors">
                                    {new Date(ep.published_at).toLocaleDateString()}
                                </span>
                                <h4 className="text-4xl font-black uppercase italic leading-[0.85] tracking-tighter group-hover:tracking-normal transition-all duration-300">
                                    {ep.title}
                                </h4>
                            </Link>
                            <div className="absolute top-2 right-2 z-[60] opacity-0 group-hover:opacity-100 group-focus-within:-translate-y-2 group-hover:-translate-y-2 group-hover:-translate-x-2 transition-all">
                                <EpisodeFavoriteButton episode={ep} podcast={podcast} className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black !bg-white hover:-translate-y-1 hover:-translate-x-1 !text-black hover:!text-red-500" />
                            </div>
                        </div>
                    ))}
                </div>
                {hasMore && <ExploreButton />}
            </section>
        );
    }

    // Default: Netflix Style
    return (
        <section className="mb-24 px-4 md:px-0">
            <h3 className="mb-6 text-2xl font-black uppercase tracking-tighter text-zinc-100 flex items-center gap-3">
                <span className="h-6 w-1 bg-[var(--primary)] rounded-full" />
                Popular on {podcast.title}
            </h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {displayedEpisodes.map((ep) => (
                    <div key={ep.id} className="group relative aspect-video overflow-visible rounded-sm transition-transform duration-500 ease-out hover:z-50 hover:scale-115">
                        <Link
                            href={`${siteBasePath}/episodes/${ep.slug}`}
                            className="block h-full w-full no-underline"
                        >
                            <div className="relative h-full w-full overflow-hidden rounded-sm ring-1 ring-white/10 shadow-2xl transition-all group-hover:ring-[var(--primary)]/50">
                                <Image
                                    src={ep.image_url || podcast.image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'}
                                    alt={ep.title || 'Episode'}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>

                            {/* Netflix-style Card Details on Hover */}
                            <div className="absolute inset-x-0 -bottom-2 translate-y-full p-4 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-zinc-900 rounded-b-md border-x border-b border-white/5 shadow-2xl">
                                <h4 className="text-sm font-black leading-tight uppercase tracking-tighter text-white line-clamp-2 italic">{ep.title}</h4>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)] animate-pulse">Watch Now</span>
                                    <span className="text-[10px] font-bold text-zinc-500">{new Date(ep.published_at).getFullYear()}</span>
                                </div>
                            </div>
                        </Link>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[60]">
                            <EpisodeFavoriteButton episode={ep} podcast={podcast} className="!bg-black/80 backdrop-blur-md" />
                        </div>
                    </div>
                ))}
            </div>
            {hasMore && <ExploreButton />}
        </section>
    );
}
