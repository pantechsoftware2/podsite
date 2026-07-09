import Link from 'next/link';
import { ChevronLeft, Youtube } from 'lucide-react';
import { isVideoSyncEnabled } from '@/lib/featureFlags';

export default function VideoSyncPage() {
    if (!isVideoSyncEnabled()) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-4 space-y-6">
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                        <Youtube size={12} />
                        Private Beta
                    </div>
                    <h1 className="mt-4 text-3xl font-black text-white tracking-tight">Video sync is still being hardened</h1>
                    <p className="mt-3 text-slate-300">
                        The YouTube matching workflow is not ready for shared use yet, so this area is intentionally disabled in launch builds.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-6 py-2 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:text-white"
                    >
                        <ChevronLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-16 px-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Video sync enabled</h1>
                <p className="mt-3 text-slate-300">
                    This build has video sync enabled, but you should still verify the matching flow manually before wider sharing.
                </p>
            </div>
        </div>
    );
}
