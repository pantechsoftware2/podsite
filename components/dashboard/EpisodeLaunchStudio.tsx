'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Clipboard, ExternalLink, Megaphone, RefreshCw, Sparkles, Tags } from 'lucide-react';
import type { EpisodeLaunchAssets } from '@/lib/ai/openrouter';

type LaunchAssetRow = {
    id: string;
    episode_id: string;
    model: string | null;
    generated_at: string | null;
    assets: EpisodeLaunchAssets | null;
};

type Props = {
    episodeId: string;
    publicEpisodeUrl: string;
    initialLaunchAsset: LaunchAssetRow | null;
    initialThumbnails?: ThumbnailGenerationRow[];
};

type ThumbnailGenerationRow = {
    id: string;
    episode_id: string;
    prompt: string;
    concept: string | null;
    overlay_text: string | null;
    model: string | null;
    public_url: string | null;
    status: string;
    error: string | null;
    created_at: string | null;
};

function isLaunchAssets(input: unknown): input is EpisodeLaunchAssets {
    return Boolean(input && typeof input === 'object');
}

function normalizeInitialAsset(row: LaunchAssetRow | null): LaunchAssetRow | null {
    if (!row) return null;
    return {
        ...row,
        assets: isLaunchAssets(row.assets) ? row.assets : null,
    };
}

