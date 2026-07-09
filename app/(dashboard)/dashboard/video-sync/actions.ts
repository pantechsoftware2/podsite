'use server';

import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function approveMatch(episodeId: string, videoId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from('episodes')
        .update({ youtube_video_id: videoId, video_sync_status: 'approved' })
        .eq('id', episodeId);

    if (error) {
        console.error('Failed to approve match:', error);
        throw new Error('Failed to save match');
    }
}

export async function rejectMatch(episodeId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from('episodes')
        .update({ youtube_video_id: null, video_sync_status: 'rejected' })
        .eq('id', episodeId);

    if (error) {
        console.error('Failed to reject match:', error);
        throw new Error('Failed to save match');
    }
}
