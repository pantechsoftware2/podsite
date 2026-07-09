import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import Stripe from 'stripe';
import { getProductDeliveryEmailHtml, sendResend } from '@/lib/emails';
import { jsonConfigError, MissingConfigError } from '@/lib/config';

export async function POST(req: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSignature = req.headers.get('stripe-signature');

    if (!stripeSecretKey) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    if (!endpointSecret) {
        return NextResponse.json({ error: 'Stripe webhook secret is not configured' }, { status: 500 });
    }

    if (!stripeSignature) {
        return NextResponse.json({ error: 'Missing Stripe signature header' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await req.text();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, stripeSignature, endpointSecret);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid webhook payload';
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    let supabase;
    try {
        supabase = createSupabaseServiceRoleClient();
    } catch (error) {
        if (error instanceof MissingConfigError) {
            return NextResponse.json(jsonConfigError(error), { status: 503 });
        }
        throw error;
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const { data: existingEvent } = await supabase
            .from('payment_events')
            .select('id, processed_at')
            .eq('stripe_event_id', event.id)
            .maybeSingle();

        if (existingEvent?.processed_at) {
            return NextResponse.json({ received: true, duplicate: true });
        }

        const { data: paymentEvent, error: paymentEventError } = await supabase
            .from('payment_events')
            .upsert(
                {
                    stripe_event_id: event.id,
                    event_type: event.type,
                    payload: {
                        id: event.id,
                        type: event.type,
                        created: event.created,
                        livemode: event.livemode,
                        data: event.data.object,
                    },
                    processing_error: null,
                },
                { onConflict: 'stripe_event_id' },
            )
            .select('id')
            .single();

        if (paymentEventError) {
            console.error('Failed to record Stripe event:', paymentEventError);
            return NextResponse.json({ error: 'Failed to record Stripe event' }, { status: 500 });
        }

        const customerEmail = session.customer_details?.email;
        const productId = session.metadata?.productId;

        if (customerEmail && productId) {
            // 1. Get product details
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (product) {
                const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .upsert(
                        {
                            product_id: product.id,
                            podcast_id: product.podcast_id,
                            buyer_email: customerEmail,
                            amount_total: session.amount_total ?? 0,
                            currency: session.currency ?? 'usd',
                            status: session.payment_status ?? 'paid',
                            stripe_checkout_session_id: session.id,
                            stripe_payment_intent_id:
                                typeof session.payment_intent === 'string'
                                    ? session.payment_intent
                                    : session.payment_intent?.id ?? null,
                            download_url_expires_at: expiresAt.toISOString(),
                            metadata: {
                                fileName: product.file_name,
                                stripeEventId: event.id,
                            },
                        },
                        { onConflict: 'stripe_checkout_session_id' },
                    )
                    .select('id')
                    .single();

                if (orderError) {
                    await supabase
                        .from('payment_events')
                        .update({ processing_error: orderError.message })
                        .eq('id', paymentEvent.id);
                    return NextResponse.json({ error: 'Failed to record order' }, { status: 500 });
                }

                // 2. Generate signed download link (Example using Supabase)
                const { data: signedUrl } = await supabase.storage
                    .from('products')
                    .createSignedUrl(product.file_path, 60 * 60 * 24 * 7); // 7 days

                if (signedUrl) {
                    // 3. Send email to buyer
                    const emailHtml = getProductDeliveryEmailHtml(product.title, signedUrl.signedUrl);
                    await sendResend(customerEmail, `Your download is ready: ${product.title}`, emailHtml);

                    await supabase
                        .from('orders')
                        .update({ delivered_at: new Date().toISOString(), status: 'delivered' })
                        .eq('id', order.id);

                    await supabase
                        .from('payment_events')
                        .update({ order_id: order.id, processed_at: new Date().toISOString(), processing_error: null })
                        .eq('id', paymentEvent.id);

                    console.log(`✅ Product delivered to ${customerEmail}`);
                } else {
                    await supabase
                        .from('payment_events')
                        .update({ order_id: order.id, processing_error: 'Failed to create signed download URL' })
                        .eq('id', paymentEvent.id);
                }
            } else {
                await supabase
                    .from('payment_events')
                    .update({ processing_error: `Product not found: ${productId}` })
                    .eq('id', paymentEvent.id);
            }
        } else {
            await supabase
                .from('payment_events')
                .update({ processing_error: 'Missing customer email or product id' })
                .eq('id', paymentEvent.id);
        }
    }

    return NextResponse.json({ received: true });
}
