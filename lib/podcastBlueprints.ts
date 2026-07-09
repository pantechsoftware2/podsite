import type { WebsiteSignals } from '@/lib/ai/siteSignals';
import { slugify } from '@/lib/utils/slugify';

export type PodcastBlueprintArchetype =
  | 'founder-led'
  | 'interview-led'
  | 'teaching-led'
  | 'creator-brand'
  | 'narrative-series'
  | 'news-analysis';

export type GeneratedPageSection = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type GeneratedPageBlueprint = {
  slug: string;
  title: string;
  navLabel: string;
  intent: string;
  seoTitle: string;
  seoDescription: string;
  sections: GeneratedPageSection[];
};

export type PodcastSiteBlueprint = {
  archetype: PodcastBlueprintArchetype;
  generatedPages: GeneratedPageBlueprint[];
  navItems: string[];
  sections: string[];
  discoveryAngles: string[];
};

type EpisodeSample = {
  title: string;
  description?: string | null;
};

const RESERVED_SLUGS = new Set([
  'about',
  'episodes',
  'guests',
  'topics',
  'sitemap.xml',
  'robots.txt',
]);

const ARCHETYPE_KEYWORDS: Record<PodcastBlueprintArchetype, string[]> = {
  'founder-led': ['founder', 'startup', 'operator', 'business', 'company', 'career', 'build', 'entrepreneur', 'investor'],
  'interview-led': ['interview', 'guest', 'conversation', 'with', 'featuring', 'leaders', 'stories'],
  'teaching-led': ['learn', 'lesson', 'guide', 'training', 'course', 'workshop', 'how to', 'tips', 'tutorial'],
  'creator-brand': ['creator', 'community', 'newsletter', 'solo', 'brand', 'coach', 'audience'],
  'narrative-series': ['story', 'season', 'chapter', 'documentary', 'true', 'series', 'journey'],
  'news-analysis': ['news', 'analysis', 'weekly', 'market', 'briefing', 'policy', 'daily', 'report'],
};

const DEFAULT_NAV = ['Start Here', 'Episodes', 'Topics', 'Guests', 'About'];

function normalize(input: string | null | undefined) {
  return (input || '').toLowerCase();
}

function scoreArchetype(haystack: string, archetype: PodcastBlueprintArchetype) {
  return ARCHETYPE_KEYWORDS[archetype].reduce((score, keyword) => {
    return haystack.includes(keyword) ? score + 1 : score;
  }, 0);
}

