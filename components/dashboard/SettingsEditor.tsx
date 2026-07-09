'use client';

import React, { useState } from 'react';
import ThemeCustomizer from './ThemeCustomizer';
import BlockReorder from './BlockReorder';
import ThemeEngine, { ThemeConfig } from '@/components/ThemeEngine';
import { updateCustomizeAction } from '@/app/(dashboard)/dashboard/customize/actions';
import { Save, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsEditor({
    podcastId,
    podcastTitle,
    podcastDescription,
    initialConfig,
    initialLayout,
    imageUrl,
}: {
    podcastId: string,
    podcastTitle?: string,
    podcastDescription?: string,
    initialConfig: ThemeConfig,
    initialLayout: string[],
    imageUrl?: string,
}) {
    const [config, setConfig] = useState<ThemeConfig>(initialConfig);
    const [layout, setLayout] = useState<string[]>(initialLayout);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const router = useRouter();

    const handleConfigChange = (newConfig: ThemeConfig) => {
        console.log('🎨 Config changed:', newConfig);
        setConfig(newConfig);
        setHasUnsavedChanges(true);
        setIsSaved(false);
    };

    const handleLayoutChange = (newLayout: string[]) => {
        console.log('📐 Layout changed:', newLayout);
        setLayout(newLayout);
        setHasUnsavedChanges(true);
        setIsSaved(false);
    };

    const handleSave = async () => {
        console.log('💾 Save button clicked!');
        setIsSaving(true);
        try {
            await updateCustomizeAction(podcastId, {
                theme_config: config,
                page_layout: layout,
            });
            console.log('✅ Settings saved successfully');
            setHasUnsavedChanges(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            router.refresh();
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <ThemeEngine config={config} scope=".preview-scope" />
            <div className="preview-scope space-y-12 pb-32">
                <section className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-12">
                        {/* Theme Customizer */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
                            <ThemeCustomizer
                                podcastId={podcastId}
                                config={config}
                                onChange={handleConfigChange}
                                imageUrl={config.imageUrl || imageUrl}
                                podcastTitle={podcastTitle}
                                podcastDescription={podcastDescription}
                            />
                        </div>

                        {/* General Info Display (Static) */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
                            <h3 className="mb-6 text-xl font-bold text-white">Artwork Preview</h3>
                            <div className="flex flex-col items-center">
                                {config.imageUrl || imageUrl ? (
                                    <div className="relative group">
                                        <img
                                            src={config.imageUrl || imageUrl}
                                            alt="Podcast Artwork"
                                            className="h-40 w-40 rounded-2xl object-cover shadow-2xl border-4 border-slate-800"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-4 border-dashed border-slate-800 bg-slate-900 text-4xl shadow-inner">
                                        🎙️
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        {/* Block Reorder */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
                            <BlockReorder
                                podcastId={podcastId}
                                items={layout}
                                onChange={handleLayoutChange}
                            />
                        </div>
                    </aside>
                </section>

                {/* Floating Save Bar */}
                <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
                    <div className={`flex items-center justify-between rounded-full border border-white/10 bg-black/80 p-2 backdrop-blur-2xl shadow-2xl transition-all duration-500 ${hasUnsavedChanges ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                        <div className="pl-6">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Unsaved Changes
                            </span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            ) : (
                                <Save size={16} strokeWidth={3} />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Saved Success Message */}
                    {isSaved && !hasUnsavedChanges && (
                        <div className="flex animate-in fade-in slide-in-from-bottom-4 items-center justify-center">
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-xs font-black uppercase tracking-widest text-black shadow-xl">
                                <Check size={14} strokeWidth={4} />
                                Published Successfully
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
