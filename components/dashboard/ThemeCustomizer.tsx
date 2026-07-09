'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ThemeConfig } from '@/components/ThemeEngine';
import {
    ArrowRight,
    Clapperboard,
    Globe,
    Image as ImageIcon,
    MessageSquareQuote,
    Palette,
    Radio,
    RefreshCw,
    Sparkles,
    Upload,
} from 'lucide-react';

export type BrandBlueprintResult = {
    themeConfig: ThemeConfig;
    pageLayout?: string[];
    copy?: {
        title?: string;
        tagline?: string;
        description?: string;
    };
    rationale?: string;
    websiteContext?: {
        url?: string;
        title?: string;
        description?: string;
        themeColor?: string;
        ogImageUrl?: string;
    } | null;
};

const moodOptions = ['Confident', 'Cinematic', 'Warm', 'Editorial', 'Playful', 'Rebellious'];
const energyOptions = ['Polished', 'Calm', 'High-energy'];
const structureOptions = ['Bingeable', 'Magazine-style', 'Community-first'];
const contentFocusOptions = ['Audio-first', 'Video-first', 'Balanced'];

const layoutOptions = [
    {
        id: 'netflix',
        title: 'Bingeable',
        description: 'Big visuals, punchy sections, and strong conversion moments.',
    },
    {
        id: 'substack',
        title: 'Editorial',
        description: 'Cleaner reading flow with more breathing room and story-led pacing.',
    },
    {
        id: 'genz',
        title: 'Creator-led',
        description: 'Higher energy, more personality, and a stronger social-first feel.',
    },
];

type Props = {
    podcastId?: string;
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
    imageUrl?: string;
    podcastTitle?: string;
    podcastDescription?: string;
    podcastTagline?: string;
    onApplyBlueprint?: (result: BrandBlueprintResult) => void;
};

