// components/EpisodePlayer.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import FloatingPlayer from './FloatingPlayer';
import { Play, Pause, Video, Headphones, Clock, X } from 'lucide-react';
import PlatformHandoffLinks, { type PlatformHandoffConfig } from '@/components/public/PlatformHandoffLinks';

interface EpisodePlayerProps {
    youtubeVideoId?: string | null;
    audioUrl?: string | null;
    title: string;
    description: string;
    podcastId: string;
    primaryColor?: string;
    accentColor?: string;
    platformLinks?: Omit<PlatformHandoffConfig, 'youtubeVideoId'>;
}

export default function EpisodePlayer({
    youtubeVideoId,
    audioUrl,
    title,
    description,
    platformLinks,
    primaryColor = '#6366f1',
    accentColor = '#8b5cf6'
}: EpisodePlayerProps) {
    const hasBoth = !!(youtubeVideoId && audioUrl);
    const [mode, setMode] = useState<'video' | 'audio' | null>(() => {
        if (hasBoth) return null;
        if (youtubeVideoId) return 'video';
        if (audioUrl) return 'audio';
        return null;
    });
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSticky, setIsSticky] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handoffConfig = platformLinks
        ? { ...platformLinks, youtubeVideoId }
        : null;

    // Intersection Observer for Sticky Mode
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Stick if we've scrolled past the player
                setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
            },
            { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Sync Audio State
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateState = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
            setIsPlaying(!audio.paused);
        };

        audio.addEventListener('timeupdate', updateState);
        audio.addEventListener('play', updateState);
        audio.addEventListener('pause', updateState);
        audio.addEventListener('loadedmetadata', updateState);

        return () => {
            audio.removeEventListener('timeupdate', updateState);
            audio.removeEventListener('play', updateState);
            audio.removeEventListener('pause', updateState);
            audio.removeEventListener('loadedmetadata', updateState);
        };
    }, [mode]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const seekTo = (seconds: number) => {
        if (mode === 'audio' && audioRef.current) {
            audioRef.current.currentTime = seconds;
            audioRef.current.play();
        } else if (mode === 'video' || (youtubeVideoId && !mode)) {
            if (mode !== 'video') setMode('video');
            // Small delay to ensure iframe is rendered if mode just changed
            setTimeout(() => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    const currentSrc = new URL(iframe.src);
                    currentSrc.searchParams.set('start', seconds.toString());
                    currentSrc.searchParams.set('autoplay', '1');
                    iframe.src = currentSrc.toString();
                }
            }, mode === 'video' ? 0 : 300);
        }
    };

    const processedDescription = React.useMemo(() => {
        const parseTimestamps = (text: string) => {
            const timestampRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
            return text.replace(timestampRegex, (match) => {
                const parts = match.split(':').map(Number);
                let seconds = 0;
                if (parts.length === 3) {
                    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else {
                    seconds = parts[0] * 60 + parts[1];
                }
                return `<button data-timestamp="${seconds}" class="timestamp-link text-primary font-mono font-bold hover:underline cursor-pointer bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 transition-all hover:bg-primary/10 inline-flex items-center gap-1 mx-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${match}
                </button>`;
            });
        };
        return parseTimestamps(description);
    }, [description]);

    const handleDescClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('[data-timestamp]');
        if (target) {
            const seconds = parseInt(target.getAttribute('data-timestamp') || '0');
            seekTo(seconds);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="space-y-12 min-h-[400px]"
            style={{
                '--podcast-primary': primaryColor,
                '--podcast-accent': accentColor,
            } as React.CSSProperties}
        >
            {/* Selection Overlay (Vibrant Magic) */}
            {hasBoth && mode === null && (
                <div
                    className="relative animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center justify-center rounded-[3rem] bg-zinc-950 px-8 py-20 text-center border-4 border-white/5 shadow-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[var(--podcast-primary)]/5 opacity-50 blur-3xl rounded-full -top-1/2 -right-1/4 h-[200%] w-[200%]" />
                    <div className="max-w-md relative z-10">
                        <h3 className="text-4xl font-black tracking-tighter mb-4 text-white italic leading-tight">
                            Choose Your Experience
                        </h3>
                        <p className="text-zinc-400 mb-12 text-lg font-bold uppercase tracking-widest opacity-80">Watch on YouTube or Listen in Hi-Fi</p>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <button
                                onClick={() => setMode('video')}
                                className="group flex-1 flex flex-col items-center gap-6 rounded-[2.5rem] bg-white/5 p-10 transition-all hover:scale-[1.05] active:scale-[0.98] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-[var(--podcast-primary)]/50 hover:shadow-[0_0_40px_-10px_var(--podcast-primary)]"
                            >
                                <div className="h-20 w-20 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                    <Video size={36} strokeWidth={2} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black uppercase italic text-white tracking-tighter">Watch</p>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Video Experience</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('audio')}
                                className="group flex-1 flex flex-col items-center gap-6 rounded-[2.5rem] bg-white/5 p-10 transition-all hover:scale-[1.05] active:scale-[0.98] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-[var(--podcast-primary)]/50 hover:shadow-[0_0_40px_-10px_var(--podcast-primary)]"
                            >
                                <div className="h-20 w-20 rounded-[1.5rem] bg-[var(--podcast-primary)]/10 flex items-center justify-center text-[var(--podcast-primary)] border border-[var(--podcast-primary)]/20">
                                    <Headphones size={36} strokeWidth={2} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black uppercase italic text-white tracking-tighter">Listen</p>
                                    <p className="text-[10px] font-black text-[var(--podcast-primary)] uppercase tracking-widest">Hi-Fi Audio</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Switcher (Vibrant Dynamic) */}
            {hasBoth && mode !== null && (
                <div className="flex justify-center animate-in fade-in duration-700">
                    <div className="inline-flex rounded-3xl bg-zinc-950 p-2 border-2 border-white/5 shadow-2xl">
                        <button
                            onClick={() => setMode('video')}
                            className={`flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-[var(--podcast-primary)] text-black shadow-[0_0_20px_var(--podcast-primary)]' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Video size={18} strokeWidth={2.5} />
                            Watch
                        </button>
                        <button
                            onClick={() => setMode('audio')}
                            className={`flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest transition-all ${mode === 'audio' ? 'bg-[var(--podcast-primary)] text-black shadow-[0_0_20px_var(--podcast-primary)]' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Headphones size={18} strokeWidth={2.5} />
                            Listen
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div ref={containerRef} className="relative">
                {mode === 'video' && youtubeVideoId && (
                    <div className="animate-in fade-in zoom-in-95 duration-700 overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        <FloatingPlayer youtubeVideoId={youtubeVideoId} title={title} />
                    </div>
                )}

                {mode === 'audio' && audioUrl && (
                    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 rounded-[3rem] border-4 border-white/5 bg-zinc-950 p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-[var(--podcast-primary)]/10 blur-[80px]" />
                        <div className="flex items-center gap-8 mb-12 relative z-10">
                            <div className="h-20 w-20 rounded-[1.5rem] bg-[var(--podcast-primary)]/10 flex items-center justify-center text-[var(--podcast-primary)] border border-[var(--podcast-primary)]/20 shadow-xl">
                                <Headphones size={36} strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-3xl font-black tracking-tighter text-white italic">Audio Experience</h4>
                                <p className="text-[10px] font-black text-[var(--podcast-primary)] uppercase tracking-[0.3em] mt-1">High Fidelity Production</p>
                            </div>
                        </div>
                        <audio
                            ref={audioRef}
                            controls
                            src={audioUrl}
                            className="w-full focus:outline-none filter invert brightness-100 opacity-90 transition-opacity hover:opacity-100"
                        >
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {!audioUrl && !youtubeVideoId && mode !== null && (
                    <div className="animate-in fade-in zoom-in-95 duration-700 rounded-[3rem] bg-zinc-950 border-4 border-white/5 p-16 text-center shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-[var(--podcast-accent)]/5 blur-3xl opacity-30" />
                        <div className="relative z-10">
                            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[var(--podcast-accent)]/10 text-[var(--podcast-accent)] border border-[var(--podcast-accent)]/20 shadow-xl">
                                <Clock size={40} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-4xl font-black tracking-tighter text-white italic mb-4">Reading Mode</h4>
                            <p className="text-zinc-400 max-w-sm mx-auto font-bold uppercase tracking-widest text-[10px] opacity-60 leading-relaxed">This episode is text-only. Enjoy the full story below.</p>
                        </div>
                    </div>
                )}
            </div>

            {handoffConfig && (
                <PlatformHandoffLinks
                    {...handoffConfig}
                    className="animate-fade-in-up [animation-delay:120ms]"
                />
            )}

            {/* Sticky/Floating Player */}
            {isSticky && (
                <>
                    {mode === 'audio' && audioUrl && (
                        <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-black bg-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300">
                            <div className="mx-auto flex max-w-4xl items-center gap-4">
                                <button
                                    onClick={togglePlay}
                                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(var(--podcast-primary-rgb),0.5)] transition-transform hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                                >
                                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="truncate text-sm font-black uppercase tracking-tighter italic">{title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold font-mono">{formatTime(currentTime)}</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-black"
                                        />
                                        <span className="text-[10px] font-bold font-mono">{formatTime(duration)}</span>
                                    </div>
                                </div>
                                {handoffConfig && (
                                    <PlatformHandoffLinks
                                        {...handoffConfig}
                                        compact
                                        className="hidden sm:flex"
                                    />
                                )}
                                <button
                                    onClick={() => setIsSticky(false)}
                                    className="h-10 w-10 flex items-center justify-center border-2 border-black hover:bg-slate-100 bg-white text-black"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'video' && youtubeVideoId && (
                        <div className="fixed bottom-6 right-6 z-[100] w-[320px] shadow-2xl transition-all animate-in slide-in-from-bottom-4">
                            <div className="relative aspect-video w-full group overflow-hidden rounded-2xl border-4 border-black">
                                <iframe
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0`}
                                    title={title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <button
                                    onClick={() => setIsSticky(false)}
                                    className="absolute -top-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:bg-primary transition-colors opacity-0 group-hover:opacity-100 border-2 border-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Show Notes (Vibrant & High Reading Energy) */}
            <section className="animate-fade-in-up [animation-delay:200ms] rounded-[3rem] bg-zinc-950 border-4 border-white/5 p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute h-80 w-80 bg-[var(--podcast-primary)]/5 blur-[120px] -left-20 -bottom-20" />
                <div className="flex items-center gap-6 mb-12 border-b-2 border-white/5 pb-10 relative z-10">
                    <div className="h-14 w-14 bg-[var(--podcast-primary)]/10 flex items-center justify-center text-[var(--podcast-primary)] rounded-[1.2rem] border-2 border-[var(--podcast-primary)]/30 shadow-[0_0_20px_var(--podcast-primary)]/20 transition-transform hover:rotate-6">
                        <Clock size={28} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">The Full Story</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--podcast-primary)] opacity-60">Deep Dive Show Notes</p>
                    </div>
                </div>
                <div
                    onClick={handleDescClick}
                    className="prose prose-zinc dark:prose-invert max-w-none text-xl leading-relaxed text-zinc-300 space-y-10 relative z-10 selection:bg-[var(--podcast-primary)]/30"
                    dangerouslySetInnerHTML={{ __html: processedDescription }}
                />
            </section>
        </div>
    );
}
