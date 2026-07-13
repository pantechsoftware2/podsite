import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getPublicSupabaseConfigStatus } from '@/lib/config';
import { ThemeConfig } from '@/components/ThemeEngine';
import DashboardClient from '../_components/DashboardClient';

type PageProps = {
  searchParams: Promise<{ q?: string; active?: string; favorites?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const q = (resolved.q ?? '').trim();
  const activeId = resolved.active;
  const showFavorites = resolved.favorites === 'true';
  let displayName = 'Creator';
  let rows: {
      id: string;
      title: string | null;
      description: string | null;
      rss_url: string | null;
      owner_id: string | null;
      youtube_channel_id: string | null;
      theme_config: ThemeConfig;
    }[] = [];

  const supabaseConfig = getPublicSupabaseConfigStatus();

  if (supabaseConfig.ok) {
    const supabase = await createSupabaseServerClient();

    // Auth gate temporarily disabled: use the session if one exists, but do not redirect.
    // const {
    //   data: { user },
    //   error: userError,
    // } = await supabase.auth.getUser();
    //
    // if (userError || !user) {
    //   redirect('/login');
    // }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn('dashboard guest mode: no active Supabase user', userError.message);
    }

    displayName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.user_name ||
      user?.email?.split('@')[0] ||
      'Creator';

    let queryBuilder = supabase
      .from('podcasts')
      .select(
        'id, title, description, rss_url, owner_id, youtube_channel_id, theme_config, created_at',
      )
      .order('created_at', { ascending: false });

    if (user) {
      queryBuilder = queryBuilder.eq('owner_id', user.id);
    }

    if (q) {
      queryBuilder = queryBuilder.or(`title.ilike.%${q}%,rss_url.ilike.%${q}%`);
    }

    const { data: podcasts, error: podcastsError } = await queryBuilder;

    if (podcastsError) {
      console.error('dashboard podcasts error', podcastsError);
    }

    rows =
      (podcasts as {
        id: string;
        title: string | null;
        description: string | null;
        rss_url: string | null;
        owner_id: string | null;
        youtube_channel_id: string | null;
        theme_config: ThemeConfig;
      }[]) ?? [];
  } else {
    console.warn(
      `dashboard guest mode: Supabase is not configured. Missing: ${supabaseConfig.missing.join(', ')}`,
    );
  }

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
