// app/page.tsx
import { redirect } from 'next/navigation';
import { NewPodcastForm } from './(dashboard)/_components/NewPodcastForm';

type HomeProps = {
  searchParams: Promise<{ code?: string; next?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { code, next } = await searchParams;

  if (code) {
    const callbackParams = new URLSearchParams({
      code,
      next: next || '/dashboard',
    });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        <div className="mb-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Paste RSS to live site
          </p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
            Import your podcast
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Paste your RSS feed and click Import.
          </p>
        </div>
        <NewPodcastForm />
      </section>
    </main>
  );
}
