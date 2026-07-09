'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function LiveLayoutManager({
    initialLayout,
    blocks
}: {
    initialLayout: string[],
    blocks: Record<string, ReactNode>
}) {
    const [layout, setLayout] = useState<string[]>(initialLayout);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.parent !== window) {
            const handleMessage = (e: MessageEvent) => {
                if (e.data?.type === 'UPDATE_LAYOUT') {
                    setLayout(e.data.payload);
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, []);

    return (
        <div className="flex flex-col w-full">
            {layout.map((blockType, idx) => (
                <div key={`${blockType}-${idx}`}>
                    {blocks[blockType] || null}
                </div>
            ))}
        </div>
    );
}
