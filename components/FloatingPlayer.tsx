// components/FloatingPlayer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function FloatingPlayer({ youtubeVideoId, title }: { youtubeVideoId: string, title?: string }) {
    const [isFloating, setIsFloating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFloating(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="mb-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            <div className={isFloating ? "fixed bottom-4 right-4 z-[9999] w-[300px] shadow-2xl transition-all animate-in slide-in-from-bottom-4" : "h-full w-full"}>
                <div className="relative aspect-video w-full">
                    <iframe
                        className="h-full w-full rounded-xl"
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title={title || 'Episode video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                    {isFloating && (
                        <button
                            onClick={() => setIsFloating(false)}
                            className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
