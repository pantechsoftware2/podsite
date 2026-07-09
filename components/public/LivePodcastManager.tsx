'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface Podcast {
  id: string;
  title: string;
  description?: string;
  [key: string]: any;
}

export default function LivePodcastManager({
  initialPodcast,
  children,
}: {
  initialPodcast: Podcast;
  children: (podcast: Podcast) => ReactNode;
}) {
  const [podcast, setPodcast] = useState<Podcast>(initialPodcast);
  const pathname = usePathname();

  useEffect(() => {
    // Listen for metadata updates from parent (SplitScreenEditor)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_PODCAST') {
        setPodcast(prev => ({ 
          ...prev, 
          ...event.data.payload 
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Also update when initialPodcast changes (e.g. server-side navigation)
  useEffect(() => {
    setPodcast(initialPodcast);
  }, [initialPodcast.id, initialPodcast.title, initialPodcast.description]);

  return <>{children(podcast)}</>;
}
