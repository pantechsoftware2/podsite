import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function CheckoutPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ podcastId?: string; returnUrl?: string }>;
}) {
  const { productId } = await params;
  const { podcastId, returnUrl } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Checkout</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Complete your purchase</p>
        </div>

        <div className="bg-black/40 rounded-3xl p-8 border border-white/5">
          <h2 className="text-xl font-bold mb-2">{product.title}</h2>
          <p className="text-slate-400 text-sm mb-6">{product.description}</p>
          <div className="text-4xl font-black text-primary italic">
            ${product.price ? product.price.toFixed(2) : '0.00'}
          </div>
        </div>

        <div className="space-y-4">
          <button 
            disabled
            className="w-full bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase tracking-[0.2em] italic border-2 border-white/5 cursor-not-allowed"
          >
            Stripe integration coming soon
          </button>
          
          <Link 
            href={returnUrl || '/'} 
            className="block text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            ← Cancel and go back
          </Link>
        </div>
        
        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          <span className="w-2 h-2 rounded-full bg-slate-800"></span>
          Secure Sandbox Environment
          <span className="w-2 h-2 rounded-full bg-slate-800"></span>
        </div>
      </div>
    </main>
  );
}
