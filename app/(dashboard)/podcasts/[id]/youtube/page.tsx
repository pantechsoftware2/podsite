// app/(dashboard)/podcasts/[id]/youtube/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { YoutubeSyncClient } from './youtube-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PodcastYouTubeSyncPage({ params }: PageProps) {
  const { id: podcastId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: podcast, error: podcastError } = await supabase
    .from('podcasts')
    .select('id, title')
    .eq('id', podcastId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!podcast || podcastError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Podcast not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            YouTube sync
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {podcast.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Connect your YouTube channel so new videos can be matched to
            episodes.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-sky-500 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </header>

      <YoutubeSyncClient podcastId={podcast.id} />
    </main>
  );
}