function chooseArchetype(input: {
  title: string;
  description: string;
  episodeSamples: EpisodeSample[];
  websiteSignals?: WebsiteSignals | null;
}): PodcastBlueprintArchetype {
  const haystack = normalize([
    input.title,
    input.description,
    ...input.episodeSamples.flatMap((episode) => [episode.title, episode.description || '']),
    ...(input.websiteSignals?.navItems || []),
    ...(input.websiteSignals?.sectionHeadings || []),
  ].join(' '));

  const ranked = (Object.keys(ARCHETYPE_KEYWORDS) as PodcastBlueprintArchetype[])
    .map((archetype) => ({ archetype, score: scoreArchetype(haystack, archetype) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score ? ranked[0].archetype : 'interview-led';
}

function uniqueNav(items: string[]) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, 7);
}

function page(input: {
  slug: string;
  title: string;
  navLabel: string;
  intent: string;
  seoTitle: string;
  seoDescription: string;
  sections: GeneratedPageSection[];
}): GeneratedPageBlueprint {
  const safeSlug = slugify(input.slug);
  return {
    ...input,
    slug: RESERVED_SLUGS.has(safeSlug) ? `${safeSlug}-page` : safeSlug,
  };
}

function basePages(showTitle: string, description: string): GeneratedPageBlueprint[] {
  return [
    page({
      slug: 'start-here',
      title: `Start Here With ${showTitle}`,
      navLabel: 'Start Here',
      intent: 'Help new listeners understand the promise of the show and find the best first episodes.',
      seoTitle: `Start Here | ${showTitle}`,
      seoDescription: `New to ${showTitle}? Start with the essential episodes, topics, and listening links.`,
      sections: [
        {
          title: 'What This Show Is About',
          body: description || `${showTitle} helps listeners find the conversations, ideas, and stories worth coming back to.`,
        },
        {
          title: 'Best Ways To Explore',
          body: 'Browse by topic, meet recurring guests, or jump into the latest episode archive.',
          ctaLabel: 'Browse Episodes',
          ctaHref: '/episodes',
        },
      ],
    }),
  ];
}

function archetypePages(archetype: PodcastBlueprintArchetype, showTitle: string): GeneratedPageBlueprint[] {
  if (archetype === 'founder-led') {
    return [
      page({
        slug: 'playbooks',
        title: `${showTitle} Playbooks`,
        navLabel: 'Playbooks',
        intent: 'Turn recurring advice into evergreen tactical pages for founders, operators, and ambitious listeners.',
        seoTitle: `Founder Playbooks | ${showTitle}`,
        seoDescription: `Practical lessons and operating ideas from ${showTitle}.`,
        sections: [
          {
            title: 'Operating Lessons',
            body: 'A curated path through the highest-leverage ideas from the show, grouped around building, careers, decisions, and growth.',
          },
          {
            title: 'Episodes To Start With',
            body: 'Use the archive and topic pages to find episodes that map to the problem you are solving right now.',
            ctaLabel: 'Explore Topics',
            ctaHref: '/topics',
          },
        ],
      }),
      page({
        slug: 'sponsors',
        title: `Sponsor ${showTitle}`,
        navLabel: 'Sponsors',
        intent: 'Give potential partners a conversion-focused page instead of forcing them to infer fit from episode pages.',
        seoTitle: `Sponsor ${showTitle}`,
        seoDescription: `Partner with ${showTitle} to reach an engaged podcast audience.`,
        sections: [
          {
            title: 'Audience Fit',
            body: `${showTitle} reaches listeners who care about sharp ideas, useful stories, and trusted recommendations.`,
          },
          {
            title: 'Partnership Options',
            body: 'Use this page for sponsor packages, newsletter placements, custom segments, and product collaborations.',
          },
        ],
      }),
    ];
  }

  if (archetype === 'teaching-led') {
    return [
      page({
        slug: 'resources',
        title: `${showTitle} Resources`,
        navLabel: 'Resources',
        intent: 'Collect guides, learning paths, downloads, and evergreen recommendations in one searchable hub.',
        seoTitle: `Resources | ${showTitle}`,
        seoDescription: `Guides, episode paths, and useful resources from ${showTitle}.`,
        sections: [
          {
            title: 'Learning Paths',
            body: 'Turn episodes into a structured path so listeners can learn the subject without guessing where to begin.',
          },
          {
            title: 'Recommended Episodes',
            body: 'Use topic pages to build clusters around repeat questions and high-intent searches.',
            ctaLabel: 'Browse Topics',
            ctaHref: '/topics',
          },
        ],
      }),
    ];
  }

  if (archetype === 'creator-brand') {
    return [
      page({
        slug: 'newsletter',
        title: `${showTitle} Newsletter`,
        navLabel: 'Newsletter',
        intent: 'Convert casual listeners into owned audience members.',
        seoTitle: `Newsletter | ${showTitle}`,
        seoDescription: `Get updates, episode notes, and curated ideas from ${showTitle}.`,
        sections: [
          {
            title: 'Stay Close To The Show',
            body: 'Use this page for newsletter signup, bonus notes, behind-the-scenes updates, and launch announcements.',
          },
          {
            title: 'Why Subscribe',
            body: 'Give listeners a reason to come back between episode releases.',
          },
        ],
      }),
    ];
  }

  if (archetype === 'narrative-series') {
    return [
      page({
        slug: 'seasons',
        title: `${showTitle} Seasons`,
        navLabel: 'Seasons',
        intent: 'Make serialized audio easier to follow from the beginning.',
        seoTitle: `Seasons | ${showTitle}`,
        seoDescription: `Explore the story arcs, seasons, and essential episodes from ${showTitle}.`,
        sections: [
          {
            title: 'Follow The Story',
            body: 'Organize the archive around seasons, characters, timelines, and turning points.',
          },
          {
            title: 'Start From The Beginning',
            body: 'Create guided entry points for listeners who discover the show mid-series.',
            ctaLabel: 'Browse Episodes',
            ctaHref: '/episodes',
          },
        ],
      }),
    ];
  }

  if (archetype === 'news-analysis') {
    return [
      page({
        slug: 'briefings',
        title: `${showTitle} Briefings`,
        navLabel: 'Briefings',
        intent: 'Turn recurring news analysis into searchable evergreen explainers and issue hubs.',
        seoTitle: `Briefings | ${showTitle}`,
        seoDescription: `Briefings, explainers, and analysis from ${showTitle}.`,
        sections: [
          {
            title: 'Latest Analysis',
            body: 'Use this page to collect recurring topics, market explainers, policy threads, and timely episode clusters.',
          },
          {
            title: 'Browse By Issue',
            body: 'Topic pages give new listeners a durable way into the archive after the news cycle moves on.',
            ctaLabel: 'Explore Topics',
            ctaHref: '/topics',
          },
        ],
      }),
    ];
  }

  return [
    page({
      slug: 'guests',
      title: `${showTitle} Guest Guide`,
      navLabel: 'Guests',
      intent: 'Make guest-driven discovery obvious for searchers and listeners.',
      seoTitle: `Guests | ${showTitle}`,
      seoDescription: `Meet the guests and conversations featured on ${showTitle}.`,
      sections: [
        {
          title: 'Featured Conversations',
          body: 'Guest pages help people discover episodes through the people, companies, and communities they already care about.',
          ctaLabel: 'Browse Guests',
          ctaHref: '/guests',
        },
      ],
    }),
  ];
}

export function buildPodcastSiteBlueprint(input: {
  title: string;
  description: string;
  episodeSamples: EpisodeSample[];
  websiteSignals?: WebsiteSignals | null;
}): PodcastSiteBlueprint {
  const showTitle = input.title || 'The Show';
  const archetype = chooseArchetype(input);
  const referenceNav = uniqueNav(input.websiteSignals?.navItems || []);
  const navItems = uniqueNav([
    ...referenceNav,
    ...DEFAULT_NAV,
    ...(archetype === 'founder-led' ? ['Playbooks', 'Sponsors'] : []),
    ...(archetype === 'teaching-led' ? ['Resources'] : []),
    ...(archetype === 'creator-brand' ? ['Newsletter'] : []),
    ...(archetype === 'narrative-series' ? ['Seasons'] : []),
    ...(archetype === 'news-analysis' ? ['Briefings'] : []),
  ]);

  const generatedPages = [
    ...basePages(showTitle, input.description),
    ...archetypePages(archetype, showTitle),
  ];

  return {
    archetype,
    generatedPages,
    navItems,
    sections: uniqueNav([
      'Start here',
      'Latest episodes',
      'Browse by topic',
      'Guest directory',
      ...generatedPages.map((generatedPage) => generatedPage.title),
    ]),
    discoveryAngles: [
      'Episode pages with canonical URLs and PodcastEpisode schema',
      'Transcript pages that turn audio into indexable text',
      'Guest and topic hubs for long-tail discovery',
      'Conversion pages for sponsors, newsletters, resources, or playbooks',
    ],
  };
}

export function sanitizeGeneratedPages(input: unknown): GeneratedPageBlueprint[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Partial<GeneratedPageBlueprint> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const slug = slugify(String(item.slug || item.navLabel || item.title || 'page'));
      const rawSections: unknown[] = Array.isArray(item.sections) ? item.sections : [];
      const safeSections = rawSections
        .filter((section): section is Record<string, unknown> => Boolean(section && typeof section === 'object'))
        .map((section) => ({
          title: String(section.title || 'Section').slice(0, 90),
          body: String(section.body || '').slice(0, 900),
          ctaLabel: section.ctaLabel ? String(section.ctaLabel).slice(0, 60) : undefined,
          ctaHref: section.ctaHref ? String(section.ctaHref).slice(0, 120) : undefined,
        }))
        .filter((section) => section.body)
        .slice(0, 5);

      return {
        slug: RESERVED_SLUGS.has(slug) ? `${slug}-page` : slug,
        title: String(item.title || item.navLabel || 'Custom Page').slice(0, 90),
        navLabel: String(item.navLabel || item.title || 'Page').slice(0, 32),
        intent: String(item.intent || '').slice(0, 240),
        seoTitle: String(item.seoTitle || item.title || item.navLabel || 'Podcast Page').slice(0, 80),
        seoDescription: String(item.seoDescription || item.intent || '').slice(0, 180),
        sections: safeSections,
      };
    })
    .filter((item) => item.slug && item.title && item.sections.length > 0)
    .slice(0, 6);
}
