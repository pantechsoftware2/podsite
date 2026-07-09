'use client';

import React, { useState } from 'react';
import { CreditCard, UploadCloud, Plus, Package, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type ProductSummary = {
    id: string;
    title: string | null;
    description: string | null;
    price: number | null;
    file_name?: string | null;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Something went wrong';
}

export default function ProductsClient({
    podcastId,
    stripeAccountId,
    products,
}: {
    podcastId: string;
    stripeAccountId: string | null;
    products: ProductSummary[];
}) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Product Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('5.00');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleConnectStripe = async () => {
        setIsConnecting(true);
        try {
            const res = await fetch('/api/stripe/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ podcastId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to connect');
            }
        } catch (error: unknown) {
            console.error(error);
            alert(getErrorMessage(error));
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripeAccountId) {
            setError('Connect Stripe payouts before creating products.');
            return;
        }

        if (!file || !title || !price) {
            setError('Please fill all required fields and select a file.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${podcastId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, file);

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const filePath = uploadData.path;

            // 2. Call our API to create Stripe Product & Save to DB
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    price: parseFloat(price),
                    podcastId,
                    filePath,
                    fileName: file.name
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create product');

            setTitle('');
            setDescription('');
            setPrice('5.00');
            setFile(null);
            router.refresh();
        } catch (error: unknown) {
            console.error(error);
            setError(getErrorMessage(error));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-12">

            {/* Stripe Connection Area */}
            <div className={`p-8 rounded-[2rem] border-2 transition-all ${stripeAccountId ? 'border-primary/20 bg-primary/5' : 'border-indigo-500/30 bg-indigo-950/20'}`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${stripeAccountId ? 'bg-primary/20 text-primary' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                                {stripeAccountId ? 'Stripe Connected' : 'Setup Payouts'}
                            </h2>
                            <p className="text-sm text-slate-400 max-w-md">
                                {stripeAccountId
                                    ? 'Your Stripe Express account is linked. Open Stripe any time to review onboarding, payouts, and business details.'
                                    : 'Connect with Stripe to verify your identity and start accepting payments securely.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleConnectStripe}
                        disabled={isConnecting}
                        className={`shrink-0 px-8 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50 ${stripeAccountId ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]'}`}
                    >
                        {isConnecting ? 'Connecting...' : stripeAccountId ? 'Open Stripe' : 'Connect Stripe'}
                    </button>
                </div>
            </div>

            {/* Create Product Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-3 text-white">
                        <Package size={20} className="text-primary" />
                        <h2 className="text-xl font-bold">New Product</h2>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Upload a digital file like a PDF guide, bonus audio episode, or exclusive video. Fans can buy and download it securely.
                    </p>
                </div>

                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
                    <form onSubmit={handleCreateProduct} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. The Ultimate Guide PDF"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What will they get?"
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Price (USD)</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-3.5 text-slate-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Upload File</label>
                                    <div className="relative overflow-hidden">
                                        <input
                                            type="file"
                                            required
                                            onChange={e => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className={`w-full border-2 border-dashed rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                                            <UploadCloud size={18} className={file ? 'text-primary' : 'text-slate-500'} />
                                            <span className={`text-sm font-medium truncate ${file ? 'text-white' : 'text-slate-500'}`}>
                                                {file ? file.name : 'Select file...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUploading || !stripeAccountId}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isUploading ? 'bg-primary/50 text-black' : 'bg-primary text-black hover:bg-primary/90'}`}
                        >
                            {isUploading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            ) : (
                                <><Plus size={18} strokeWidth={3} /> Create Product</>
                            )}
                        </button>

                        {!stripeAccountId && (
                            <p className="text-center text-[10px] text-amber-500 font-bold uppercase tracking-widest opacity-70">
                                Connect Stripe first to create live products
                            </p>
                        )}
                    </form>
                </div>
            </div>

            {/* Product List */}
            {products.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-slate-800">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText size={20} className="text-slate-400" />
                        Your Products
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(p => (
                            <div key={p.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 group transition-all hover:border-[var(--primary)] hover:bg-slate-900/80">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-white/5 text-slate-300 text-xs font-bold px-2 py-1 rounded">
                                        ${Number(p.price || 0).toFixed(2)}
                                    </div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Active</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{p.title || 'Untitled product'}</h4>
                                {p.description && (
                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">{p.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-black/50 p-2 rounded-lg truncate">
                                    {p.file_name || 'No file name'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