export default function ThemeCustomizer({
    podcastId,
    config,
    onChange,
    imageUrl,
    podcastTitle,
    podcastDescription,
    podcastTagline,
    onApplyBlueprint,
}: Props) {
    const [websiteUrl, setWebsiteUrl] = useState(config.brandReferenceUrl || '');
    const [notes, setNotes] = useState(config.brandNotes || '');
    const [audience, setAudience] = useState(config.brandAudience || '');
    const [mustAvoid, setMustAvoid] = useState(config.brandMustAvoid || '');
    const [mood, setMood] = useState(config.brandMood || 'Confident');
    const [energy, setEnergy] = useState(config.brandEnergy || 'Polished');
    const [structure, setStructure] = useState(config.brandStructure || 'Bingeable');
    const [contentFocus, setContentFocus] = useState(config.brandContentFocus || 'Balanced');
    const [assetName, setAssetName] = useState('');
    const [assetPreview, setAssetPreview] = useState<string | null>(null);
    const [assetBase64, setAssetBase64] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<BrandBlueprintResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function mergeConfig(partial: Partial<ThemeConfig>) {
        onChange({ ...config, ...partial });
    }

    function persistBrief(partial: Partial<ThemeConfig>) {
        mergeConfig({
            brandReferenceUrl: websiteUrl,
            brandNotes: notes,
            brandAudience: audience,
            brandMustAvoid: mustAvoid,
            brandMood: mood,
            brandEnergy: energy,
            brandStructure: structure,
            brandContentFocus: contentFocus,
            ...partial,
        });
    }

    async function fileToDataUrl(file: File) {
        if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image like artwork, a screenshot, or a logo.');
        }

        const objectUrl = URL.createObjectURL(file);

        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const nextImage = new window.Image();
                nextImage.onload = () => resolve(nextImage);
                nextImage.onerror = () => reject(new Error('Could not read that image.'));
                nextImage.src = objectUrl;
            });

            const canvas = document.createElement('canvas');
            const maxDimension = 1200;
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context?.drawImage(img, 0, 0, width, height);

            return canvas.toDataURL('image/jpeg', 0.82);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    async function handleAssetChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setStatus('Preparing inspiration asset...');

        try {
            const nextAsset = await fileToDataUrl(file);
            setAssetName(file.name);
            setAssetPreview(nextAsset);
            setAssetBase64(nextAsset);
            setStatus('Asset ready. Generate a website blueprint when you are ready.');
        } catch (assetError: unknown) {
            setError(assetError instanceof Error ? assetError.message : 'Could not process that file.');
            setStatus(null);
        }
    }

    async function handleGenerateBlueprint(magicTheme = false) {
        setIsGenerating(true);
        setError(null);
        setStatus(magicTheme ? 'Generating a complete brand identity...' : 'Building a website direction from your brand inputs...');

        try {
            const response = await fetch('/api/ai/generate-theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    podcastId,
                    image: assetBase64,
                    imageUrl,
                    websiteUrl,
                    prompt: notes,
                    magicTheme,
                    podcastTitle,
                    podcastDescription,
                    podcastTagline,
                    questionnaire: {
                        mood,
                        energy,
                        structure,
                        contentFocus,
                        audience,
                        mustAvoid,
                    },
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'The website blueprint could not be generated.');
            }

            const nextConfig: ThemeConfig = {
                ...config,
                ...payload.themeConfig,
                tagline: payload.copy?.tagline || payload.themeConfig?.tagline || config.tagline,
                brandReferenceUrl: websiteUrl,
                brandNotes: notes,
                brandAudience: audience,
                brandMustAvoid: mustAvoid,
                brandMood: mood,
                brandEnergy: energy,
                brandStructure: structure,
                brandContentFocus: contentFocus,
            };

            const result: BrandBlueprintResult = {
                themeConfig: nextConfig,
                pageLayout: Array.isArray(payload.pageLayout) ? payload.pageLayout : undefined,
                copy: payload.copy,
                rationale: payload.rationale,
                websiteContext: payload.websiteContext,
            };

            if (onApplyBlueprint) {
                onApplyBlueprint(result);
            } else {
                onChange(nextConfig);
            }

            setLastResult(result);
            setStatus(magicTheme ? 'Magic theme ready. Preview updated with the new brand.' : 'Blueprint ready. Preview updated with the new direction.');
        } catch (generationError: unknown) {
            setError(generationError instanceof Error ? generationError.message : 'Could not generate a website blueprint.');
            setStatus(null);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <section className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-sky-300">
                            <Sparkles size={12} />
                            Brand Blueprint
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Design from vibe, not hex codes</h3>
                            <p className="mt-2 max-w-xl text-sm text-slate-300">
                                Drop in artwork, a screenshot, or a reference website, then tell us how the show should feel.
                                We&apos;ll generate the site direction, structure, and copy cues from that.
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => handleGenerateBlueprint(true)}
                            disabled={isGenerating}
                            className="rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-950 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? 'Building...' : 'Magic Theme'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleGenerateBlueprint(false)}
                            disabled={isGenerating}
                            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition-all hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Generate Direction
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                            <Globe size={14} />
                            Reference Website
                        </div>
                        <input
                            value={websiteUrl}
                            onChange={(event) => {
                                const value = event.target.value;
                                setWebsiteUrl(value);
                                persistBrief({ brandReferenceUrl: value });
                            }}
                            placeholder="Paste a website you want to echo"
                            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition-all focus:border-sky-400/40"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            We will read the site metadata and any available open-graph artwork to steer the design.
                        </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                            <ImageIcon size={14} />
                            Inspiration Asset
                        </div>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-4 py-4 text-left transition-all hover:border-sky-400/35"
                        >
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {assetName || 'Upload artwork, a screenshot, or a logo'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Episode art, a moodboard crop, or a homepage screenshot all work well here.
                                </p>
                            </div>
                            <Upload size={18} className="text-slate-400" />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAssetChange}
                            className="hidden"
                        />

                        {assetPreview && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                                <Image
                                    src={assetPreview}
                                    alt="Inspiration preview"
                                    width={1200}
                                    height={640}
                                    className="h-40 w-full object-cover"
                                    unoptimized
                                />
                            </div>
                        )}

                        {!assetPreview && imageUrl && (
                            <p className="mt-3 text-xs text-slate-500">
                                Current podcast artwork is already available in the preview and can complement the new direction.
                            </p>
                        )}
                    </div>
                </div>

                {(status || error) && (
                    <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                        {error || status}
                    </div>
                )}

                {lastResult?.rationale && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <span className="font-black uppercase tracking-[0.18em] text-slate-500">AI read:</span>{' '}
                        {lastResult.rationale}
                    </div>
                )}

                {lastResult?.websiteContext && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-slate-300">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Reference Signals</div>
                        <p className="mt-2 text-white">
                            {lastResult.websiteContext.title || lastResult.websiteContext.url || 'Website reference applied'}
                        </p>
                        {lastResult.websiteContext.description && (
                            <p className="mt-1 text-xs text-slate-500">{lastResult.websiteContext.description}</p>
                        )}
                        {lastResult.websiteContext.themeColor && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-400">
                                <span
                                    className="h-3 w-3 rounded-full border border-white/10"
                                    style={{ backgroundColor: lastResult.websiteContext.themeColor }}
                                />
                                Theme color hint: {lastResult.websiteContext.themeColor}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        <MessageSquareQuote size={14} />
                        Tell Us The Vibe
                    </div>

                    <textarea
                        value={notes}
                        onChange={(event) => {
                            const value = event.target.value;
                            setNotes(value);
                            persistBrief({ brandNotes: value });
                        }}
                        placeholder="What should the site feel like? Mention tone, references, what should feel premium, and what absolutely should not."
                        className="mt-3 min-h-36 w-full rounded-[1.5rem] border border-white/10 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition-all focus:border-sky-400/40"
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Audience</label>
                            <input
                                value={audience}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setAudience(value);
                                    persistBrief({ brandAudience: value });
                                }}
                                placeholder="Founders, superfans, wellness listeners..."
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-400/40"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Must Avoid</label>
                            <input
                                value={mustAvoid}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setMustAvoid(value);
                                    persistBrief({ brandMustAvoid: value });
                                }}
                                placeholder="Too corporate, too pastel, too playful..."
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-400/40"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        <Radio size={14} />
                        Quick Questionnaire
                    </div>

                    <OptionGroup
                        className="mt-4"
                        title="What should people feel first?"
                        options={moodOptions}
                        value={mood}
                        onChange={(value) => {
                            setMood(value);
                            persistBrief({ brandMood: value });
                        }}
                    />

                    <OptionGroup
                        className="mt-5"
                        title="How much energy should the site carry?"
                        options={energyOptions}
                        value={energy}
                        onChange={(value) => {
                            setEnergy(value);
                            persistBrief({ brandEnergy: value });
                        }}
                    />

                    <OptionGroup
                        className="mt-5"
                        title="How should the homepage behave?"
                        options={structureOptions}
                        value={structure}
                        onChange={(value) => {
                            setStructure(value);
                            persistBrief({ brandStructure: value });
                        }}
                    />

                    <OptionGroup
                        className="mt-5"
                        title="What should the site emphasize?"
                        options={contentFocusOptions}
                        value={contentFocus}
                        onChange={(value) => {
                            setContentFocus(value);
                            persistBrief({ brandContentFocus: value });
                        }}
                    />
                </div>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <Palette size={14} />
                    Optional Manual Nudge
                </div>
                <p className="mt-2 text-sm text-slate-400">
                    If the AI gets close but not perfect, you can still steer the browsing style without touching raw colors.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {layoutOptions.map((option) => {
                        const isActive = config.layout === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => mergeConfig({ layout: option.id as ThemeConfig['layout'] })}
                                className={`rounded-[1.5rem] border p-4 text-left transition-all ${isActive ? 'border-sky-400/40 bg-sky-400/10' : 'border-white/10 bg-slate-950 hover:border-white/20'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black text-white">{option.title}</p>
                                    <ArrowRight size={14} className={isActive ? 'text-sky-300' : 'text-slate-500'} />
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-slate-400">{option.description}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2">
                        <Clapperboard size={14} className="text-slate-500" />
                        Mood: {mood}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2">
                        <RefreshCw size={14} className="text-slate-500" />
                        Energy: {energy}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2">
                        <Radio size={14} className="text-slate-500" />
                        Focus: {contentFocus}
                    </span>
                </div>
            </div>
        </section>
    );
}

function OptionGroup({
    title,
    options,
    value,
    onChange,
    className,
}: {
    title: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={className}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {options.map((option) => {
                    const isActive = value === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${isActive ? 'bg-white text-slate-950' : 'border border-white/10 bg-slate-950 text-slate-300 hover:border-white/20'}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
