import Link from 'next/link';
import type { DerivedGuest, DerivedTopic, PublicEpisodeRecord } from '@/lib/publicSite';

export default function SeoDiscoveryBlock({
  podcastTitle,
  siteBasePath,
  guests,
  topics,
  transcriptEpisodes,
}: {
  podcastTitle: string;
  siteBasePath: string;
  guests: DerivedGuest[];
  topics: DerivedTopic[];
  transcriptEpisodes: PublicEpisodeRecord[];
}) {
  const featuredGuests = guests.slice(0, 6);
  const featuredTopics = topics.slice(0, 8);
  const transcriptLinks = transcriptEpisodes.slice(0, 6);

  return (
    <section className="w-full px-4 py-16 scroll-mt-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur-md">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Explore The Archive
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">
            Indexable pages for every angle of {podcastTitle}
          </h2>
          <p className="max-w-3xl text-sm text-slate-300 md:text-base">
            Browse the show by episode, guest, topic, transcript, or learn more
            about the host and brand behind the podcast.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Topics
              </h3>
              <Link href={`${siteBasePath}/topics`} className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                View All
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {featuredTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`${siteBasePath}/topics/${topic.slug}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-200 hover:border-[var(--primary)] hover:text-white"
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Guests
              </h3>
              <Link href={`${siteBasePath}/guests`} className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {featuredGuests.map((guest) => (
                <Link
                  key={guest.slug}
                  href={`${siteBasePath}/guests/${guest.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:border-[var(--primary)]"
                >
                  <span>{guest.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {guest.episodes.length} eps
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Transcripts
              </h3>
              <Link href={`${siteBasePath}/about`} className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                About
              </Link>
            </div>
            <div className="space-y-2">
              {transcriptLinks.map((episode) => (
                <Link
                  key={episode.slug}
                  href={`${siteBasePath}/episodes/${episode.slug}/transcript`}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:border-[var(--primary)]"
                >
                  {episode.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
