# PodSite Killer Investor Product Blueprint

## Product thesis

New podcasters do not only need a website. They need a discovery operating system that turns every episode into search, social, YouTube, newsletter, guest, topic, and monetization assets without forcing them to become marketers.

The wedge is simple:

- RSS import builds the first site.
- Brand intelligence makes it feel like the creator, not a generic template.
- SEO intelligence turns the archive into durable discovery pages.
- Creative intelligence turns each episode into thumbnails, titles, descriptions, clips, and platform-specific promotion.
- Commerce and lead capture turn attention into business outcomes.

## Competitor pain points to solve

1. RSS-to-site tools are fast, but the site architecture is usually shallow.

Podpage and Transistor both emphasize creating a podcast website quickly from an existing feed. That is useful, but speed alone creates sameness. The opportunity is to create a site that understands what kind of show it is and builds the right pages automatically.

2. Customization often stops at templates, colors, logos, and basic pages.

Podcasters outgrow "choose a theme and tweak colors" when they need sponsor pages, resource hubs, guest pages, newsletter pages, consulting/coaching funnels, media kits, video pages, and show-specific navigation.

3. SEO is underused because audio archives are structurally thin.

The winning default is not only title tags. Every imported show should get canonical URLs, structured data, transcript pages, guest hubs, topic hubs, internal links, and sitemaps. Transcripts are especially important because they turn spoken ideas into indexable text.

4. Discovery work is fragmented across too many tools.

A serious podcaster has to write titles, show notes, YouTube titles, thumbnails, descriptions, tags, clips, social posts, and landing pages. The product should make those outputs feel like one episode launch workflow.

5. Websites rarely connect listening intent to platform handoff.

The web player should make it easy to continue on Spotify, Apple, YouTube, or RSS. A website visit should not be a dead end; it should pass listeners to the platform where they will actually subscribe.

## Product pillars

### 1. Brand Blueprint

At import time, the app analyzes RSS metadata, artwork, reference websites, screenshots, social links, and episode samples. It chooses a podcast archetype and generates:

- theme tokens
- layout order
- navigation
- durable generated pages
- topic/guest strategy
- copy direction
- social/listening links

### 2. SEO Discovery Engine

Every show gets an automatic indexable architecture:

- homepage
- episode archive
- individual episode pages
- transcript pages
- guest directory and guest pages
- topic directory and topic pages
- generated archetype pages such as Start Here, Playbooks, Resources, Newsletter, Sponsors, Seasons, or Briefings
- XML sitemap with `lastmod`
- canonical URLs
- JSON-LD for `PodcastSeries`, `PodcastEpisode`, `CollectionPage`, `WebPage`, and commerce pages

### 3. Episode Launch Studio

Each new episode should generate an editable launch package:

- SEO title and meta description
- show notes
- transcript summary
- topic tags
- guest profile extraction
- YouTube title ideas
- thumbnail concepts and generated thumbnails
- Spotify/Apple/YouTube description variants
- social post variants
- newsletter blurb
- internal links to related episodes

### 4. Listener Handoff

The audio player should support platform handoff:

- Continue on Spotify
- Open in Apple Podcasts
- Watch on YouTube
- Copy RSS
- Subscribe modal
- sticky player with related episode links

### 5. Monetization and Conversion

Podcasters need clear business pages, not only episode pages:

- sponsors/media kit
- digital products
- newsletter
- coaching/consulting/contact
- lead magnets
- gated bonus feeds later

## Current technical state

Already present:

- Supabase auth and data model usage
- RSS import
- OpenRouter-backed site blueprint generation
- dashboard customization
- public podcast site rendering
- SEO pages for episodes, transcripts, guests, topics, about
- sitemap and robots routes
- Stripe Connect and checkout wiring

New foundation added:

- deterministic podcast archetype classifier
- generated page blueprints for common show types
- import-time fallback generated pages when AI is unavailable
- generated page storage in `theme_config`
- public dynamic route for generated pages
- sitemap inclusion for generated pages
- generated pages added to public navigation

## Next build sequence

### Phase 1: Deployment readiness

- Add Supabase migrations and storage setup scripts.
- Remove demo fallbacks from public routes.
- Finish production env setup and deployment checks.
- Add minimal smoke tests for import, public render, sitemap, and checkout.

### Phase 2: SEO moat

- Add transcript storage fields and ingestion.
- Generate guest and topic records instead of deriving only at request time.
- Add related episodes, internal links, and search-intent summaries.
- Add Search Console submission guidance and per-site SEO health checks.

### Phase 3: World-class customization

- Make generated pages editable in the dashboard.
- Add full-page block controls and site navigation controls.
- Add brand kit upload and reference-site comparison.
- Add preview presets for creator, business, education, narrative, and video-first shows.

### Phase 4: Episode Launch Studio

- Add per-episode AI launch assets.
- Add YouTube thumbnail concept generation.
- Add GPT-image thumbnail generation once the image model integration is approved.
- Add title/description/tag brainstorming.
- Add platform-specific copy exports.

### Phase 5: Growth loops

- Public example gallery.
- Podpage/Transistor/Beamly comparison pages.
- Podcast host migration pages.
- Built-in referral and showcase mechanics.
- Founder-led teardown content using real imported podcast sites.

## Cost estimates per episode

Rough per-episode AI cost assuming a 45-minute podcast and one reusable launch-kit generation:

| Service | Cost |
|---|---:|
| Deepgram transcription, 45-minute batch | ~$0.19 |
| GLM 5.2 launch kit: timestamps, platform descriptions, and SEO tags | ~$0.03 |
| Thumbnail generation | ~$0.04 |
| **Total per episode** | **~$0.26** |

At 100 episodes per month across all beta users, this is about $26 per month in AI costs. The product flow should keep this manageable by generating one episode launch kit and reusing it for timestamps, YouTube copy, Spotify copy, SEO tags, and thumbnail prompts instead of calling the text model once per field.

## Investor-ready narrative

PodSite Killer is not another podcast website builder. It is an AI discovery layer for podcasters.

The first product creates a branded, SEO-ready website from RSS. The deeper product turns every episode into a searchable, shareable, monetizable content system across web, Spotify, YouTube, Apple, email, and social.
