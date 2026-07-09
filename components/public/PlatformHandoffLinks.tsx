'use client';

import React from 'react';
import { Apple, ExternalLink, Music, Rss, Youtube } from 'lucide-react';

export type PlatformHandoffConfig = {
    podcastTitle: string;
    applePodcastsUrl?: string | null;
    spotifyUrl?: string | null;
    youtubeUrl?: string | null;
    youtubeVideoId?: string | null;
    rssUrl?: string | null;
};

type Props = PlatformHandoffConfig & {
    compact?: boolean;
    className?: string;
};

function searchUrl(platform: 'apple' | 'spotify' | 'youtube', podcastTitle: string) {
    const encodedTitle = encodeURIComponent(podcastTitle);

    if (platform === 'apple') return `https://podcasts.apple.com/search?term=${encodedTitle}`;
    if (platform === 'spotify') return `https://open.spotify.com/search/${encodedTitle}`;
    return `https://www.youtube.com/results?search_query=${encodedTitle}`;
}

export function getPlatformHandoffLinks(config: PlatformHandoffConfig) {
    return [
        {
            name: 'Spotify',
            helper: 'Continue in app',
            url: config.spotifyUrl || searchUrl('spotify', config.podcastTitle),
            Icon: Music,
        },
        {
            name: 'Apple',
            helper: 'Open podcast',
            url: config.applePodcastsUrl || searchUrl('apple', config.podcastTitle),
            Icon: Apple,
        },
        {
            name: 'YouTube',
            helper: config.youtubeVideoId ? 'Watch episode' : 'Watch show',
            url: config.youtubeVideoId
                ? `https://www.youtube.com/watch?v=${config.youtubeVideoId}`
                : config.youtubeUrl || searchUrl('youtube', config.podcastTitle),
            Icon: Youtube,
        },
        config.rssUrl
            ? {
                name: 'RSS',
                helper: 'Copy feed',
                url: config.rssUrl,
                Icon: Rss,
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export default function PlatformHandoffLinks({
    podcastTitle,
    applePodcastsUrl,
    spotifyUrl,
    youtubeUrl,
    youtubeVideoId,
    rssUrl,
    compact = false,
    className = '',
}: Props) {
    const links = getPlatformHandoffLinks({
        podcastTitle,
        applePodcastsUrl,
        spotifyUrl,
        youtubeUrl,
        youtubeVideoId,
        rssUrl,
    });

    if (compact) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {links.slice(0, 4).map(({ name, url, Icon }) => (
                    <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${podcastTitle} on ${name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black text-white transition-transform hover:-translate-y-0.5"
                    >
                        <Icon size={15} strokeWidth={2.5} />
                    </a>
                ))}
            </div>
        );
    }

    return (
        <section className={`rounded-[2rem] border border-white/10 bg-zinc-950/85 p-5 shadow-2xl ${className}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--podcast-primary)]">
                        Keep Listening Anywhere
                    </p>
                    <h3 className="mt-1 text-lg font-black uppercase italic tracking-tight text-white">
                        Hand off from web to your podcast app
                    </h3>
                </div>
                <ExternalLink size={18} className="shrink-0 text-zinc-500" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {links.map(({ name, helper, url, Icon }) => (
                    <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition-all hover:-translate-y-1 hover:border-[var(--podcast-primary)]/50 hover:bg-[var(--podcast-primary)] hover:text-black"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-black/10 group-hover:text-black">
                                <Icon size={20} strokeWidth={2.5} />
                            </span>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight">{name}</p>
                                <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                                    {helper}
                                </p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
