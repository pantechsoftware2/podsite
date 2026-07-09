import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { ThemeConfig } from '@/components/ThemeEngine';
import DashboardClient from '../_components/DashboardClient';

type PageProps = {
  searchParams: Promise<{ q?: string; active?: string; favorites?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const resolved = await searchParams;
  const q = (resolved.q ?? '').trim();
  const activeId = resolved.active;
  const showFavorites = resolved.favorites === 'true';
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    user.email?.split('@')[0] ||
    'Creator';

  let queryBuilder = supabase
    .from('podcasts')
    .select(
      'id, title, description, rss_url, owner_id, youtube_channel_id, theme_config, created_at',
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (q) {
    queryBuilder = queryBuilder.or(`title.ilike.%${q}%,rss_url.ilike.%${q}%`);
  }

  const { data: podcasts, error: podcastsError } = await queryBuilder;

  if (podcastsError) {
    console.error('dashboard podcasts error', podcastsError);
  }

  const rows =
    (podcasts as {
      id: string;
      title: string | null;
      description: string | null;
      rss_url: string | null;
      owner_id: string | null;
      youtube_channel_id: string | null;
      theme_config: ThemeConfig;
    }[]) ?? [];

  let active = activeId ? rows.find(r => r.id === activeId) : rows[0];
  if (!active && rows.length > 0) active = rows[0]; // fallback
  
  return (
    <>
      <DashboardClient 
        activePodcast={active} 
        allPodcasts={rows}
        showFavorites={showFavorites}
        q={q}
        displayName={displayName}
      />
    </>
  );
}
