'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeEngine from '@/components/ThemeEngine';
import GridBlock from '@/components/blocks/GridBlock';
import LivePodcastManager from '@/components/public/LivePodcastManager';
import SubscribeModal from '@/components/public/SubscribeModal';

export default function EpisodesPageWrapper({ podcast, themeConfig, layoutComponent: LayoutComponent, episodes, subdomain, q }: any) {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const siteBasePath = podcast.siteBasePath || `/${subdomain}`;

  return (
    <LivePodcastManager initialPodcast={podcast as any}>
      {(livePodcast: any) => (
        <>
          <ThemeEngine config={themeConfig} />
          <LayoutComponent 
            podcast={livePodcast}
            onSubscribeClick={() => setIsSubscribeOpen(true)}
          >
            <div className="mx-auto max-w-7xl px-4 py-20">
              <header className="mb-16">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase md:text-6xl leading-none">
                  {q ? `Searching for "${q}"` : 'All Episodes'}
                </h1>
                <p className="mt-4 text-zinc-500 font-medium tracking-widest uppercase text-sm">
                  Showing {episodes?.length || 0} episodes
                </p>
              </header>

              <GridBlock podcast={livePodcast} episodes={episodes || []} />

              {!episodes?.length && (
                <div className="py-20 text-center border-4 border-dashed border-zinc-100 rounded-sm">
                  <p className="text-zinc-400 font-black uppercase italic text-2xl tracking-tighter">no archive</p>
                  <p className="text-zinc-500 font-bold italic mt-2">Check back later for more episodes!</p>
                  <Link href={siteBasePath || '/'} className="mt-8 inline-block bg-primary text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">
                    Back to Home
                  </Link>
                </div>
              )}
            </div>
          </LayoutComponent>
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
