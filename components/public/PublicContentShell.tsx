import ThemeEngine, { ThemeConfig } from '@/components/ThemeEngine';
import NetflixLayout from '@/components/layouts/NetflixLayout';
import SubstackLayout from '@/components/layouts/SubstackLayout';
import GenZLayout from '@/components/layouts/GenZLayout';

type PublicShellPodcast = {
  id: string;
  title: string;
  tagline?: string;
  image?: string;
  description?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  rss_url?: string | null;
  rssUrl?: string;
  latest_video_id?: string;
  siteBasePath?: string;
  generatedPages?: Array<{ slug: string; navLabel: string }>;
};

export default function PublicContentShell({
  podcast,
  themeConfig,
  episode,
  children,
  contentClassName = 'mx-auto max-w-5xl px-4 py-16',
}: {
  podcast: PublicShellPodcast;
  themeConfig: ThemeConfig;
  episode?: Record<string, unknown>;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const layout = themeConfig.layout || 'netflix';
  const LayoutComponent =
    layout === 'substack' ? SubstackLayout :
    layout === 'genz' ? GenZLayout :
    NetflixLayout;
  const shellPodcast = {
    ...podcast,
    generatedPages: podcast.generatedPages || themeConfig.generatedPages || [],
    twitterUrl: themeConfig.twitterUrl || podcast.twitterUrl,
    linkedInUrl: themeConfig.linkedInUrl || podcast.linkedInUrl,
    youtubeUrl: themeConfig.youtubeUrl || podcast.youtubeUrl,
    spotifyUrl: themeConfig.spotifyUrl || podcast.spotifyUrl,
    rssUrl: themeConfig.rssUrlOverride || podcast.rssUrl || podcast.rss_url || undefined,
  };

  return (
    <>
      <ThemeEngine config={themeConfig} />
      <LayoutComponent podcast={shellPodcast} episode={episode}>
        <div className={contentClassName}>{children}</div>
      </LayoutComponent>
    </>
  );
}
