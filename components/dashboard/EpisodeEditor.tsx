'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Copy, GripVertical, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';

type Chapter = {
    id: string;
    time: string;
    title: string;
    seconds: number | null;
};

type EditorFields = {
    title: string;
    transcript: string;
    timestamps: Chapter[];
    youtubeDescription: string;
    spotifyDescription: string;
    seoTags: string[];
    thumbnailUrl: string;
};

type Props = {
    episodeId: string;
    publicEpisodeUrl: string;
    backUrl: string;
    initialFields: EditorFields;
    publishedAt: string | null;
    durationSeconds: number | null;
    status: string;
};

type FieldKey = 'transcript' | 'chapters' | 'youtubeDescription' | 'spotifyDescription' | 'seoTags' | 'thumbnail';

const fieldLabels: Record<FieldKey, string> = {
    transcript: 'Transcript',
    chapters: 'Chapter Markers',
    youtubeDescription: 'YouTube Description',
    spotifyDescription: 'Spotify Description',
    seoTags: 'SEO Tags',
    thumbnail: 'Thumbnail',
};

function chapterId(index: number) {
    return `chapter-${Date.now()}-${index}`;
}

function normalizeChapters(input: unknown): Chapter[] {
    if (!Array.isArray(input)) return [];
    return input
        .filter((item): item is { time?: unknown; title?: unknown; seconds?: unknown } => Boolean(item && typeof item === 'object'))
        .map((item, index) => ({
            id: chapterId(index),
            time: typeof item.time === 'string' ? item.time : '',
            title: typeof item.title === 'string' ? item.title : '',
            seconds: typeof item.seconds === 'number' ? item.seconds : null,
        }))
        .filter((item) => item.time || item.title);
}

