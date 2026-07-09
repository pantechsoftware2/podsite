'use client';
import React from 'react';
import { useLayout } from '../LayoutContext';

export default function HostBlock({ podcast }: { podcast: any }) {
    const layout = useLayout();
    if (layout === 'substack') {
        return (
            <section id="host" className="mb-24 flex flex-col items-center text-center">
                <div className="h-24 w-24 bg-zinc-50 rounded-full flex items-center justify-center text-4xl mb-8 border border-zinc-100 italic grayscale shadow-inner">
                    👤
                </div>
                <h3 className="text-3xl font-black italic tracking-tighter mb-4">About the Host</h3>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-xl italic">
                    The brilliant mind behind <strong>{podcast.title}</strong>.
                    Sharing insights, stories, and deep dives into the topics that matter most.
                    Join the conversation every week.
                </p>
            </section>
        );
    }

    if (layout === 'genz') {
        return (
            <section id="host" className="relative mb-32 group">
                <div className="absolute -inset-4 bg-black rotate-1 border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]" />
                <div className="relative border-8 border-black bg-white p-12 z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="shrink-0 h-40 w-40 border-8 border-black bg-[var(--primary)] flex items-center justify-center text-6xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        👤
                    </div>
                    <div>
                        <h3 className="text-5xl font-black uppercase italic tracking-tighter mb-6">Who's Talking?</h3>
                        <p className="text-2xl font-bold uppercase italic leading-tight mb-8">
                            The mind behind <span className="bg-black text-white px-2 leading-none">{podcast.title}</span>. Sharing raw thoughts and deep dives.
                        </p>
                        <div className="flex gap-4">
                            <div className="border-4 border-black bg-black p-4 text-white text-xl font-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">𝕏</div>
                            <div className="border-4 border-black bg-black p-4 text-white text-xl font-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">in</div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="host" className="mb-24 max-w-4xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12 bg-zinc-900/40 p-12 rounded-sm border border-zinc-800">
                <div className="shrink-0 h-40 w-40 rounded-sm overflow-hidden border-2 border-zinc-800 shadow-2xl">
                    <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-6xl">
                        👤
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-6 w-1 bg-[var(--primary)]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Creator</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-6">About the Host</h3>
                    <p className="text-xl text-zinc-400 font-medium leading-[1.6]">
                        Living the dream with <strong>{podcast.title}</strong>.
                        We dive deep into stories that matter, from tech to culture and everything in between.
                    </p>
                </div>
            </div>
        </section>
    );
}
