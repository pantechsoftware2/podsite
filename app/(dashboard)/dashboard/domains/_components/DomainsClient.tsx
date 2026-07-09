'use client';

import React, { useState } from 'react';
import { Globe, AlertCircle, Copy, Check, Loader2, ArrowRight, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DomainsClient({ podcastId, initialDomain }: { podcastId: string, initialDomain: string | null }) {
    const [domain, setDomain] = useState(initialDomain || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedDomain, setSavedDomain] = useState(initialDomain || '');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // New state for verification
    const router = useRouter();

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain) return;

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, podcastId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add domain');
            }

            setSavedDomain(domain);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkVerification = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/domains/check?domain=${savedDomain}`);
            const data = await res.json();
            if (data.verified) {
                setIsVerified(true);
                router.refresh();
                // Send "Your domain is live" email to owner
                fetch('/api/emails/domain-live', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain: savedDomain, podcastId }),
                }).catch(() => {});
            }
        } catch (err) {
            console.error('Verification check failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid gap-8">
            {/* 1. Add Domain Section */}
            <section className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 md:p-12 backdrop-blur-xl">
                <form onSubmit={handleAddDomain} className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-2xl bg-[var(--podcast-primary)]/10 flex items-center justify-center text-[var(--podcast-primary)]">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase">1. Link your domain</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group">
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                                placeholder="podcastsite.com"
                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white font-mono focus:outline-none focus:border-[var(--podcast-primary)]/50 transition-all placeholder:text-slate-700"
                                disabled={isSubmitting}
                            />
                            {savedDomain && !error && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in">
                                    <Check size={24} />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || domain === savedDomain || !domain}
                            className="w-full md:w-auto px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] italic hover:bg-[var(--podcast-primary)] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
                            {savedDomain === domain ? 'Domain Linked!' : (savedDomain ? 'Update Domain' : 'Save Domain')}
                        </button>
                    </div>
                </form>
            </section>

            {/* 2. DNS Instructions (Visible once domain is saved) */}
            {savedDomain && !error && (
                <section className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 md:p-12 backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center justify-between gap-3 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight uppercase">2. Configure DNS</h2>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
                            <div className={`h-2 w-2 rounded-full ${isVerified ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                {isVerified ? 'DNS Verified' : 'Pending DNS'}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                        Update your DNS settings at your domain registrar (GoDaddy, Namecheap, etc.) to point to our servers:
                    </p>

                    <div className="space-y-4">
                        <div className="group rounded-2xl border border-white/5 bg-slate-950 p-6 hover:border-white/10 transition-all relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">A Record</span>
                                <button onClick={() => copyToClipboard('76.76.21.21')} className="text-[var(--podcast-primary)] hover:text-white transition-colors"><Copy size={14} /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                                <div className="col-span-1 text-slate-500">Hostname</div>
                                <div className="col-span-2 text-white">@</div>
                                <div className="col-span-1 text-slate-500">Value</div>
                                <div className="col-span-2 text-[var(--podcast-primary)] font-black uppercase">76.76.21.21</div>
                            </div>
                            {copied && <span className="absolute top-4 right-12 text-[10px] bg-emerald-500 text-black px-2 py-1 rounded font-bold animate-in fade-in">COPIED!</span>}
                        </div>

                        <div className="group rounded-2xl border border-white/5 bg-slate-950 p-6 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CNAME Record</span>
                                <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="text-[var(--podcast-primary)] hover:text-white transition-colors"><Copy size={14} /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                                <div className="col-span-1 text-slate-500">Hostname</div>
                                <div className="col-span-2 text-white">www</div>
                                <div className="col-span-1 text-slate-500">Value</div>
                                <div className="col-span-2 text-[var(--podcast-primary)] font-black uppercase">cname.vercel-dns.com</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center gap-6">
                        <button
                            onClick={checkVerification}
                            disabled={isSubmitting || isVerified}
                            className={`w-full md:w-auto px-10 py-4 rounded-xl border-2 border-[var(--podcast-primary)] text-[var(--podcast-primary)] font-black uppercase tracking-widest text-xs hover:bg-[var(--podcast-primary)] hover:text-black transition-all flex items-center justify-center gap-2`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                            {isVerified ? 'Configuration Verified' : 'Verify DNS Status'}
                        </button>

                        <a
                            href={`https://${savedDomain}`}
                            target="_blank"
                            className="w-full md:w-auto px-10 py-4 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white font-bold text-xs uppercase tracking-[0.15em] transition-all text-center flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={16} />
                            Visit Site
                        </a>
                    </div>
                </section>
            )}
        </div>
    );
}
