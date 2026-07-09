# Deployment Readiness

This is the minimum setup needed before sharing the app with real users.

## Required services

- Supabase project
- Vercel project
- OpenRouter key for import-time site blueprints
- OpenRouter image-capable model for AI thumbnail generation
- Deepgram key for import-time audio transcription
- Stripe test or live account for products
- Resend account for transactional email

## Supabase setup

1. Create a Supabase project.
2. Run the SQL migrations in `supabase/migrations` in filename order.
3. Confirm these tables exist:
   - `podcasts`
   - `episodes`
   - `products`
   - `shorts`
   - `episode_launch_assets`
   - `episode_thumbnail_generations`
4. Confirm the private Storage bucket `products` exists.
5. Confirm the public Storage bucket `episode-thumbnails` exists.
6. In Supabase Auth settings, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://podsite-killer.vercel.app/auth/callback`
   - your final production domain callback URL when added

## Vercel environment variables

Required for the app to boot:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Required for AI import blueprints:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_SITE_URL`

Required for AI thumbnail generation through OpenRouter:

- `OPENROUTER_IMAGE_MODEL=google/gemini-3.1-flash-image`

Required for audio transcription through Deepgram:

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_MODEL=nova-3`
- `DEEPGRAM_IMPORT_TRANSCRIPTION_LIMIT=10`

Required for product checkout:

- `ENABLE_PRODUCTS=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Required for delivery emails:

- `RESEND_API_KEY`
- `RESEND_FROM`

Optional feature flags:

- `ENABLE_CUSTOM_DOMAINS=true`
- `ENABLE_VIDEO_SYNC=true`
- `ENABLE_DEMO_SEED=true`

## Stripe setup

Create a webhook endpoint in Stripe:

- URL: `https://podsite-killer.vercel.app/api/stripe/webhook`
- Event: `checkout.session.completed`

Set the signing secret as `STRIPE_WEBHOOK_SECRET`.

## Smoke test checklist

Run these before telling friends/family or investors to try it:

1. Build passes with `npm run build`.
2. A new user can sign up and log in.
3. A user can import an RSS feed.
4. The import creates a podcast and episode records.
5. The public homepage renders.
6. `/episodes`, `/about`, `/topics`, `/guests`, generated pages, `sitemap.xml`, and `robots.txt` render.
7. Product upload succeeds into the private `products` bucket.
8. Episode Launch Studio generates a launch kit from `/podcasts/[id]/episodes`.
9. Thumbnail generation stores an image in the public `episode-thumbnails` bucket.
10. Stripe Connect onboarding opens from `/dashboard/products`.
11. Checkout completes with Stripe test card `4242 4242 4242 4242`.
12. Stripe webhook delivery succeeds.
13. Resend sends the product delivery email.
