'use client';

import React, { useState } from 'react';
import { MatchResult } from '@/lib/youtube/fuzzyMatcher';
import { approveMatch, rejectMatch } from '../actions';
import { Check, X, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VideoSyncClient({
    matches,
    unmatchedEpisodes
}: {
    matches: MatchResult[];
    unmatchedEpisodes: any[];
}) {
    const [pendingMatches, setPendingMatches] = useState(matches);
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualVideoIds, setManualVideoIds] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleApprove = async (match: MatchResult) => {
        setIsProcessing(true);
        try {
            await approveMatch(match.episodeId, match.videoId);
            setPendingMatches(prev => prev.filter(m => m.episodeId !== match.episodeId));
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (match: MatchResult) => {
        setIsProcessing(true);
        try {
            await rejectMatch(match.episodeId);
            setPendingMatches(prev => prev.filter(m => m.episodeId !== match.episodeId));
            router.refresh(); // Reflect changes in DB
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveAll = async () => {
        setIsProcessing(true);
        try {
            for (const match of pendingMatches) {
                await approveMatch(match.episodeId, match.videoId);
            }
            setPendingMatches([]);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualLink = async (episodeId: string) => {
        const videoId = manualVideoIds[episodeId];
        if (!videoId) return;

        // rudimentary extraction of ID from URL
        let cleanId = videoId;
        if (videoId.includes('v=')) {
            const match = videoId.match(/[?&]v=([^&]+)/);
            if (match) cleanId = match[1];
        } else if (videoId.includes('youtu.be/')) {
            const match = videoId.match(/youtu\.be\/([^?]+)/);
            if (match) cleanId = match[1];
        }

        setIsProcessing(true);
        try {
            await approveMatch(episodeId, cleanId);
            setManualVideoIds(prev => {
                const next = { ...prev };
                delete next[episodeId];
                return next;
            });
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-16 pb-24">
            {/* AI Matches */}
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3 border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            AI Powered Analysis
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Suggested Matches</h2>
                        <p className="text-sm text-slate-400 mt-2">Our algorithm found {pendingMatches.length} high-confidence links between your audio and YouTube videos.</p>
                    </div>
                    {pendingMatches.length > 0 && (
                        <button
                            onClick={handleApproveAll}
                            disabled={isProcessing}
                            className="bg-white text-black hover:bg-primary font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            Approve All ({pendingMatches.length})
                        </button>
                    )}
                </div>

                {pendingMatches.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-12 text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Check size={32} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">Everything is synced up perfectly.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pendingMatches.map((match) => (
                            <div key={match.episodeId} className="group flex flex-col lg:flex-row gap-6 lg:items-center justify-between bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] transition-all hover:bg-slate-900/60 hover:border-primary/20">
                                <div className="flex-1 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                RSS Episode
                                            </div>
                                            <p className="text-base font-bold text-white line-clamp-2 leading-tight">{match.episodeTitle}</p>
                                        </div>
                                        <div className="space-y-2 relative">
                                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 hidden md:block">
                                                <LinkIcon size={14} className="text-primary/40 rotate-45" />
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                YouTube Video
                                            </div>
                                            <p className="text-base font-bold text-white line-clamp-2 leading-tight">{match.videoTitle}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded border border-primary/10">
                                            {Math.round(match.confidence * 100)}% Match
                                        </div>
                                        {match.matchReasons.map((reason, i) => (
                                            <span key={i} className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-1 rounded border border-white/5">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleApprove(match)}
                                        disabled={isProcessing}
                                        className="h-12 px-6 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        <Check size={16} strokeWidth={3} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(match)}
                                        disabled={isProcessing}
                                        className="h-12 w-12 flex items-center justify-center bg-slate-800 text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Manual Linking Fallback */}
            <div className="space-y-8 pt-16 border-t border-white/5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <AlertCircle size={24} className="text-slate-500" />
                        Unmapped Episodes
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">Can't find a match? Link them manually by pasting the YouTube ID or URL.</p>
                </div>

                {unmatchedEpisodes.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-12 text-center text-slate-600 italic">
                        All episodes are currently mapped.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {unmatchedEpisodes.slice(0, 10).map((ep) => (
                            <div key={ep.id} className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-slate-900/30 border border-white/5 p-6 rounded-2xl hover:bg-slate-900/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-200 truncate">{ep.title}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                        Published {new Date(ep.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-80">
                                    <div className="relative flex-1">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                        <input
                                            type="text"
                                            placeholder="YouTube ID or URL"
                                            value={manualVideoIds[ep.id] || ''}
                                            onChange={(e) => setManualVideoIds(prev => ({ ...prev, [ep.id]: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleManualLink(ep.id)}
                                        disabled={isProcessing || !manualVideoIds[ep.id]}
                                        className="bg-white text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary transition-all active:scale-95"
                                    >
                                        Link
                                    </button>
                                </div>
                            </div>
                        ))}
                        {unmatchedEpisodes.length > 10 && (
                            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-black pt-4">
                                + {unmatchedEpisodes.length - 10} more episodes
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
