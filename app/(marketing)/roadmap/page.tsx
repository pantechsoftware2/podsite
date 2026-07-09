// app/(marketing)/roadmap/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Phased Roadmap – Podcast Site Builder',
  description:
    'Three-phase roadmap for building a fast, beautiful, and monetizable podcast website platform.',
};

const phases = [
  {
    id: 1,
    label: 'Phase 1',
    title: 'The Core Foundation',
    timeframe: 'Weeks 1–4',
    status: 'in-progress', // we are here
    focus: 'Data Ingestion & Structural Integrity',
    goal:
      'A user can paste an RSS feed and a YouTube URL, and the system generates a fast, SEO-optimized (but ugly) website with working audio/video players.',
  },
  {
    id: 2,
    label: 'Phase 2',
    title: 'The Visual Engine',
    timeframe: 'Weeks 5–8',
    status: 'up-next',
    focus: 'Design Systems & Customization',
    goal:
      'The “ugly” site from Phase 1 gets Webflow-quality themes, color extraction, and drag-and-drop blocks.',
  },
  {
    id: 3,
    label: 'Phase 3',
    title: 'The Commerce Layer',
    timeframe: 'Weeks 9–12',
    status: 'planned',
    focus: 'Monetization',
    goal:
      'Users can connect Stripe and sell a digital file directly from their episode pages.',
  },
];

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22),_transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 mix-blend-soft-light [background-image:linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        {/* Header */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live roadmap · Phase 1 in progress
          </div>

          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Build the internet&apos;s fastest podcast websites
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            A three-phase roadmap that takes us from raw RSS ingestion to
            Webflow-level design and a fully monetizable commerce layer for
            podcasters.
          </p>
        </header>

        {/* Timeline */}
        <section className="mb-12">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
            <span className="inline-flex h-8 items-center rounded-full bg-slate-900/70 px-3 shadow-sm ring-1 ring-slate-700/60 backdrop-blur">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-slate-950">
                1
              </span>
              You are here · Core Foundation
            </span>
            <span className="hidden h-px flex-1 bg-gradient-to-r from-emerald-400/70 via-slate-600/60 to-slate-700/0 sm:block" />
          </div>
        </section>

        {/* Phases grid */}
        <section className="grid gap-6 md:grid-cols-3">
          {phases.map((phase) => {
            const isCurrent = phase.status === 'in-progress';
            const isNext = phase.status === 'up-next';

            return (
              <article
                key={phase.id}
                className={[
                  'relative flex flex-col rounded-2xl border bg-slate-900/60 p-5 shadow-lg backdrop-blur transition transform',
                  'border-slate-700/70 hover:-translate-y-1 hover:border-cyan-400/70 hover:shadow-cyan-500/20',
                  isCurrent && 'ring-2 ring-emerald-400/70 shadow-emerald-500/25',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Status pill */}
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-200">
                    <span className="text-slate-400">{phase.label}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                    <span>{phase.timeframe}</span>
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      In progress
                    </span>
                  )}
                  {isNext && !isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                      Up next
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold tracking-tight text-slate-50">
                  {phase.title}
                </h2>

                {/* Focus */}
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-cyan-300">
                  Focus: {phase.focus}
                </p>

                {/* Goal */}
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {phase.goal}
                </p>

                {/* Divider */}
                <div className="mt-4 h-px w-full bg-gradient-to-r from-slate-700/80 via-slate-700/40 to-transparent" />

                {/* Sub-points tailored to each phase */}
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  {phase.id === 1 && (
                    <>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-300" />
                        <span>
                          Paste an RSS feed + YouTube URL and auto‑generate a
                          blazing‑fast, SEO‑friendly site with working
                          audio/video players.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-300" />
                        <span>
                          Solid data model for podcasts, episodes, slugs, and
                          media assets that can scale to thousands of episodes.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300" />
                        <span>
                          Core performance: static generation where possible,
                          aggressive caching, and Lighthouse‑friendly defaults.
                        </span>
                      </li>
                    </>
                  )}
                  {phase.id === 2 && (
                    <>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-fuchsia-300" />
                        <span>
                          Theme presets inspired by top podcast and SaaS
                          websites with tight typography and spacing.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-300" />
                        <span>
                          Automatic color extraction from cover art for
                          on‑brand backgrounds, buttons, and players.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-300" />
                        <span>
                          Drag‑and‑drop layout blocks for hero, episode lists,
                          CTAs, and newsletter signup sections.
                        </span>
                      </li>
                    </>
                  )}
                  {phase.id === 3 && (
                    <>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300" />
                        <span>
                          Native Stripe Connect integration so each creator can
                          plug in their own account safely.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-300" />
                        <span>
                          Sell digital files directly from episode pages:
                          templates, PDFs, bonus audio, or video courses.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-300" />
                        <span>
                          Analytics for revenue per episode, top products, and
                          conversion from listener to buyer.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </article>
            );
          })}
        </section>

        {/* CTA section */}
        <section className="mt-10 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-lg backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                Want to ship faster through the roadmap?
              </h3>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Help test the Phase 1 builder and get early access to the Phase
                2 visual editor and Phase 3 commerce tools.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm shadow-cyan-500/40 transition hover:bg-cyan-300"
              >
                Join early access
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-400/80"
              >
                View current demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
