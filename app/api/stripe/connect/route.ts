import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!stripeSecretKey || !appUrl) {
        return NextResponse.json({ error: 'Stripe is not fully configured' }, { status: 500 });
    }

    const requestOrigin = req.headers.get('origin') || appUrl;

    const stripe = new Stripe(stripeSecretKey);
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { podcastId } = await req.json();

        // 1. Get podcast
        const { data: podcast } = await supabase
            .from('podcasts')
            .select('*')
            .eq('id', podcastId)
            .eq('owner_id', user.id)
            .single();

        if (!podcast) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        let accountId = podcast.stripe_account_id;

        // 2. Create account if not exists
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    podcast_id: podcastId,
                    owner_id: user.id
                }
            });
            accountId = account.id;

            // Save to DB
            await supabase
                .from('podcasts')
                .update({ stripe_account_id: accountId })
                .eq('id', podcastId);
        }

        const account = await stripe.accounts.retrieve(accountId);

        // Once onboarding is complete, send creators to their Stripe Express dashboard.
        if (!account.deleted && account.details_submitted) {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            return NextResponse.json({ url: loginLink.url, mode: 'dashboard' });
        }

        // Otherwise continue onboarding.
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${requestOrigin}/dashboard/products`,
            return_url: `${requestOrigin}/dashboard/products`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url, mode: 'onboarding' });
    } catch (error: unknown) {
        console.error('Stripe Connect error:', error);
        const message = error instanceof Error ? error.message : 'Failed to connect Stripe';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
