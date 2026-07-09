'use client';

import React from 'react';
import { FileText, Link2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import type { ThemeConfig } from '@/components/ThemeEngine';
import { slugify } from '@/lib/utils/slugify';

type GeneratedPage = NonNullable<ThemeConfig['generatedPages']>[number];
type GeneratedSection = GeneratedPage['sections'][number];

type Props = {
    pages: GeneratedPage[];
    onChange: (pages: GeneratedPage[]) => void;
    podcastTitle: string;
};

const templates: Array<{
    label: string;
    page: (podcastTitle: string) => GeneratedPage;
}> = [
    {
        label: 'Start Here',
        page: (podcastTitle) => ({
            slug: 'start-here',
            navLabel: 'Start Here',
            title: `Start Here With ${podcastTitle || 'The Show'}`,
            intent: 'Give new listeners a guided first step into the show, best episodes, and core themes.',
            seoTitle: `Start Here | ${podcastTitle || 'Podcast'}`,
            seoDescription: `New to ${podcastTitle || 'the show'}? Start with the essential episodes, topics, and listening links.`,
            sections: [
                {
                    title: 'What To Listen To First',
                    body: 'Use this page to point new listeners toward the most representative episodes, recurring themes, and best entry points.',
                    ctaLabel: 'Browse Episodes',
                    ctaHref: '/episodes',
                },
            ],
        }),
    },
    {
        label: 'Resources',
        page: (podcastTitle) => ({
            slug: 'resources',
            navLabel: 'Resources',
            title: `${podcastTitle || 'The Show'} Resources`,
            intent: 'Collect useful links, learning paths, downloads, tools, and evergreen recommendations.',
            seoTitle: `Resources | ${podcastTitle || 'Podcast'}`,
            seoDescription: `Explore guides, tools, downloads, and recommended episodes from ${podcastTitle || 'the show'}.`,
            sections: [
                {
                    title: 'Useful Links And Guides',
                    body: 'Turn recurring recommendations into one searchable hub so listeners do not have to dig through episode notes.',
                },
            ],
        }),
    },
    {
        label: 'Sponsors',
        page: (podcastTitle) => ({
            slug: 'sponsors',
            navLabel: 'Sponsors',
            title: `Sponsor ${podcastTitle || 'The Show'}`,
            intent: 'Give partners a focused page that explains audience fit, sponsorship options, and next steps.',
            seoTitle: `Sponsor ${podcastTitle || 'Podcast'}`,
            seoDescription: `Partner with ${podcastTitle || 'the show'} and reach an engaged podcast audience.`,
            sections: [
                {
                    title: 'Audience Fit',
                    body: 'Describe the audience, why they trust the show, and what kinds of partners would be a strong match.',
                    ctaLabel: 'Start A Conversation',
                    ctaHref: 'mailto:hello@example.com',
                },
            ],
        }),
    },
    {
        label: 'Newsletter',
        page: (podcastTitle) => ({
            slug: 'newsletter',
            navLabel: 'Newsletter',
            title: `${podcastTitle || 'The Show'} Newsletter`,
            intent: 'Convert casual listeners into an owned audience that can hear from the host between releases.',
            seoTitle: `Newsletter | ${podcastTitle || 'Podcast'}`,
            seoDescription: `Get episode notes, recommendations, and updates from ${podcastTitle || 'the show'}.`,
            sections: [
                {
                    title: 'Stay Close To The Show',
                    body: 'Use this page for newsletter value props, signup embeds, bonus notes, and launch announcements.',
                },
            ],
        }),
    },
];

function createBlankPage(podcastTitle: string): GeneratedPage {
    return {
        slug: 'custom-page',
        navLabel: 'New Page',
        title: `${podcastTitle || 'Podcast'} Page`,
        intent: 'Explain what this page helps listeners or partners accomplish.',
        seoTitle: `${podcastTitle || 'Podcast'} Page`,
        seoDescription: 'A focused podcast page built for discovery, conversion, and listener navigation.',
        sections: [
            {
                title: 'Section Title',
                body: 'Write the page copy here. Keep it useful, specific, and search-friendly.',
            },
        ],
    };
}

function uniqueSlug(baseSlug: string, pages: GeneratedPage[], currentIndex?: number) {
    const fallback = slugify(baseSlug) || 'page';
    const existing = new Set(
        pages
            .filter((_, index) => index !== currentIndex)
            .map((page) => page.slug)
            .filter(Boolean),
    );

    if (!existing.has(fallback)) return fallback;

    let suffix = 2;
    while (existing.has(`${fallback}-${suffix}`)) suffix += 1;
    return `${fallback}-${suffix}`;
}

function normalizeSection(section?: Partial<GeneratedSection>): GeneratedSection {
    return {
        title: section?.title || 'Section Title',
        body: section?.body || '',
        ctaLabel: section?.ctaLabel || undefined,
        ctaHref: section?.ctaHref || undefined,
    };
}

export default function GeneratedPagesEditor({ pages, onChange, podcastTitle }: Props) {
    const updatePage = (pageIndex: number, patch: Partial<GeneratedPage>) => {
        onChange(pages.map((page, index) => (index === pageIndex ? { ...page, ...patch } : page)));
    };

    const updateSection = (pageIndex: number, sectionIndex: number, patch: Partial<GeneratedSection>) => {
        onChange(
            pages.map((page, index) => {
                if (index !== pageIndex) return page;
                return {
                    ...page,
                    sections: page.sections.map((section, nextSectionIndex) => (
                        nextSectionIndex === sectionIndex ? { ...section, ...patch } : section
                    )),
                };
            }),
        );
    };

    const addPage = (pageFactory?: (podcastTitle: string) => GeneratedPage) => {
        const nextPage = pageFactory ? pageFactory(podcastTitle) : createBlankPage(podcastTitle);
        onChange([...pages, { ...nextPage, slug: uniqueSlug(nextPage.slug || nextPage.title, pages) }]);
    };

    const removePage = (pageIndex: number) => {
        onChange(pages.filter((_, index) => index !== pageIndex));
    };

    const addSection = (pageIndex: number) => {
        onChange(
            pages.map((page, index) => (
                index === pageIndex
                    ? { ...page, sections: [...page.sections, normalizeSection()] }
                    : page
            )),
        );
    };

    const removeSection = (pageIndex: number, sectionIndex: number) => {
        onChange(
            pages.map((page, index) => {
                if (index !== pageIndex) return page;
                const nextSections = page.sections.filter((_, nextSectionIndex) => nextSectionIndex !== sectionIndex);
                return { ...page, sections: nextSections.length ? nextSections : [normalizeSection()] };
            }),
        );
    };

    return (
        <section className="space-y-5 rounded-[2rem] border border-emerald-400/10 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(180deg,_rgba(15,23,42,0.86),_rgba(2,6,23,0.96))] p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                        <FileText size={12} />
                        Generated Pages Studio
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white">Turn the blueprint into publishable pages</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            These pages become public routes, nav links, sitemap entries, canonical URLs, and SEO metadata.
                            Use them for start-here guides, resources, sponsor pages, newsletters, seasons, or any repeat discovery path.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => addPage()}
                    className="shrink-0 rounded-full bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:scale-[1.02]"
                >
                    Add Page
                </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => (
                    <button
                        key={template.label}
                        type="button"
                        onClick={() => addPage(template.page)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-left transition-all hover:border-emerald-300/30"
                    >
                        <span className="text-sm font-bold text-slate-200">{template.label}</span>
                        <Plus size={14} className="text-emerald-300" />
                    </button>
                ))}
            </div>

            {pages.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/60 p-5 text-sm text-slate-400">
                    No generated pages yet. Add a template above or generate a brand blueprint to create SEO-ready pages automatically.
                </div>
            )}

            <div className="space-y-4">
                {pages.map((page, pageIndex) => (
                    <div key={`${page.slug}-${pageIndex}`} className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-black text-white">{page.navLabel || page.title || 'Generated Page'}</p>
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-mono text-slate-400">
                                    <Link2 size={12} />
                                    /{page.slug || 'page'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removePage(pageIndex)}
                                className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition-all hover:bg-red-500 hover:text-white"
                                aria-label={`Delete ${page.title || 'generated page'}`}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <Field
                                label="Nav Label"
                                value={page.navLabel}
                                onChange={(value) => updatePage(pageIndex, { navLabel: value })}
                            />
                            <Field
                                label="URL Slug"
                                value={page.slug}
                                mono
                                onChange={(value) => updatePage(pageIndex, { slug: slugify(value) })}
                                onBlur={() => updatePage(pageIndex, { slug: uniqueSlug(page.slug || page.title || page.navLabel, pages, pageIndex) })}
                            />
                            <Field
                                label="Page Title"
                                value={page.title}
                                onChange={(value) => updatePage(pageIndex, { title: value })}
                                className="md:col-span-2"
                            />
                            <TextArea
                                label="Search Intent"
                                value={page.intent || ''}
                                onChange={(value) => updatePage(pageIndex, { intent: value })}
                                className="md:col-span-2"
                            />
                            <Field
                                label="SEO Title"
                                icon={<Search size={12} />}
                                value={page.seoTitle || ''}
                                onChange={(value) => updatePage(pageIndex, { seoTitle: value })}
                            />
                            <TextArea
                                label="Meta Description"
                                value={page.seoDescription || ''}
                                onChange={(value) => updatePage(pageIndex, { seoDescription: value })}
                            />
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Page Sections</p>
                                <button
                                    type="button"
                                    onClick={() => addSection(pageIndex)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-emerald-300/30 hover:text-emerald-200"
                                >
                                    <Plus size={12} />
                                    Add Section
                                </button>
                            </div>

                            {page.sections.map((section, sectionIndex) => (
                                <div key={`${page.slug}-section-${sectionIndex}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-black text-slate-300">Section {sectionIndex + 1}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeSection(pageIndex, sectionIndex)}
                                            className="text-slate-500 transition-colors hover:text-red-300"
                                            aria-label={`Delete section ${sectionIndex + 1}`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <Field
                                            label="Section Title"
                                            value={section.title}
                                            onChange={(value) => updateSection(pageIndex, sectionIndex, { title: value })}
                                            className="md:col-span-2"
                                        />
                                        <TextArea
                                            label="Body Copy"
                                            value={section.body}
                                            onChange={(value) => updateSection(pageIndex, sectionIndex, { body: value })}
                                            className="md:col-span-2"
                                        />
                                        <Field
                                            label="CTA Label"
                                            value={section.ctaLabel || ''}
                                            onChange={(value) => updateSection(pageIndex, sectionIndex, { ctaLabel: value })}
                                        />
                                        <Field
                                            label="CTA Link"
                                            value={section.ctaHref || ''}
                                            mono
                                            onChange={(value) => updateSection(pageIndex, sectionIndex, { ctaHref: value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                <p>
                    Strong podcast sites should not only list episodes. They should create durable entry points for the questions,
                    people, themes, sponsors, and listener journeys that keep showing up around the show.
                </p>
            </div>
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    onBlur,
    className,
    mono,
    icon,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    className?: string;
    mono?: boolean;
    icon?: React.ReactNode;
}) {
    return (
        <label className={className}>
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {icon}
                {label}
            </span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                className={`mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-300/40 ${mono ? 'font-mono' : ''}`}
            />
        </label>
    );
}

function TextArea({
    label,
    value,
    onChange,
    className,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <label className={className}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-all focus:border-emerald-300/40"
            />
        </label>
    );
}
