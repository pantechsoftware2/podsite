// components/dashboard/BlockReorder.tsx
'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';

interface SortableItemProps {
    id: string;
    label: string;
    isHidden: boolean;
    onToggleVisibility: (id: string) => void;
}

function SortableItem({ id, label, isHidden, onToggleVisibility }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 transition-colors ${isDragging ? 'border-primary bg-slate-900 shadow-xl' : 'hover:border-slate-700'
                }`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing"
            >
                <GripVertical size={20} />
            </button>
            <div className="flex-1">
                <p className={`text-sm font-semibold capitalize transition-all ${isHidden ? 'text-slate-600' : 'text-slate-200'}`}>{label}</p>
            </div>
            <button
                onClick={() => onToggleVisibility(id)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${isHidden ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
            >
                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                {isHidden ? 'Hidden' : 'Visible'}
            </button>
        </div>
    );
}

export default function BlockReorder({
    podcastId,
    items,
    hiddenItems = [],
    onChange,
    onToggleHidden
}: {
    podcastId: string,
    items: string[],
    hiddenItems?: string[],
    onChange: (items: string[]) => void,
    onToggleHidden?: (id: string) => void
}) {
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required to start dragging
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            const newLayout = arrayMove(items, oldIndex, newIndex);

            // Update parent state immediately for UI
            onChange(newLayout);

            // Auto-save to database
            setIsSaving(true);
            try {
                const supabase = createSupabaseBrowserClient();
                const { error } = await supabase
                    .from('podcasts')
                    .update({ page_layout: newLayout })
                    .eq('id', podcastId);

                if (error) {
                    console.error('Failed to save layout:', error);
                } else {
                    router.refresh();
                }
            } catch (error) {
                console.error('Error saving layout:', error);
            } finally {
                setIsSaving(false);
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-200">Page Structure</h3>
            </div>
            <p className="text-sm text-slate-400">Drag to reorder how sections appear on your homepage.</p>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2">
                        {items.map((id) => (
                            <SortableItem
                                key={id}
                                id={id}
                                label={id}
                                isHidden={hiddenItems.includes(id)}
                                onToggleVisibility={() => onToggleHidden?.(id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