export default function EpisodeLaunchStudio({
    episodeId,
    publicEpisodeUrl,
    initialLaunchAsset,
    initialThumbnails = [],
}: Props) {
    const [launchAsset, setLaunchAsset] = useState<LaunchAssetRow | null>(normalizeInitialAsset(initialLaunchAsset));
    const [thumbnails, setThumbnails] = useState<ThumbnailGenerationRow[]>(initialThumbnails);
    const [isOpen, setIsOpen] = useState(Boolean(initialLaunchAsset));
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingThumbnailKey, setGeneratingThumbnailKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState<string | null>(null);
    const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

    const assets = launchAsset?.assets || null;

    async function generateLaunchKit() {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`/api/episodes/${episodeId}/launch-assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Could not generate launch kit.');
            }

            setLaunchAsset(normalizeInitialAsset(payload.launchAsset));
            setIsOpen(true);
        } catch (generationError: unknown) {
            setError(generationError instanceof Error ? generationError.message : 'Could not generate launch kit.');
        } finally {
            setIsGenerating(false);
        }
    }

    async function copyText(label: string, text: string) {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopiedLabel(label);
        setTimeout(() => setCopiedLabel(null), 1600);
    }

    async function generateThumbnail(brief: EpisodeLaunchAssets['thumbnailBriefs'][number], briefIndex: number) {
        const generationKey = `${brief.concept}-${briefIndex}`;
        setGeneratingThumbnailKey(generationKey);
        setThumbnailError(null);

        try {
            const response = await fetch(`/api/episodes/${episodeId}/thumbnails`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: brief.prompt,
                    concept: brief.concept,
                    overlayText: brief.overlayText,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Could not generate thumbnail.');
            }

            setThumbnails((current) => [payload.thumbnail, ...current].filter(Boolean));
        } catch (generationError: unknown) {
            setThumbnailError(generationError instanceof Error ? generationError.message : 'Could not generate thumbnail.');
        } finally {
            setGeneratingThumbnailKey(null);
        }
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
                        <Megaphone size={13} />
                        Episode Launch Studio
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Generate titles, SEO metadata, social posts, platform descriptions, tags, and thumbnail briefs.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a
                        href={publicEpisodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-sky-400/40 hover:text-sky-200"
                    >
                        <ExternalLink size={12} />
                        View
                    </a>
                    <button
                        type="button"
                        onClick={() => setIsOpen((value) => !value)}
                        disabled={!assets}
                        className="rounded-full border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isOpen ? 'Hide Kit' : 'Show Kit'}
                    </button>
                    <button
                        type="button"
                        onClick={generateLaunchKit}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-300 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {assets ? 'Regenerate' : 'Generate Kit'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {assets && isOpen && (
                <div className="mt-5 space-y-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded-full border border-slate-800 px-3 py-1">
                            Model: {launchAsset?.model || 'unknown'}
                        </span>
                        {launchAsset?.generated_at && (
                            <span className="rounded-full border border-slate-800 px-3 py-1">
                                Generated {new Date(launchAsset.generated_at).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <LaunchSection title="Title Ideas">
                        <CopyList items={assets.titleIdeas} onCopy={copyText} copiedLabel={copiedLabel} prefix="title" />
                    </LaunchSection>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <LaunchSection title="SEO Metadata">
                            <CopyBlock label="SEO title" text={assets.seoTags?.metaTitle || assets.seoTitle} onCopy={copyText} copiedLabel={copiedLabel} />
                            <CopyBlock label="Meta description" text={assets.seoTags?.metaDescription || assets.seoDescription} onCopy={copyText} copiedLabel={copiedLabel} />
                            {assets.seoTags?.ogTitle && (
                                <CopyBlock label="OG title" text={assets.seoTags.ogTitle} onCopy={copyText} copiedLabel={copiedLabel} />
                            )}
                            {assets.seoTags?.ogDescription && (
                                <CopyBlock label="OG description" text={assets.seoTags.ogDescription} onCopy={copyText} copiedLabel={copiedLabel} />
                            )}
                        </LaunchSection>

                        <LaunchSection title="Tags">
                            <div className="flex flex-wrap gap-2">
                                {(assets.seoTags?.keywords?.length ? assets.seoTags.keywords : assets.tags).map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => copyText(`tag-${tag}`, tag)}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-sky-400/40"
                                    >
                                        <Tags size={12} />
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </LaunchSection>
                    </div>

                    <LaunchSection title="Platform Descriptions">
                        <div className="grid gap-3 lg:grid-cols-3">
                            <CopyBlock label="Spotify" text={assets.platformDescriptions.spotify} onCopy={copyText} copiedLabel={copiedLabel} />
                            <CopyBlock label="Apple" text={assets.platformDescriptions.apple} onCopy={copyText} copiedLabel={copiedLabel} />
                            <CopyBlock label="YouTube" text={assets.platformDescriptions.youtube} onCopy={copyText} copiedLabel={copiedLabel} />
                        </div>
                    </LaunchSection>

                    {(assets.timestamps || []).length > 0 && (
                        <LaunchSection title="Timestamps">
                            <CopyList
                                items={(assets.timestamps || []).map((timestamp) => `${timestamp.time} - ${timestamp.title}`)}
                                onCopy={copyText}
                                copiedLabel={copiedLabel}
                                prefix="timestamp"
                            />
                        </LaunchSection>
                    )}

                    <LaunchSection title="Social Posts">
                        <div className="grid gap-3 lg:grid-cols-2">
                            {assets.socialPosts.map((post) => (
                                <CopyBlock
                                    key={`${post.platform}-${post.copy.slice(0, 24)}`}
                                    label={post.platform}
                                    text={post.copy}
                                    onCopy={copyText}
                                    copiedLabel={copiedLabel}
                                />
                            ))}
                        </div>
                    </LaunchSection>

                    {assets.thumbnailBriefs.length > 0 && (
                        <LaunchSection title="Thumbnail Briefs">
                            {thumbnailError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {thumbnailError}
                                </div>
                            )}
                            <div className="grid gap-3 lg:grid-cols-2">
                                {assets.thumbnailBriefs.map((brief, index) => {
                                    const generationKey = `${brief.concept}-${index}`;
                                    return (
                                        <ThumbnailBriefCard
                                            key={`${brief.concept}-${brief.overlayText}`}
                                            brief={brief}
                                            copiedLabel={copiedLabel}
                                            isGenerating={generatingThumbnailKey === generationKey}
                                            onCopy={copyText}
                                            onGenerate={() => generateThumbnail(brief, index)}
                                        />
                                    );
                                })}
                            </div>

                            {thumbnails.length > 0 && (
                                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                    {thumbnails.map((thumbnail) => (
                                        <GeneratedThumbnailCard key={thumbnail.id} thumbnail={thumbnail} />
                                    ))}
                                </div>
                            )}
                        </LaunchSection>
                    )}

                    {assets.youtubeTitleIdeas.length > 0 && (
                        <LaunchSection title="YouTube Title Ideas">
                            <CopyList items={assets.youtubeTitleIdeas} onCopy={copyText} copiedLabel={copiedLabel} prefix="youtube-title" />
                        </LaunchSection>
                    )}

                    {assets.keyQuotes.length > 0 && (
                        <LaunchSection title="Hooks And Quotes">
                            <CopyList items={assets.keyQuotes} onCopy={copyText} copiedLabel={copiedLabel} prefix="quote" />
                        </LaunchSection>
                    )}
                </div>
            )}
        </div>
    );
}

function LaunchSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{title}</h3>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

function CopyList({
    items,
    onCopy,
    copiedLabel,
    prefix,
}: {
    items: string[];
    onCopy: (label: string, text: string) => void;
    copiedLabel: string | null;
    prefix: string;
}) {
    return (
        <div className="grid gap-2">
            {items.map((item, index) => {
                const label = `${prefix}-${index}`;
                return (
                    <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => onCopy(label, item)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 transition-all hover:border-sky-400/40"
                    >
                        <span>{item}</span>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                            {copiedLabel === label ? 'Copied' : 'Copy'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function CopyBlock({
    label,
    text,
    onCopy,
    copiedLabel,
}: {
    label: string;
    text: string;
    onCopy: (label: string, text: string) => void;
    copiedLabel: string | null;
}) {
    if (!text) return null;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <button
                    type="button"
                    onClick={() => onCopy(label, text)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition-all hover:border-sky-400/40 hover:text-sky-200"
                >
                    <Clipboard size={11} />
                    {copiedLabel === label ? 'Copied' : 'Copy'}
                </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{text}</p>
        </div>
    );
}

function ThumbnailBriefCard({
    brief,
    copiedLabel,
    isGenerating,
    onCopy,
    onGenerate,
}: {
    brief: EpisodeLaunchAssets['thumbnailBriefs'][number];
    copiedLabel: string | null;
    isGenerating: boolean;
    onCopy: (label: string, text: string) => void;
    onGenerate: () => void;
}) {
    const label = `thumbnail-${brief.concept}-${brief.overlayText}`;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {brief.concept}
                    </p>
                    {brief.overlayText && (
                        <p className="mt-1 text-sm font-black text-sky-200">{brief.overlayText}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isGenerating ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    Generate
                </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{brief.prompt}</p>
            <button
                type="button"
                onClick={() => onCopy(label, brief.prompt)}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition-all hover:border-sky-400/40 hover:text-sky-200"
            >
                <Clipboard size={11} />
                {copiedLabel === label ? 'Copied' : 'Copy Prompt'}
            </button>
        </div>
    );
}

function GeneratedThumbnailCard({ thumbnail }: { thumbnail: ThumbnailGenerationRow }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {thumbnail.public_url ? (
                <a href={thumbnail.public_url} target="_blank" rel="noreferrer" className="block">
                    <Image
                        src={thumbnail.public_url}
                        alt={thumbnail.concept || 'Generated episode thumbnail'}
                        width={768}
                        height={512}
                        unoptimized
                        className="aspect-[3/2] w-full object-cover"
                    />
                </a>
            ) : (
                <div className="flex aspect-[3/2] items-center justify-center bg-slate-900 px-4 text-center text-xs text-red-300">
                    {thumbnail.error || 'Thumbnail generation failed.'}
                </div>
            )}
            <div className="p-3">
                <p className="text-xs font-bold text-slate-200">{thumbnail.concept || 'Generated thumbnail'}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {thumbnail.model || thumbnail.status}
                </p>
            </div>
        </div>
    );
}
