'use client';

import React, { useState } from 'react';
import { ShoppingBag, Lock, ShieldCheck } from 'lucide-react';

export default function ProductBlock({ product }: { product: any }) {
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
                    returnUrl: window.location.href, // User returns exactly where they were
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
        <div className="w-full py-16 animate-in slide-in-from-bottom-[50px] duration-1000 fade-in zoom-in-95">
            <div className="mx-auto max-w-4xl relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-[var(--background)] ring-1 ring-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-10 items-center justify-between">
                    
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none">
                        <ShoppingBag size={300} />
                    </div>

                    <div className="flex-1 space-y-6 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold uppercase tracking-widest border border-[var(--primary)]/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                            </span>
                            Premium Exclusive
                        </div>
                        
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight mb-3">
                                {product.title}
                            </h2>
                            <p className="text-lg text-[var(--foreground)]/70 leading-relaxed max-w-xl">
                                {product.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-medium text-[var(--foreground)]/50">
                            <span className="flex items-center gap-1.5"><Lock size={16} /> Secure Download</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Lifetime Access</span>
                        </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-4 z-10 bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <div className="text-center">
                            <span className="text-5xl font-black text-[var(--foreground)] tracking-tighter">
                                ${product.price.toFixed(2)}
                            </span>
                            <span className="text-[var(--foreground)]/50 ml-1 font-medium select-none">USD</span>
                        </div>
                        
                        <button
                            onClick={handleBuy}
                            disabled={isLoading}
                            className="w-full sm:w-64 py-4 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--background)] border-t-transparent" />
                            ) : (
                                <>Get Instant Access</>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
