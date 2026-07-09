import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    
    try {
        const { productId, podcastId, returnUrl } = await req.json();

        if (!productId || !podcastId) {
            return NextResponse.json({ error: 'Missing product details' }, { status: 400 });
        }

        // 1. Get Product and Podcast Data (Anonymous Access is fine for buyers)
        const supabase = await createSupabaseServerClient();
        
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        const { data: podcast } = await supabase
            .from('podcasts')
            .select('id, stripe_account_id')
            .eq('id', podcastId)
            .single();

        if (!product || !podcast?.stripe_account_id) {
            return NextResponse.json({ error: 'Product or Seller not configured correctly' }, { status: 400 });
        }

        // 2. We calculate application fee (e.g. 10%)
        const priceCents = Math.round(product.price * 100);
        const applicationFeeAmount = Math.round(priceCents * 0.10);

        // 3. Create Checkout Session pointing to the connected account
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.title,
                        description: product.description || 'Digital Product',
                    },
                    unit_amount: priceCents,
                },
                quantity: 1,
            }],
            payment_intent_data: {
                application_fee_amount: applicationFeeAmount,
                transfer_data: {
                    destination: podcast.stripe_account_id,
                },
            },
            metadata: {
                productId: product.id,
                podcastId: podcast.id,
                filePath: product.file_path,
                fileName: product.file_name,
            },
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Chekout Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create checkout';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
