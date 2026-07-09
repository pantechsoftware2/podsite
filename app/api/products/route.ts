import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, description, price, podcastId, filePath, fileName } = await req.json();

        if (!title || !price || !podcastId || !filePath || !fileName) {
            return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
        }

        if (Number(price) <= 0) {
            return NextResponse.json({ error: 'Price must be greater than zero' }, { status: 400 });
        }

        // 1. Verify podcast ownership & Get Stripe Account
        const { data: podcast } = await supabase
            .from('podcasts')
            .select('id, stripe_account_id')
            .eq('id', podcastId)
            .eq('owner_id', user.id)
            .single();

        if (!podcast) {
            return NextResponse.json({ error: 'Podcast not found or not owned by user' }, { status: 400 });
        }

        if (!podcast.stripe_account_id) {
            return NextResponse.json(
                { error: 'Connect your Stripe account before creating products' },
                { status: 400 }
            );
        }

        // 2. Create Stripe Product (On the connected account)
        const stripeProduct = await stripe.products.create({
            name: title,
            description: description,
            shippable: false,
        }, {
            stripeAccount: podcast.stripe_account_id,
        });

        // 3. Create Stripe Price
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(Number(price) * 100),
            currency: 'usd',
        }, {
            stripeAccount: podcast.stripe_account_id,
        });

        // 4. Save to DB
        const { data: product, error: dbError } = await supabase
            .from('products')
            .insert({
                podcast_id: podcastId,
                title,
                description,
                price: parseFloat(price),
                file_path: filePath,
                file_name: fileName,
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id,
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, product });
    } catch (error: unknown) {
        console.error('Product creation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create product';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
