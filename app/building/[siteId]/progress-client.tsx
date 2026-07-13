'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Loader2, WandSparkles } from 'lucide-react';

type BuildStatus = {
  pipelineStatus: string;
  rssParsed: boolean;
  totalEpisodes: number;
  episodesImported: boolean;
  importedEpisodes: number;
  artworkDetected: boolean;
  colorsExtracted: boolean;
  themeStatus: string;
  themeReady: boolean;
  transcriptionStatus: string;
  transcribedEpisodes: number;
  latestMessage: string;
  error: string | null;
};

type StepState = 'done' | 'active' | 'waiting' | 'failed';

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  if (state === 'active') return <Loader2 className="h-5 w-5 animate-spin text-sky-300" />;
  if (state === 'failed') return <Circle className="h-5 w-5 text-red-300" />;
  return <Circle className="h-5 w-5 text-slate-600" />;
}

async function readJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  const title = text.match(/<title>(.*?)<\/title>/i)?.[1];
  throw new Error(title || text.slice(0, 160) || 'Server returned a non-JSON response');
}

export default function BuildProgressClient({ siteId }: { siteId: string }) {
  const router = useRouter();
  const startedRef = useRef(false);
  const redirectedRef = useRef(false);
  const [status, setStatus] = useState<BuildStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    fetch(`/api/podcasts/${siteId}/build/run`, { method: 'POST' }).catch(() => {
      setError('Could not start the build process.');
    });
  }, [siteId]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/podcasts/${siteId}/build/status`, { cache: 'no-store' });
        const json = await readJsonResponse(res);

        if (!res.ok) throw new Error(json.error || 'Unable to load build status');
        if (cancelled) return;

        setStatus(json.status);

        if (json.status?.pipelineStatus === 'ready' && !redirectedRef.current) {
          redirectedRef.current = true;
          setTimeout(() => router.push(`/${siteId}?edit=true`), 650);
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : 'Unable to load build status');
        }
      }
    };

    poll();
    const interval = window.setInterval(poll, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, siteId]);

  const steps = useMemo(() => {
    const failed = Boolean(status?.error || error);
    return [
      {
        label: status?.rssParsed
          ? `RSS Parsed - ${status.totalEpisodes} episodes found`
          : 'Parsing RSS',
        state: failed ? 'failed' : status?.rssParsed ? 'done' : 'active',
      },
      {
        label: status?.episodesImported
          ? `Episodes Imported - ${status.importedEpisodes || status.totalEpisodes} saved`
          : 'Importing episodes',
        state: failed ? 'failed' : status?.episodesImported ? 'done' : status?.rssParsed ? 'active' : 'waiting',
      },
      {
        label: status?.themeReady ? 'Theme Generated' : 'Generating theme',
        state: failed ? 'failed' : status?.themeReady ? 'done' : status ? 'active' : 'waiting',
      },
      {
        label: status?.themeReady ? 'AI Processing' : 'AI Processing queued',
        state: failed
          ? 'failed'
          : status?.themeReady
            ? 'done'
            : status?.episodesImported
              ? 'active'
              : 'waiting',
      },
      {
        label: status?.transcriptionStatus === 'done'
          ? `Transcribing complete - ${status.transcribedEpisodes} completed`
          : 'Transcribing latest episodes',
        state: failed
          ? 'failed'
          : status?.transcriptionStatus === 'done'
            ? 'done'
            : status?.themeReady || status?.transcriptionStatus === 'processing'
              ? 'active'
              : 'waiting',
      },
      {
        label: 'Site Ready',
        state: failed ? 'failed' : status?.pipelineStatus === 'ready' ? 'done' : 'waiting',
      },
    ] satisfies Array<{ label: string; state: StepState }>;
  }, [error, status]);

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black">
            <WandSparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Building your site</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Paste RSS to live site</h1>
          </div>
        </div>

        <div className="border-y border-white/10">
          {steps.map((step) => (
            <div key={step.label} className="flex min-h-16 items-center gap-4 border-b border-white/10 py-4 last:border-b-0">
              <StepIcon state={step.state} />
              <span className={step.state === 'waiting' ? 'text-slate-500' : 'text-slate-100'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 min-h-6 text-sm text-slate-400">
          {status?.latestMessage || error || 'Starting the build pipeline...'}
        </p>
      </section>
    </main>
  );
}
