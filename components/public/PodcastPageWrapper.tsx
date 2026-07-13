'use client';

import React, { useState, useMemo } from 'react';
import ThemeEngine, { ThemeConfig } from '@/components/ThemeEngine';
import NetflixLayout from '@/components/layouts/NetflixLayout';
import SubstackLayout from '@/components/layouts/SubstackLayout';
import GenZLayout from '@/components/layouts/GenZLayout';
import LiveLayoutController from '@/components/dashboard/LiveLayoutController';
import LivePodcastManager from '@/components/public/LivePodcastManager';
import SubscribeModal from '@/components/public/SubscribeModal';

type PublicPodcast = {
  id: string;
  title: string;
  rss_url?: string | null;
  generatedPages?: ThemeConfig['generatedPages'];
  [key: string]: unknown;
};

type PodcastPageWrapperProps = {
  podcast: PublicPodcast;
  themeConfig: ThemeConfig;
  layoutComponent?: unknown;
  pageLayout: string[];
  blockDict: Record<string, React.ReactNode>;
  editMode?: boolean;
};

export default function PodcastPageWrapper({ 
  podcast, 
  themeConfig: initialThemeConfig, 
  pageLayout, 
  blockDict,
  editMode = false,
}: PodcastPageWrapperProps) {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState(initialThemeConfig);
  
  // Decide which layout component to use based on the live themeConfig
  const CurrentLayout = useMemo(() => {
    const layout = themeConfig.layout || 'netflix';
    if (layout === 'substack') return SubstackLayout;
    if (layout === 'genz') return GenZLayout;
    return NetflixLayout;
  }, [themeConfig.layout]);

  return (
    <LivePodcastManager initialPodcast={podcast}>
      {(livePodcast) => (
        <>
          <ThemeEngine 
            config={themeConfig} 
            onConfigChange={(newConfig) => setThemeConfig(newConfig)} 
          />
          <CurrentLayout 
            podcast={{
              ...livePodcast,
              generatedPages: livePodcast.generatedPages || themeConfig.generatedPages || [],
              twitterUrl: themeConfig.twitterUrl,
              linkedInUrl: themeConfig.linkedInUrl,
              youtubeUrl: themeConfig.youtubeUrl,
              spotifyUrl: themeConfig.spotifyUrl,
              rssUrl: themeConfig.rssUrlOverride || livePodcast.rss_url || undefined,
            }}
            editMode={editMode}
            onSubscribeClick={() => setIsSubscribeOpen(true)}
          >
            <LiveLayoutController initialLayout={pageLayout} blocks={blockDict} editMode={editMode} />
          </CurrentLayout>
          {editMode && (
            <div className="fixed left-0 right-0 top-0 z-[80] border-b border-white/10 bg-black/85 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Editing live site</p>
                  <p className="text-sm font-semibold">{livePodcast.title}</p>
                </div>
                <a
                  href={`/${livePodcast.id}`}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
                >
                  Done
                </a>
              </div>
            </div>
          )}
          <SubscribeModal 
            isOpen={isSubscribeOpen} 
            onClose={() => setIsSubscribeOpen(false)} 
            podcastTitle={livePodcast.title}
          />
        </>
      )}
    </LivePodcastManager>
  );
}
