'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function LiveLayoutController({
  initialLayout,
  blocks,
  editMode = false,
}: {
  initialLayout: string[];
  blocks: Record<string, ReactNode>;
  editMode?: boolean;
}) {
  const [layout, setLayout] = useState<string[]>(initialLayout);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_LAYOUT') {
        setLayout(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col">
      {layout.map((blockId) => (
        <div
          key={blockId}
          className={editMode ? 'group relative cursor-pointer outline outline-1 -outline-offset-1 outline-transparent transition hover:outline-emerald-300' : undefined}
          onClick={editMode ? (event) => {
            event.stopPropagation();
            setActiveBlock(blockId);
          } : undefined}
        >
          {editMode && (
            <div className="pointer-events-none absolute left-3 top-3 z-[60] rounded-md bg-black/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg backdrop-blur-sm transition group-hover:opacity-100">
              Edit {blockId}
            </div>
          )}
          {blocks[blockId]}
          {editMode && activeBlock === blockId && (
            <div
              className="absolute right-4 top-4 z-[70] w-[min(280px,calc(100vw-2rem))] rounded-lg border border-white/15 bg-zinc-950 p-4 text-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Section</p>
                  <h3 className="text-base font-black capitalize">{blockId}</h3>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white hover:text-black"
                  onClick={() => setActiveBlock(null)}
                >
                  Close
                </button>
              </div>
              <div className="grid gap-2">
                <button type="button" className="rounded-md bg-white px-3 py-2 text-left text-xs font-bold text-black">
                  Edit content
                </button>
                <button type="button" className="rounded-md border border-white/10 px-3 py-2 text-left text-xs font-bold text-white">
                  Regenerate section
                </button>
                <button type="button" className="rounded-md border border-white/10 px-3 py-2 text-left text-xs font-bold text-white">
                  Hide section
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
