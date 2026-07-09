'use server';

import { revalidatePath } from 'next/cache';
import type { ThemeConfig } from '@/components/ThemeEngine';
import { sanitizeGeneratedPages } from '@/lib/podcastBlueprints';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function updateCustomizeAction(
    podcastId: string,
    update: {
        title?: string;
        description?: string;
        theme_config?: ThemeConfig;
        page_layout?: string[];
    },
) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const safeUpdate = update.theme_config
        ? {
            ...update,
            theme_config: {
                ...update.theme_config,
                generatedPages: sanitizeGeneratedPages(update.theme_config.generatedPages),
            },
        }
        : update;

    const { error } = await supabase
        .from('podcasts')
        .update(safeUpdate)
        .eq('id', podcastId)
        .eq('owner_id', user.id);

    if (error) {
        console.error('Error updating customization:', error);
        throw new Error('Failed to update customization');
    }

    revalidatePath(`/dashboard/customize?siteId=${podcastId}`);
    revalidatePath(`/${podcastId}`);

    return { success: true };
}
