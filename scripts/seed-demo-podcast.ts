/**
 * Seed Script: Create a demo podcast with episodes
 * Run with: npx tsx scripts/seed-demo-podcast.ts
 * 
 * This creates a sample podcast with ID fe816460-cbe9-49eb-949e-b943e0086328
 * so the 404 error is fixed.
 */

import { createClient } from '@supabase/supabase-js';
import { slugify } from '../lib/utils/slugify';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_PODCAST_ID = 'fe816460-cbe9-49eb-949e-b943e0086328';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'; // Demo user

const demoPodcast = {
  id: DEMO_PODCAST_ID,
  owner_id: DEMO_USER_ID,
  title: 'The Tech Explorer',
  description: 'Exploring the latest in technology, startups, and innovation. Join us on a journey through the digital frontier.',
  rss_url: 'https://anchor.fm/s/abc123/podcast/rss',
  primary_color: '#6366f1',
  accent_color: '#8b5cf6',
  youtube_channel_id: null,
  theme_config: {
    primaryColor: '#6366f1',
    backgroundColor: '#0f172a',
    foregroundColor: '#f8fafc',
    accentColor: '#8b5cf6',
    borderColor: '#334155',
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    cornerRadius: '8px',
    layout: 'netflix',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=800&fit=crop',
  },
  page_layout: ['hero', 'shorts', 'subscribe', 'grid', 'host'],
  custom_domain: null,
  stripe_account_id: null,
};

const demoEpisodes = [
  {
    title: 'The Future of AI: What to Expect in 2025',
    description: '<p>In this episode, we explore the rapidly evolving landscape of artificial intelligence and what the future holds for AI technology.</p><p>We discuss:</p><ul><li>Large Language Models</li><li>Multimodal AI</li><li>AI in healthcare</li><li>Ethics and regulation</li></ul>',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=800&fit=crop',
    duration_seconds: 1800,
    published_at: '2025-01-15T10:00:00Z',
  },
  {
    title: 'Building a Startup: From Zero to Hero',
    description: '<p>Learn the ins and outs of building a successful startup from scratch. We share real stories from founders who made it big.</p>',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=800&fit=crop',
    duration_seconds: 2400,
    published_at: '2025-01-08T10:00:00Z',
  },
  {
    title: 'The Rise of Remote Work Culture',
    description: '<p>How has remote work changed the way we work? We dive deep into the trends shaping the future of work.</p>',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=800&fit=crop',
    duration_seconds: 1500,
    published_at: '2025-01-01T10:00:00Z',
  },
  {
    title: 'Cryptocurrency and Blockchain Explained',
    description: '<p>A beginner-friendly guide to understanding cryptocurrency and blockchain technology.</p>',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=800&fit=crop',
    duration_seconds: 2100,
    published_at: '2024-12-25T10:00:00Z',
  },
  {
    title: 'Sustainable Tech: Green Innovation',
    description: '<p>How technology is helping us build a more sustainable future. From electric vehicles to renewable energy.</p>',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=800&fit=crop',
    duration_seconds: 1950,
    published_at: '2024-12-18T10:00:00Z',
  },
];

async function seed() {
  console.log('🌱 Seeding demo podcast...\n');

  // 1. Create the podcast
  console.log('Creating podcast:', demoPodcast.title);
  
  // Check if podcast already exists
  const { data: existing } = await supabase
    .from('podcasts')
    .select('id')
    .eq('id', DEMO_PODCAST_ID)
    .maybeSingle();

  if (existing) {
    console.log('Podcast already exists, deleting and recreating...');
    await supabase.from('podcasts').delete().eq('id', DEMO_PODCAST_ID);
  }

  const { error: podcastError } = await supabase
    .from('podcasts')
    .insert(demoPodcast);

  if (podcastError) {
    console.error('Error creating podcast:', podcastError);
    process.exit(1);
  }
  console.log('✅ Podcast created with ID:', DEMO_PODCAST_ID);

  // 2. Create episodes
  console.log('\nCreating episodes...');
  
  // Delete existing episodes for this podcast
  await supabase.from('episodes').delete().eq('podcast_id', DEMO_PODCAST_ID);

  for (let i = 0; i < demoEpisodes.length; i++) {
    const ep = demoEpisodes[i];
    const guid = `demo-episode-${i + 1}`;
    const slug = slugify(ep.title);

    const { error: episodeError } = await supabase.from('episodes').insert({
      podcast_id: DEMO_PODCAST_ID,
      guid,
      slug,
      title: ep.title,
      description: ep.description,
      audio_url: ep.audio_url,
      image_url: ep.image_url,
      duration_seconds: ep.duration_seconds,
      published_at: ep.published_at,
    });

    if (episodeError) {
      console.error(`Error creating episode ${i + 1}:`, episodeError);
    } else {
      console.log(`✅ Episode ${i + 1}: ${ep.title}`);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n📱 View the demo site at:');
  console.log(`   http://localhost:3000/${DEMO_PODCAST_ID}`);
  console.log(`   http://localhost:3000/${DEMO_PODCAST_ID}/episodes`);
  console.log('\n🛠️  Manage in dashboard:');
  console.log(`   http://localhost:3000/dashboard`);
}

seed().catch(console.error);

