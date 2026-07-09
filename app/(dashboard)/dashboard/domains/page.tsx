import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import DomainsClient from './_components/DomainsClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ThemeEngine from '@/components/ThemeEngine';
import { isCustomDomainsEnabled } from '@/lib/featureFlags';

export default async function DomainsPage() {
    if (!isCustomDomainsEnabled()) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-4 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">Custom domains are not enabled</h1>
                    <p className="mt-3 text-slate-300">
                        Domain setup is hidden until Vercel credentials are configured and the flow is ready for external users.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-6 py-2 text-sm font-bold text-slate-200 transition-all hover:border-white/20 hover:text-white"
                    >
                        <ChevronLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: podcasts } = await supabase
        .from('podcasts')
        .select('id, title, custom_domain, theme_config')
        .eq('owner_id', user.id);

    const activePodcast = podcasts?.[0];

    if (!activePodcast) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center">
                <p className="text-white">No active podcast found.</p>
            </div>
        );
    }

    const primaryColor = activePodcast.theme_config?.primaryColor || '#6366f1';
    const accentColor = activePodcast.theme_config?.accentColor || '#8b5cf6';

    return (
        <div className="domains-theme-scope">
            <ThemeEngine config={activePodcast.theme_config || {}} scope=".domains-theme-scope" />
            <div 
                className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-in fade-in"
                style={{
                    '--podcast-primary': primaryColor,
                    '--podcast-accent': accentColor,
                } as React.CSSProperties}
            >
                <header className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Custom Domains
                        </h1>
                        <p className="text-slate-400 mt-2">Connect your own domain to your premium podcast site.</p>
                    </div>
                    <Link
                        href={`/dashboard`}
                        className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-6 py-2 text-sm font-bold text-slate-200 transition-all hover:border-[var(--podcast-primary)] hover:text-[var(--podcast-primary)]"
                    >
                        <ChevronLeft size={18} />
                        Dashboard
                    </Link>
                </header>

                <DomainsClient
                    podcastId={activePodcast.id}
                    initialDomain={activePodcast.custom_domain}
                />
            </div>
        </div>
    );
}
