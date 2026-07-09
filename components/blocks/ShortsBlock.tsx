'use client';

import React, { useState } from 'react';
import { Play, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ShortsBlock({ shorts, podcast }: { shorts: any[], podcast: any }) {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    if (!shorts || shorts.length === 0) return null;

    return (
        <section className="py-20 bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/20">
                            🎥 YouTube Shorts
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Watch Shorts
                        </h2>
                        {podcast && (
                            <div className="flex items-center gap-2 mt-2">
                                {podcast.image && (
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img src={podcast.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    From: {podcast.title || 'The Studio'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-3">
                        <button className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll Carousel */}
                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
                    {shorts.map((short) => (
                        <div 
                            key={short.youtube_video_id}
                            onClick={() => setSelectedVideo(short.youtube_video_id)}
                            className="flex-none w-[280px] aspect-[9/16] relative rounded-[2rem] overflow-hidden group cursor-pointer snap-start bg-zinc-900 border border-white/5 transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <img 
                                src={short.thumbnail} 
                                alt={short.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            {/* Duration Badge */}
                            {short.duration && (
                                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-black text-white flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500" />
                                    {short.duration}
                                </div>
                            ) }

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            
                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <div className="self-end">
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <Play size={20} fill="currentColor" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight tracking-tight">
                                    {short.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Player */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-300">
                    <button 
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 sm:top-10 sm:right-10 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="w-full max-w-[450px] aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </section>
    );
}
