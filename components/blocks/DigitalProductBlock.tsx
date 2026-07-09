'use client';

import React, { useState } from 'react';
import { ShoppingBag, Lock, ShieldCheck } from 'lucide-react';
import { createStripeCheckout } from '@/lib/stripe';

export default function DigitalProductBlock({ product }: { product: any }) {
    const [isLoading, setIsLoading] = useState(false);

    if (!product) return null;

    const handleBuy = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    podcastId: product.podcast_id,
                    returnUrl: window.location.href,
                }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div id="product" className="w-full py-16 animate-in slide-in-from-bottom-[50px] duration-1000 fade-in zoom-in-95 scroll-mt-24">
            <div className="mx-auto max-w-4xl relative group px-4">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-zinc-950/80 ring-1 ring-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-10 items-center justify-between backdrop-blur-xl">
                    
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none">
                        <ShoppingBag size={300} />
                    </div>

                    <div className="flex-1 space-y-6 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Store Item
                        </div>
                        
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic mb-3">
                                {product.title}
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
                                {product.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><Lock size={12} className="text-primary" /> Secure Download</span>
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><ShieldCheck size={12} className="text-primary" /> Lifetime Access</span>
                        </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-4 z-10 bg-white/5 p-10 rounded-[2rem] border border-white/5 backdrop-blur-md">
                        <div className="text-center">
                            <span className="text-5xl font-black text-white tracking-tighter italic">
                                ${product.price ? product.price.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-slate-500 ml-2 font-black text-xs select-none">USD</span>
                        </div>
                        
                        <button
                            onClick={handleBuy}
                            disabled={isLoading}
                            className="w-full sm:w-64 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.2em] italic hover:bg-primary transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            ) : (
                                <>Get Access Now</>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
