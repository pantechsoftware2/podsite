// app/(dashboard)/dashboard/customize/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import SplitScreenEditor from '@/components/dashboard/SplitScreenEditor';

export default async function CustomizePage({
    searchParams,
}: {
    searchParams: Promise<{ siteId?: string }>;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const resolvedParams = await searchParams;
    const siteId = resolvedParams.siteId;

    if (!siteId) {
        redirect('/dashboard');
    }

    const { data: podcast } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', siteId)
        .eq('owner_id', user.id)
        .single();

    if (!podcast) {
        redirect('/dashboard');
    }

    return <SplitScreenEditor podcast={podcast} />;
}
