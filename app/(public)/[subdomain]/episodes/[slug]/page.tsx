import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Metadata } from 'next';
import { ThemeConfig } from '@/components/ThemeEngine';
import EpisodePlayer from '@/components/EpisodePlayer';
import PublicContentShell from '@/components/public/PublicContentShell';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildEpisodeJsonLd,
  buildEpisodeVideoJsonLd,
  deriveGuests,
  deriveTopics,
  excerpt,
  getPublicBasePath,
  inferHostName,
  normalizeSeoEpisodes,
  resolvePodcastBySubdomain,
} from '@/lib/publicSite';

type PageProps = {
  params: Promise<{ subdomain: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { podcast, error: podcastError } = await resolvePodcastBySubdomain<{
    id: string;
    title?: string;
    description?: string;
    custom_domain?: string | null;
  }>(supabase, subdomain, 'id, title, description, custom_domain');
  
  if (podcastError) {
    console.error('Episode generateMetadata - Podcast query error:', podcastError);
  }
  
  if (!podcast) return { title: 'Podcast Not Found' };

  const { data: episode } = await supabase
    .from('episodes')
    .select('title, description')
    .eq('podcast_id', podcast.id)
    .eq('slug', slug)
    .maybeSingle();

  if (!episode) return { title: 'Episode Not Found' };

  const canonical = await buildCanonicalUrl(podcast, subdomain, `episodes/${slug}`);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app';
  const ogUrl = new URL(`${baseUrl}/api/og/${subdomain}`);
  ogUrl.searchParams.set('title', episode.title || '');

  return {
    title: `${episode.title} | ${podcast.title}`,
    description: excerpt(episode.description, 160),
    alternates: {
      canonical,
    },
    openGraph: {
      title: episode.title || 'Episode',
      description: excerpt(episode.description, 160),
      url: canonical,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: episode.title || 'Episode',
      description: excerpt(episode.description, 160),
      images: [ogUrl.toString()],
    },
  };
}

export default async function EpisodePage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { podcast: resolvedPodcast, error: podcastError } = await resolvePodcastBySubdomain<{ id: string; [k: string]: unknown }>(
    supabase,
    subdomain,
    '*',
  );
  const podcast = resolvedPodcast;

  if (podcastError) {
    console.error('Episode page - Podcast query error:', podcastError);
  }

  if (podcastError || !podcast) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans selection:bg-primary/30">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-2xl rounded-full opacity-50 animate-pulse" />
            <h1 className="relative text-7xl font-black text-white tracking-tighter uppercase italic">404</h1>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Podcast not found</h2>
            <p className="text-slate-400 leading-relaxed">
              The show <code className="bg-white/5 px-1.5 py-0.5 rounded text-primary border border-white/10">{String(subdomain)}</code> could not be found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const themeConfig = (podcast.theme_config as unknown as ThemeConfig) || {};
  const layout = themeConfig.layout || 'netflix';
  const siteBasePath = await getPublicBasePath(subdomain, (podcast.custom_domain as string | null) || null);
  const podcastWithImage = { 
    ...podcast, 
    image: themeConfig.imageUrl,
    title: podcast.title as string,
    siteBasePath,
  };

  const { data: episode } = await supabase
    .from('episodes')
    .select(
      'id, title, published_at, audio_url, youtube_video_id, description, image_url, duration_seconds',
    )
    .eq('podcast_id', podcast.id)
    .eq('slug', slug)
    .maybeSingle();

  const finalEpisode = episode;

  if (!finalEpisode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans selection:bg-primary/30">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <h2 className="text-2xl font-bold text-white tracking-tight italic uppercase">Episode not found</h2>
          <p className="text-slate-400 leading-relaxed">
            The requested episode <code className="bg-white/5 px-1.5 py-0.5 rounded text-primary border border-white/10">{slug}</code> doesn&apos;t exist.
          </p>
          <Link href={siteBasePath || '/'} className="inline-block px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary transition-all">
            Back to Show
          </Link>
        </div>
      </main>
    );
  }

  const { data: seoEpisodesData } = await supabase
    .from('episodes')
    .select('slug, title, description, published_at')
    .eq('podcast_id', podcast.id)
    .order('published_at', { ascending: false })
    .limit(120);

  const guestLinks = deriveGuests([{
    slug,
    title: finalEpisode.title || null,
    description: finalEpisode.description || null,
    published_at: finalEpisode.published_at || null,
  }]).slice(0, 4);
  const topicLinks = deriveTopics(normalizeSeoEpisodes(seoEpisodesData), themeConfig)
    .filter((topic) => {
      const haystack = `${finalEpisode.title || ''} ${finalEpisode.description || ''}`.toLowerCase();
      return haystack.includes(topic.name.toLowerCase()) || haystack.includes(topic.slug.replace(/-/g, ' '));
    })
    .slice(0, 5);
  const canonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
    `episodes/${slug}`,
  );
  const showCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
  );
  const transcriptCanonical = await buildCanonicalUrl(
    podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null },
    subdomain,
    `episodes/${slug}/transcript`,
  );
  const hostName = inferHostName(podcast as { id: string; title: string | null; description?: string | null; theme_config?: ThemeConfig | null });
  const videoJsonLd = buildEpisodeVideoJsonLd({
    episode: {
      slug,
      title: finalEpisode.title || null,
      description: finalEpisode.description || null,
      published_at: finalEpisode.published_at || null,
      youtube_video_id: finalEpisode.youtube_video_id || null,
      image_url: finalEpisode.image_url || null,
      duration_seconds: finalEpisode.duration_seconds || null,
    },
    episodeUrl: canonical,
    podcastTitle: podcastWithImage.title,
    hostName,
  });
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: podcastWithImage.title, url: showCanonical },
      { name: 'Episodes', url: `${showCanonical.replace(/\/$/, '')}/episodes` },
      { name: finalEpisode.title || 'Episode', url: canonical },
    ]),
    buildEpisodeJsonLd({
      podcast: podcast as { id: string; title: string | null; description?: string | null; custom_domain?: string | null; theme_config?: ThemeConfig | null },
      episode: {
        slug,
        title: finalEpisode.title || null,
        description: finalEpisode.description || null,
        published_at: finalEpisode.published_at || null,
        audio_url: finalEpisode.audio_url || null,
        youtube_video_id: finalEpisode.youtube_video_id || null,
        image_url: finalEpisode.image_url || null,
        duration_seconds: finalEpisode.duration_seconds || null,
      },
      episodeUrl: canonical,
      seriesUrl: showCanonical,
      transcriptUrl: transcriptCanonical,
      imageUrl: finalEpisode.image_url || themeConfig.imageUrl,
      hostName,
    }),
    ...(videoJsonLd ? [videoJsonLd] : []),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PublicContentShell podcast={podcastWithImage} themeConfig={themeConfig} episode={finalEpisode}>
        <div className="mx-auto max-w-5xl py-20">
          <header className="mb-16">
            <Link
              href={siteBasePath || '/'}
              className="group mb-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:opacity-80 transition-all font-sans"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              Back to {podcastWithImage.title}
            </Link>
            <h1 className="mt-6 text-5xl font-black italic tracking-tighter md:text-8xl leading-[0.85] uppercase">
              {finalEpisode.title}
            </h1>
            <div className="mt-8 flex items-center gap-6">
              {finalEpisode.published_at && (
                <p className="text-sm font-black uppercase tracking-widest text-zinc-500">
                  {new Date(finalEpisode.published_at).toLocaleDateString(undefined, {
                    dateStyle: 'long'
                  })}
                </p>
              )}
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Official Release
              </p>
            </div>
          </header>

          <div className={
            layout === 'genz' ? "border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] bg-white p-4" :
              layout === 'substack' ? "border border-zinc-100 bg-white" :
                ""
          }>
            <EpisodePlayer
              podcastId={podcast.id}
              youtubeVideoId={finalEpisode.youtube_video_id}
              audioUrl={finalEpisode.audio_url}
              title={finalEpisode.title || 'Untitled'}
              description={finalEpisode.description || ''}
              primaryColor={themeConfig.primaryColor}
              accentColor={themeConfig.accentColor}
              platformLinks={{
                podcastTitle: podcastWithImage.title,
                applePodcastsUrl: themeConfig.applePodcastsUrl,
                spotifyUrl: themeConfig.spotifyUrl,
                youtubeUrl: themeConfig.youtubeUrl,
                rssUrl: themeConfig.rssUrlOverride || (podcast.rss_url as string | null) || null,
              }}
            />
          </div>

          <div className="mt-32 pt-16 border-t border-zinc-100/10">
            <div className="mb-10 flex flex-wrap gap-3">
              <Link
                href={`${siteBasePath}/episodes/${slug}/transcript`}
                className="rounded-full border border-current px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-primary"
              >
                Read Transcript
              </Link>
              <Link
                href={`${siteBasePath}/episodes`}
                className="rounded-full border border-current px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-primary"
              >
                Browse Archive
              </Link>
              <Link
                href={`${siteBasePath}/about`}
                className="rounded-full border border-current px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-primary"
              >
                About The Show
              </Link>
            </div>

            {guestLinks.length > 0 && (
              <div className="mb-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                  Guests Mentioned
                </p>
                <div className="flex flex-wrap gap-3">
                  {guestLinks.map((guest) => (
                    <Link
                      key={guest.slug}
                      href={`${siteBasePath}/guests/${guest.slug}`}
                      className="rounded-full border border-current px-4 py-2 text-sm hover:text-primary"
                    >
                      {guest.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {topicLinks.length > 0 && (
              <div className="mb-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                  Related Topics
                </p>
                <div className="flex flex-wrap gap-3">
                  {topicLinks.map((topic) => (
                    <Link
                      key={topic.slug}
                      href={`${siteBasePath}/topics/${topic.slug}`}
                      className="rounded-full border border-current px-4 py-2 text-sm hover:text-primary"
                    >
                      {topic.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={siteBasePath || '/'}
              className="group inline-flex items-center gap-4 text-2xl font-black italic uppercase tracking-tighter text-current transition-all hover:text-primary no-underline"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-current transition-transform group-hover:-translate-x-3 no-underline">←</span>
              <span>Keep Exploring {podcastWithImage.title}</span>
            </Link>
          </div>
        </div>
      </PublicContentShell>
    </>
  );
}
