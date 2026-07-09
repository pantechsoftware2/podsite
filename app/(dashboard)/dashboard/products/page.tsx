import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import ProductsClient from './_components/ProductsClient';
import Link from 'next/link';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import ThemeEngine from '@/components/ThemeEngine';
import { isProductsEnabled } from '@/lib/featureFlags';

type ProductRow = {
    id: string;
    title: string | null;
    description: string | null;
    price: number | null;
    file_name?: string | null;
};

export default async function ProductsPage() {
    if (!isProductsEnabled()) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-4 space-y-6">
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">Products are private for now</h1>
                    <p className="mt-3 text-slate-300">
                        Digital products are still being finished end to end, so this area is hidden in shared builds.
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
        .select('id, title, stripe_account_id, theme_config')
        .eq('owner_id', user.id);

    const activePodcast = podcasts?.[0];

    if (!activePodcast) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center">
                <p className="text-white">No active podcast found.</p>
            </div>
        );
    }

    const stripeAccountId = activePodcast.stripe_account_id;

    // Fetch products
    let products: ProductRow[] = [];
    const { data: fetchedProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('podcast_id', activePodcast.id)
        .order('created_at', { ascending: false });

    if (!productsError && fetchedProducts) {
        products = fetchedProducts;
    }

    const primaryColor = activePodcast.theme_config?.primaryColor || '#6366f1';
    const accentColor = activePodcast.theme_config?.accentColor || '#8b5cf6';

    return (
        <div className="product-theme-scope">
            <ThemeEngine config={activePodcast.theme_config || {}} scope=".product-theme-scope" />
            <div 
                className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-in fade-in"
                style={{
                    '--podcast-primary': primaryColor,
                    '--podcast-accent': accentColor,
                    '--primary': primaryColor, // Fallback for some components
                } as React.CSSProperties}
            >
                <header className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Digital Products</h1>
                        <p className="text-slate-400 mt-2">Sell premium audio, PDFs, and bonuses directly on your site.</p>
                    </div>
                    <Link
                        href={`/dashboard`}
                        className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-6 py-2 text-sm font-bold text-slate-200 transition-all hover:border-[var(--podcast-primary)] hover:text-[var(--podcast-primary)]"
                    >
                        <ChevronLeft size={18} />
                        Dashboard
                    </Link>
                </header>

                {!process.env.STRIPE_SECRET_KEY && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-sm font-semibold flex items-center gap-3">
                        <AlertCircle size={18} />
                        Developer Notice: Stripe Keys are not configured in environment variables.
                    </div>
                )}

                <ProductsClient
                    podcastId={activePodcast.id}
                    stripeAccountId={stripeAccountId}
                    products={products}
                />
            </div>
        </div>
    );
}
