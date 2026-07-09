'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ThemeCustomizer, { BrandBlueprintResult } from './ThemeCustomizer';
import BlockReorder from './BlockReorder';
import GeneratedPagesEditor from './GeneratedPagesEditor';
import { ThemeConfig } from '@/components/ThemeEngine';
import { updateCustomizeAction } from '@/app/(dashboard)/dashboard/customize/actions';
import { Save, Check, ChevronLeft, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type EditorPodcast = {
    id: string;
    title: string | null;
    description: string | null;
    rss_url: string | null;
    theme_config: ThemeConfig | null;
    page_layout: string[] | null;
};

type MetadataUpdates = Partial<{
    title: string;
    tagline: string;
    description: string;
}>;

export default function SplitScreenEditor({ podcast }: { podcast: EditorPodcast }) {
    const initialConfig = (podcast.theme_config as ThemeConfig) || {};
    const [config, setConfig] = useState<ThemeConfig>(initialConfig);
    const [title, setTitle] = useState(podcast.title || '');
    const [tagline, setTagline] = useState(initialConfig.tagline || '');
    const [description, setDescription] = useState(podcast.description || '');
    const [layout, setLayout] = useState<string[]>((podcast.page_layout as string[]) || ['hero', 'subscribe', 'grid', 'host', 'shorts', 'product']);
    const [isSaving, setIsSaving] = useState(false);
    const [isSeoGenerating, setIsSeoGenerating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const changeVersionRef = useRef(0);
    const router = useRouter();

    const markDirty = () => {
        changeVersionRef.current += 1;
        setHasUnsavedChanges(true);
        setIsSaved(false);
        setSaveError(null);
    };

    const handleConfigChange = (newConfig: ThemeConfig) => {
        setConfig(newConfig);
        markDirty();
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_THEME', payload: newConfig }, '*');
            // If tagline changed, sync it as well
            if (newConfig.tagline !== tagline) {
                iframeRef.current.contentWindow.postMessage({ 
                    type: 'UPDATE_PODCAST', 
                    payload: { tagline: newConfig.tagline } 
                }, '*');
            }
        }
    };

    const handleMetadataChange = (updates: MetadataUpdates) => {
        markDirty();
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_PODCAST', payload: updates }, '*');
        }
    };

    const handleLayoutChange = (newLayout: string[]) => {
        setLayout(newLayout);
        markDirty();
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_LAYOUT', payload: newLayout }, '*');
        }
    };

    const handleBlueprintApply = (result: BrandBlueprintResult) => {
        const metadataUpdates: Record<string, string> = {};

        if (result.copy?.title) {
            setTitle(result.copy.title);
            metadataUpdates.title = result.copy.title;
        }

        const nextTagline = result.copy?.tagline || result.themeConfig.tagline;
        if (nextTagline) {
            setTagline(nextTagline);
            metadataUpdates.tagline = nextTagline;
        }

        if (result.copy?.description) {
            setDescription(result.copy.description);
            metadataUpdates.description = result.copy.description;
        }

        handleConfigChange(result.themeConfig);

        if (result.pageLayout?.length) {
            handleLayoutChange(result.pageLayout);
        }

        if (Object.keys(metadataUpdates).length > 0) {
            handleMetadataChange(metadataUpdates);
        }
    };

    const saveChanges = useCallback(async () => {
        const versionAtSaveStart = changeVersionRef.current;
        setIsSaving(true);
        try {
            const updatedConfig = { ...config, tagline };
            await updateCustomizeAction(podcast.id, {
                title,
                description,
                theme_config: updatedConfig,
                page_layout: layout,
            });
            if (changeVersionRef.current === versionAtSaveStart) {
                setHasUnsavedChanges(false);
                setIsSaved(true);
                setSaveError(null);
                setTimeout(() => setIsSaved(false), 3000);
            }
            router.refresh();
        } catch (error) {
            console.error('Failed to save settings:', error);
            if (changeVersionRef.current === versionAtSaveStart) {
                setSaveError('Autosave failed');
            }
        } finally {
            setIsSaving(false);
        }
    }, [config, description, layout, podcast.id, router, tagline, title]);

    useEffect(() => {
        if (!hasUnsavedChanges || isSaving || saveError) {
            return;
        }

        const autosaveTimer = window.setTimeout(() => {
            void saveChanges();
        }, 900);

        return () => window.clearTimeout(autosaveTimer);
    }, [hasUnsavedChanges, isSaving, saveChanges, saveError]);

    const handleMagicSeo = async () => {
        setIsSeoGenerating(true);
        setIsSaved(false);

        try {
            const siteUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}/${podcast.id}`
                : undefined;
            const res = await fetch('/api/ai/magic-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ podcastId: podcast.id, siteUrl }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate SEO settings');
            }

            if (data.websiteSeo) {
                const nextConfig = { ...config, websiteSeo: data.websiteSeo };
                setConfig(nextConfig);
                setIsSaved(true);
                setHasUnsavedChanges(false);

                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.location.reload();
                }

                router.refresh();
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch (error) {
            console.error('Failed to generate SEO settings:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate SEO settings');
        } finally {
            setIsSeoGenerating(false);
        }
    };

    const handleToggleHidden = (id: string) => {
        const currentHidden = config.hiddenBlocks || [];
        const newHidden = currentHidden.includes(id)
            ? currentHidden.filter(x => x !== id)
            : [...currentHidden, id];
        handleConfigChange({ ...config, hiddenBlocks: newHidden });
    };

    const iframeUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/${podcast.id}` : '';

    return (
        <div className="flex h-full w-full flex-col md:flex-row bg-slate-950 overflow-hidden">
            {/* Left Panel: Settings (30%) */}
            <div className="w-full md:w-[30%] flex flex-col border-r border-white/10 bg-slate-950 shadow-2xl z-10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={16} /> Back
                    </Link>
                    <div className="flex bg-slate-900 rounded-lg p-1">
                        <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md transition-colors ${device === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                            <Monitor size={16} />
                        </button>
                        <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md transition-colors ${device === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                            <Smartphone size={16} />
                        </button>
                    </div>
                </div>

                {/* Settings Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-12 pb-32">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Customize Site</h2>
                        <p className="text-xs text-slate-400">Shape the site from brand inspiration, then fine-tune the structure below.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Metadata & AI</h3>
                            <button
                                onClick={handleMagicSeo}
                                disabled={isSeoGenerating}
                                className="flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-all hover:bg-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isSeoGenerating ? (
                                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : (
                                    <Sparkles size={12} />
                                )}
                                {isSeoGenerating ? 'Writing SEO...' : 'Magic SEO'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Podcast Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => { 
                                        setTitle(e.target.value); 
                                        handleMetadataChange({ title: e.target.value }); 
                                    }}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Tagline / Subtitle</label>
                                <input
                                    value={tagline}
                                    placeholder="Your podcast's catchy hook..."
                                    onChange={(e) => { 
                                        setTagline(e.target.value); 
                                        handleMetadataChange({ tagline: e.target.value }); 
                                    }}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => { 
                                        setDescription(e.target.value); 
                                        handleMetadataChange({ description: e.target.value }); 
                                    }}
                                    rows={3}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <ThemeCustomizer
                        config={config}
                        onChange={handleConfigChange}
                        imageUrl={config.imageUrl}
                        podcastTitle={title}
                        podcastDescription={description}
                        podcastTagline={tagline}
                        onApplyBlueprint={handleBlueprintApply}
                    />

                    <GeneratedPagesEditor
                        pages={config.generatedPages || []}
                        podcastTitle={title}
                        onChange={(generatedPages) => handleConfigChange({ ...config, generatedPages })}
                    />

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Page Layout</h3>
                        <BlockReorder
                            podcastId={podcast.id}
                            items={layout}
                            hiddenItems={config.hiddenBlocks}
                            onChange={handleLayoutChange}
                            onToggleHidden={handleToggleHidden}
                        />
                    </div>

                    {/* Platform Links Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Platform Links</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Apple Podcasts URL</label>
                                <input
                                    value={config.applePodcastsUrl || ''}
                                    placeholder="https://podcasts.apple.com/..."
                                    onChange={(e) => handleConfigChange({ ...config, applePodcastsUrl: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Spotify URL</label>
                                <input
                                    value={config.spotifyUrl || ''}
                                    placeholder="https://open.spotify.com/show/..."
                                    onChange={(e) => handleConfigChange({ ...config, spotifyUrl: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">YouTube URL</label>
                                <input
                                    value={config.youtubeUrl || ''}
                                    placeholder="https://youtube.com/@..."
                                    onChange={(e) => handleConfigChange({ ...config, youtubeUrl: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">RSS URL Override</label>
                                <input
                                    value={config.rssUrlOverride || ''}
                                    placeholder={podcast.rss_url || 'https://...'}
                                    onChange={(e) => handleConfigChange({ ...config, rssUrlOverride: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced & Danger Zone */}
                    <div className="pt-12 border-t border-white/5 space-y-8 pb-10">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">RSS Connection</h4>
                            <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
                                <code className="text-[10px] text-slate-500 break-all">{podcast.rss_url}</code>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-900/50">Danger Zone</h4>
                            <button className="w-full rounded-xl border border-red-900/20 bg-red-950/10 py-3 text-xs font-bold text-red-500/60 transition-all hover:bg-red-500 hover:text-black">
                                Delete Podcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Bar */}
                <div className="fixed bottom-6 left-0 md:w-[30%] w-full px-6 bg-transparent pointer-events-none z-50">
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <div
                            aria-live="polite"
                            className={`w-full flex items-center justify-center gap-3 rounded-full px-8 py-5 text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 backdrop-blur-md border ${saveError ? 'bg-red-500 text-black border-red-400' : isSaved ? 'bg-emerald-500 text-black border-emerald-400' : hasUnsavedChanges ? 'bg-primary text-black border-white/20 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]' : 'bg-slate-900/80 text-white/40 border-white/10 hover:border-white/20'}`}
                        >
                            {isSaving ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : isSaved ? (
                                <Check size={18} strokeWidth={4} />
                            ) : (
                                <Save size={18} strokeWidth={3} className={hasUnsavedChanges ? 'animate-pulse' : ''} />
                            )}
                            <span className="relative">
                                {saveError ?? (isSaving ? 'Auto-saving...' : isSaved ? 'Site Published' : hasUnsavedChanges ? 'Autosave Pending' : 'All Changes Saved')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Live Preview (70%) */}
            <div className={`hidden md:flex flex-1 items-center justify-center bg-zinc-950 p-6 lg:p-12 relative`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" />

                <div className={`flex flex-col relative overflow-hidden rounded-[2rem] border-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-500 bg-[#1e1e1e] ${device === 'mobile' ? 'w-[375px] h-[812px]' : 'w-full h-full'}`}>
                    {/* Browser Shell Header */}
                    <div className="flex h-12 w-full items-center justify-between border-b border-white/5 bg-[#2d2d2d] px-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex-1 max-w-md mx-6">
                            <div className="flex h-7 w-full items-center justify-center rounded-md bg-[#1e1e1e] px-4 text-[10px] text-slate-400 font-mono border border-white/5">
                                {typeof window !== 'undefined' ? window.location.host : 'localhost'}/{podcast.id}
                            </div>
                        </div>
                        <div className="w-16" />
                    </div>

                    <div className="flex-1 w-full bg-white relative">
                        {iframeUrl && (
                            <iframe
                                ref={iframeRef}
                                src={iframeUrl}
                                className="w-full h-full"
                                title="Live Preview"
                            />
                        )}
                        <div className="absolute inset-0 pointer-events-none border-t border-black/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