function formatDate(input: string | null) {
    if (!input) return 'Not published';
    return new Date(input).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDuration(seconds: number | null) {
    if (!seconds) return 'Unknown';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function hasValue(field: FieldKey, fields: EditorFields) {
    if (field === 'chapters') return fields.timestamps.length > 0;
    if (field === 'seoTags') return fields.seoTags.length > 0;
    if (field === 'thumbnail') return Boolean(fields.thumbnailUrl);
    return Boolean(fields[field]?.trim());
}

export default function EpisodeEditor({
    episodeId,
    publicEpisodeUrl,
    backUrl,
    initialFields,
    publishedAt,
    durationSeconds,
    status,
}: Props) {
    const [fields, setFields] = useState(initialFields);
    const [loadingField, setLoadingField] = useState<FieldKey | null>(null);
    const [progress, setProgress] = useState<Record<FieldKey, 'idle' | 'loading' | 'done' | 'error'>>({
        transcript: 'idle',
        chapters: 'idle',
        youtubeDescription: 'idle',
        spotifyDescription: 'idle',
        seoTags: 'idle',
        thumbnail: 'idle',
    });
    const [expandedTranscript, setExpandedTranscript] = useState(Boolean(initialFields.transcript));
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewNonce, setPreviewNonce] = useState(0);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const processed = useMemo(
        () => (['transcript', 'chapters', 'youtubeDescription', 'spotifyDescription', 'seoTags', 'thumbnail'] as FieldKey[])
            .some((field) => hasValue(field, fields)),
        [fields],
    );

    function showToast(message: string) {
        setToast(message);
        setTimeout(() => setToast(null), 1600);
    }

    function applyGenerated(generated: Record<string, unknown>) {
        setFields((current) => ({
            ...current,
            transcript: typeof generated.transcript === 'string' ? generated.transcript : current.transcript,
            timestamps: Array.isArray(generated.timestamps) ? normalizeChapters(generated.timestamps) : current.timestamps,
            youtubeDescription: typeof generated.youtubeDescription === 'string' ? generated.youtubeDescription : current.youtubeDescription,
            spotifyDescription: typeof generated.spotifyDescription === 'string' ? generated.spotifyDescription : current.spotifyDescription,
            seoTags: Array.isArray(generated.seoTags)
                ? generated.seoTags.filter((tag): tag is string => typeof tag === 'string')
                : current.seoTags,
            thumbnailUrl: typeof generated.thumbnailUrl === 'string' ? generated.thumbnailUrl : current.thumbnailUrl,
        }));
    }

    async function generateField(field: FieldKey) {
        setLoadingField(field);
        setProgress((current) => ({ ...current, [field]: 'loading' }));
        setError(null);

        try {
            const response = await fetch(`/api/episodes/${episodeId}/ai-pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    field,
                    draft: {
                        title: fields.title,
                        transcript: fields.transcript,
                    },
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || `Could not generate ${fieldLabels[field]}.`);

            applyGenerated(payload.fields || {});
            if (field === 'transcript') setExpandedTranscript(true);
            setProgress((current) => ({ ...current, [field]: 'done' }));
        } catch (generationError: unknown) {
            setProgress((current) => ({ ...current, [field]: 'error' }));
            setError(generationError instanceof Error ? generationError.message : `Could not generate ${fieldLabels[field]}.`);
        } finally {
            setLoadingField(null);
        }
    }

    async function generateAll() {
        setLoadingField('transcript');
        setProgress({
            transcript: 'loading',
            chapters: 'loading',
            youtubeDescription: 'loading',
            spotifyDescription: 'loading',
            seoTags: 'loading',
            thumbnail: 'loading',
        });
        setError(null);

        try {
            const response = await fetch('/api/ai/generate-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ episodeId }),
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error || 'Could not generate the AI content pack.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const rawEvent of events) {
                    const eventName = rawEvent.match(/^event: (.+)$/m)?.[1];
                    const dataLine = rawEvent.match(/^data: (.+)$/m)?.[1];
                    if (!eventName || !dataLine) continue;

                    const payload = JSON.parse(dataLine) as Record<string, unknown>;
                    if (eventName === 'error') {
                        throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not generate the AI content pack.');
                    }

                    if (eventName === 'progress') {
                        const step = payload.step;
                        const status = payload.status === 'done' ? 'done' : 'loading';
                        const stepToField: Partial<Record<string, FieldKey>> = {
                            transcribe: 'transcript',
                            timestamps: 'chapters',
                            youtubeDescription: 'youtubeDescription',
                            spotifyDescription: 'spotifyDescription',
                            seoTags: 'seoTags',
                            thumbnail: 'thumbnail',
                        };
                        const field = typeof step === 'string' ? stepToField[step] : undefined;
                        if (field) {
                            setLoadingField(status === 'loading' ? field : null);
                            setProgress((current) => ({ ...current, [field]: status }));
                        }
                    }

                    if (eventName === 'done') {
                        applyGenerated({
                            transcript: payload.transcript,
                            timestamps: payload.timestamps,
                            youtubeDescription: payload.youtubeDescription,
                            spotifyDescription: payload.spotifyDescription,
                            seoTags: (payload.tags as { keywords?: unknown } | undefined)?.keywords,
                            thumbnailUrl: payload.thumbnailUrl,
                        });
                        setProgress({
                            transcript: 'done',
                            chapters: 'done',
                            youtubeDescription: 'done',
                            spotifyDescription: 'done',
                            seoTags: 'done',
                            thumbnail: 'done',
                        });
                        showToast('AI content pack generated');
                    }
                }
            }

            setExpandedTranscript(true);
        } catch (generationError: unknown) {
            setProgress({
                transcript: 'error',
                chapters: 'error',
                youtubeDescription: 'error',
                spotifyDescription: 'error',
                seoTags: 'error',
                thumbnail: 'error',
            });
            setError(generationError instanceof Error ? generationError.message : 'Could not generate the AI content pack.');
        } finally {
            setLoadingField(null);
        }
    }

    async function saveChanges() {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/episodes/${episodeId}/editor`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...fields,
                    timestamps: fields.timestamps.map((chapter) => ({
                        time: chapter.time,
                        title: chapter.title,
                        seconds: chapter.seconds,
                    })),
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Could not save changes.');
            setPreviewNonce((value) => value + 1);
            showToast('Saved changes');
        } catch (saveError: unknown) {
            setError(saveError instanceof Error ? saveError.message : 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    }

    async function copyText(text: string) {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        showToast('Copied!');
    }

    function updateChapter(id: string, patch: Partial<Chapter>) {
        setFields((current) => ({
            ...current,
            timestamps: current.timestamps.map((chapter) => chapter.id === id ? { ...chapter, ...patch } : chapter),
        }));
    }

    function removeChapter(id: string) {
        setFields((current) => ({
            ...current,
            timestamps: current.timestamps.filter((chapter) => chapter.id !== id),
        }));
    }

    function addChapter() {
        setFields((current) => ({
            ...current,
            timestamps: [
                ...current.timestamps,
                { id: chapterId(current.timestamps.length), time: '00:00', title: 'New chapter', seconds: null },
            ],
        }));
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setFields((current) => {
            const oldIndex = current.timestamps.findIndex((chapter) => chapter.id === active.id);
            const newIndex = current.timestamps.findIndex((chapter) => chapter.id === over.id);
            return {
                ...current,
                timestamps: arrayMove(current.timestamps, oldIndex, newIndex),
            };
        });
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            {toast && (
                <div className="fixed right-5 top-5 z-50 rounded-full border border-emerald-400/30 bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-xl">
                    {toast}
                </div>
            )}

            <div className="grid min-h-screen lg:grid-cols-[40%_60%]">
                <section className="border-r border-slate-800 bg-slate-950 px-5 py-6 lg:h-screen lg:overflow-y-auto">
                    <Link href={backUrl} className="text-sm font-bold text-slate-300 hover:text-sky-200">
                        Back to Episodes
                    </Link>

                    <div className="mt-7 space-y-4">
                        <input
                            value={fields.title}
                            onChange={(event) => setFields((current) => ({ ...current, title: event.target.value }))}
                            className="w-full border-0 border-b border-slate-700 bg-transparent px-0 py-2 text-2xl font-black tracking-tight text-white outline-none focus:border-sky-300"
                            aria-label="Episode title"
                        />
                        <div className="grid gap-2 text-sm text-slate-400">
                            <p>Published: {formatDate(publishedAt)}</p>
                            <p>Duration: {formatDuration(durationSeconds)}</p>
                            <p>Status: {status}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-800" />
                        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">AI Content Pack</h2>
                        <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    {!processed && (
                        <button
                            type="button"
                            onClick={generateAll}
                            disabled={Boolean(loadingField)}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loadingField ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Generate All
                        </button>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 space-y-6">
                        <FieldShell field="transcript" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            <button
                                type="button"
                                onClick={() => setExpandedTranscript((value) => !value)}
                                className="text-xs font-bold text-sky-300 hover:text-sky-200"
                            >
                                {expandedTranscript ? 'Collapse transcript' : 'Expand transcript'}
                            </button>
                            {expandedTranscript && (
                                <textarea
                                    value={fields.transcript}
                                    onChange={(event) => setFields((current) => ({ ...current, transcript: event.target.value }))}
                                    className="mt-3 min-h-48 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm leading-relaxed text-slate-100 outline-none focus:border-sky-300"
                                    placeholder="Transcript text"
                                />
                            )}
                        </FieldShell>

                        <FieldShell field="chapters" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext items={fields.timestamps.map((chapter) => chapter.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {fields.timestamps.map((chapter) => (
                                            <SortableChapter
                                                key={chapter.id}
                                                chapter={chapter}
                                                onChange={updateChapter}
                                                onRemove={removeChapter}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                            <button
                                type="button"
                                onClick={addChapter}
                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-sky-300 hover:text-sky-200"
                            >
                                <Plus size={13} />
                                Add chapter
                            </button>
                        </FieldShell>

                        <FieldShell field="youtubeDescription" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            <textarea
                                value={fields.youtubeDescription}
                                onChange={(event) => setFields((current) => ({ ...current, youtubeDescription: event.target.value }))}
                                className="min-h-36 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm leading-relaxed text-slate-100 outline-none focus:border-sky-300"
                                placeholder="YouTube description"
                            />
                            <CopyButton onClick={() => copyText(fields.youtubeDescription)} />
                        </FieldShell>

                        <FieldShell field="spotifyDescription" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            <textarea
                                value={fields.spotifyDescription}
                                onChange={(event) => setFields((current) => ({ ...current, spotifyDescription: event.target.value }))}
                                className="min-h-32 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm leading-relaxed text-slate-100 outline-none focus:border-sky-300"
                                placeholder="Spotify description"
                            />
                            <CopyButton onClick={() => copyText(fields.spotifyDescription)} />
                        </FieldShell>

                        <FieldShell field="seoTags" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            <div className="flex flex-wrap gap-2">
                                {fields.seoTags.map((tag, index) => (
                                    <input
                                        key={`${tag}-${index}`}
                                        value={tag}
                                        onChange={(event) => {
                                            const next = [...fields.seoTags];
                                            next[index] = event.target.value;
                                            setFields((current) => ({ ...current, seoTags: next }));
                                        }}
                                        className="w-36 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-300"
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFields((current) => ({ ...current, seoTags: [...current.seoTags, ''] }))}
                                    className="inline-flex items-center justify-center rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-sky-300"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        </FieldShell>

                        <FieldShell field="thumbnail" fields={fields} loadingField={loadingField} progress={progress} onRegenerate={generateField}>
                            {fields.thumbnailUrl ? (
                                <Image
                                    src={fields.thumbnailUrl}
                                    alt="Generated episode thumbnail"
                                    width={640}
                                    height={360}
                                    unoptimized
                                    className="aspect-video w-full rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
                                    No thumbnail yet
                                </div>
                            )}
                        </FieldShell>
                    </div>

                    <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving}
                        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </section>

                <section className="min-h-[70vh] bg-slate-900 lg:h-screen">
                    <iframe
                        key={previewNonce}
                        title="Live episode page preview"
                        src={publicEpisodeUrl}
                        className="h-full min-h-[70vh] w-full border-0 bg-white lg:min-h-screen"
                    />
                </section>
            </div>
        </main>
    );
}

function FieldShell({
    field,
    fields,
    loadingField,
    progress,
    onRegenerate,
    children,
}: {
    field: FieldKey;
    fields: EditorFields;
    loadingField: FieldKey | null;
    progress: Record<FieldKey, 'idle' | 'loading' | 'done' | 'error'>;
    onRegenerate: (field: FieldKey) => void;
    children: React.ReactNode;
}) {
    const loading = loadingField === field || progress[field] === 'loading';
    const ready = hasValue(field, fields);

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-100">{fieldLabels[field]}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${ready ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {ready ? <Check size={11} /> : null}
                        {loading ? 'Working' : ready ? 'Ready' : 'Empty'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onRegenerate(field)}
                    disabled={loading}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:border-sky-300 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Regenerate ${fieldLabels[field]}`}
                    title={`Regenerate ${fieldLabels[field]}`}
                >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                </button>
            </div>
            {children}
        </section>
    );
}

function CopyButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-sky-300 hover:text-sky-200"
        >
            <Copy size={13} />
            Copy
        </button>
    );
}

function SortableChapter({
    chapter,
    onChange,
    onRemove,
}: {
    chapter: Chapter;
    onChange: (id: string, patch: Partial<Chapter>) => void;
    onRemove: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="grid grid-cols-[auto_82px_1fr_auto] items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2">
            <button
                type="button"
                className="cursor-grab text-slate-500 active:cursor-grabbing"
                aria-label="Reorder chapter"
                title="Drag to reorder"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} />
            </button>
            <input
                value={chapter.time}
                onChange={(event) => onChange(chapter.id, { time: event.target.value })}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-sky-300"
                aria-label="Chapter time"
            />
            <input
                value={chapter.title}
                onChange={(event) => onChange(chapter.id, { title: event.target.value })}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-sky-300"
                aria-label="Chapter title"
            />
            <button
                type="button"
                onClick={() => onRemove(chapter.id)}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                aria-label="Remove chapter"
                title="Remove chapter"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
