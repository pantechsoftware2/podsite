'use client';

import Link from 'next/link';

type Podcast = {
  id: string;
  title: string;
  description: string | null;
  rss_url: string | null;
  youtube_channel_id: string | null;
  theme_config?: {
    imageUrl?: string;
    primaryColor?: string;
  };
};

export function PodcastCard({ podcast }: { podcast: Podcast }) {
  const imageUrl = podcast.theme_config?.imageUrl;

  return (
    <Link
      href={`/podcasts/${podcast.id}/episodes`}
      className="group relative flex gap-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-3 transition-all hover:border-slate-700 hover:bg-slate-900"
    >
      {/* Small Podcast Image */}
      {imageUrl && (
        <div className="shrink-0">
          <img
            src={imageUrl}
            alt={podcast.title}
            className="h-12 w-12 rounded-md object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">
          {podcast.title}
        </h3>
        {podcast.description && (
          <p className="line-clamp-2 text-xs text-slate-400">
            {podcast.description}
          </p>
        )}
      </div>
    </Link>
  );
}
