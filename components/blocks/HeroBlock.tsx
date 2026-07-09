'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Info, Play } from 'lucide-react';
import { useLayout } from '../LayoutContext';

type HeroPodcast = {
    id: string;
    title?: string | null;
    description?: string | null;
    image?: string | null;
    latest_video_id?: string | null;
    siteBasePath?: string;
};

type HeroEpisode = {
    title?: string | null;
    slug?: string | null;
    image_url?: string | null;
    description?: string | null;
    published_at?: string | null;
};

function cleanText(value?: string | null, maxLength?: number) {
    if (!value) return '';
    const stripped = value
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!maxLength || stripped.length <= maxLength) return stripped;
    return `${stripped.slice(0, maxLength).trimEnd()}...`;
}

export default function HeroBlock({ podcast, latestEpisode }: { podcast: HeroPodcast, latestEpisode?: HeroEpisode }) {
    const layout = useLayout();
    const isNetflix = layout === 'netflix';
    const siteBasePath = podcast.siteBasePath || `/${podcast.id}`;

    if (isNetflix) {
        return (
            <section className="relative min-h-[560px] w-full overflow-hidden bg-black sm:min-h-[660px] lg:min-h-[calc(100vh-6rem)]">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0">
                    {podcast.latest_video_id ? (
                        <iframe
                            className="h-full w-full scale-110 object-cover opacity-100"
                            src={`https://www.youtube.com/embed/${podcast.latest_video_id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${podcast.latest_video_id}&showinfo=0&rel=0`}
                            allow="autoplay"
                        />
                    ) : (
                        <Image
                            src={latestEpisode?.image_url || podcast.image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'}
                            alt=""
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover opacity-90 brightness-75"
                        />
                    )}
                    {/* Netflix-style Overlays */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/72 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/66 to-black/8" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,transparent_0,rgba(0,0,0,0.36)_42%,rgba(0,0,0,0.82)_100%)]" />
                </div>

                {/* Structured Content Container */}
                <div className="relative z-10 flex min-h-[560px] flex-col justify-end px-4 pb-12 pt-20 sm:min-h-[660px] sm:px-6 sm:pb-16 lg:min-h-[calc(100vh-6rem)] lg:px-10 lg:pb-20 xl:px-16">
                    <div className="max-w-5xl space-y-4 sm:space-y-5">
                        {/* Podcast Branding (Secondary Title) */}
                        <div className="flex items-center gap-3 text-[var(--primary)]">
                            <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_22px_currentColor]" />
                            <span className="max-w-[80vw] truncate text-xs font-black uppercase tracking-[0.28em] drop-shadow-lg sm:text-sm">
                                Latest from {podcast.title}
                            </span>
                        </div>

                        {/* Main Episode Title (Primary) */}
                        <h1 className="max-w-[13ch] text-[clamp(2.65rem,8vw,6.8rem)] font-black uppercase italic leading-[0.96] tracking-normal text-white drop-shadow-2xl">
                            {latestEpisode?.title || 'Welcome'}
                        </h1>

                        <p className="max-w-2xl text-sm font-medium leading-7 text-zinc-200 drop-shadow-md sm:text-base md:text-lg">
                            {cleanText(latestEpisode?.description || podcast.description, 190)}
                        </p>

                        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-6">
                            <Link
                                href={latestEpisode ? `${siteBasePath}/episodes/${latestEpisode.slug}` : `${siteBasePath}/episodes`}
                                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-black uppercase tracking-normal text-black shadow-xl transition-all hover:bg-white/90 active:scale-95 sm:min-h-14 sm:px-8 sm:text-base"
                            >
                                <Play size={20} fill="currentColor" className="transition-transform group-hover:scale-110" />
                                Watch Now
                            </Link>
                            <Link
                                href={`${siteBasePath}/episodes`}
                                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-white/10 bg-white/14 px-6 py-3 text-sm font-black uppercase tracking-normal text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 sm:min-h-14 sm:px-8 sm:text-base"
                            >
                                <Info size={20} />
                                More Info
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (layout === 'substack') {
        return (
            <section className="relative mb-24 py-12 border-b border-[var(--border)] group/hero">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        {latestEpisode?.image_url && (
                            <div className="relative w-full md:w-1/3 shrink-0 aspect-square">
                                <Link href={`${siteBasePath}/episodes/${latestEpisode?.slug}`} className="block h-full w-full relative">
                                    <Image
                                        src={latestEpisode.image_url}
                                        alt={latestEpisode.title || ''}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        className="object-cover rounded shadow-lg transition-all duration-500 group-hover/hero:scale-102 group-hover/hero:shadow-2xl brightness-95 group-hover/hero:brightness-100"
                                    />
                                </Link>
                            </div>
                        )}
                        <div className="flex-1 text-center md:text-left">
                            <Link href={`${siteBasePath}/episodes/${latestEpisode?.slug}`} className="block group">
                                <h2 className="text-4xl font-serif font-black tracking-tight text-[var(--foreground)] md:text-5xl leading-tight transition-colors duration-200 group-hover:text-[var(--primary)]">
                                    {latestEpisode?.title}
                                </h2>
                            </Link>
                            <p className="mt-6 text-xl text-zinc-600 leading-relaxed font-serif opacity-80 group-hover/hero:opacity-100 transition-opacity duration-300">
                                {latestEpisode?.description?.replace(/<[^>]*>?/gm, '').slice(0, 200)}...
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4 justify-center md:justify-start">
                                <Link
                                    href={`${siteBasePath}/episodes/${latestEpisode?.slug}`}
                                    className="px-10 py-4 bg-zinc-900 text-white font-serif font-bold rounded shadow-lg hover:bg-[var(--primary)] hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
                                >
                                    Read and Listen
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (layout === 'genz') {
        return (
            <section className="relative mb-32 group">
                {/* Main Skewed Container */}
                <div className="relative border-x-8 border-b-8 border-black bg-white p-12 shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    {/* Pink/Red Top Border Accent */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />

                    <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                        {/* Image Box on Left */}
                        <div className="w-full md:w-1/2 shrink-0">
                            <div className="relative aspect-square border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white group-hover:shadow-none group-hover:translate-x-2 group-hover:translate-y-2 transition-all">
                                <Image
                                    src={latestEpisode?.image_url || podcast.image || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'}
                                    alt={latestEpisode?.title || 'Episode'}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <span className="bg-black text-white px-4 py-1 text-sm font-black uppercase tracking-widest">
                                    {latestEpisode?.published_at ? new Date(latestEpisode.published_at).toLocaleDateString() : 'LATEST DROP'}
                                </span>
                            </div>

                            <h2 className="text-6xl font-black uppercase italic tracking-tighter md:text-8xl leading-[0.8] mb-4">
                                {latestEpisode?.title || podcast.title}
                            </h2>

                            <p className="text-xl font-bold leading-tight max-w-xl text-zinc-800">
                                {latestEpisode?.description?.replace(/<[^>]*>?/gm, '').slice(0, 180)}...
                            </p>

                            <div className="flex flex-wrap gap-6 pt-6">
                                <Link
                                    href={`${siteBasePath}/episodes/${latestEpisode?.slug}`}
                                    className="group/btn relative inline-block bg-black text-white px-12 py-5 text-2xl font-black uppercase italic tracking-tighter hover:bg-[var(--primary)] hover:text-black hover:scale-105 active:scale-90 transition-all duration-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                                >
                                    <span className="relative z-10 transition-transform group-hover/btn:scale-110">TAP IN</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Skewed Background Element */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-zinc-50 -skew-x-12 translate-x-1/2 z-0" />
                </div>
            </section>
        );
    }

    // Default: Netflix Style (more of an info card since Layout has the big video)
    return (
        <section className="relative mb-24 max-w-4xl">
            {/* Minimal fallback or nothing as Netflix Layout renders the hero */}
        </section>
    );
}
