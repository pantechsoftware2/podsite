import { fuzzyMatchEpisodesToVideos } from './lib/youtube/fuzzyMatcher';

const mockEpisodes = [
    { id: '1', title: 'The Future of AI', published_at: '2026-03-01T10:00:00Z' },
    { id: '2', title: 'Cooking with Gordon', published_at: '2026-03-02T10:00:00Z' }
];

const mockVideos = [
    { id: 'v1', title: 'The Future of Artificial Intelligence 🔥', publishedAt: '2026-03-01T14:00:00Z' },
    { id: 'v2', title: 'Gordon Ramsay Cooking Session', publishedAt: '2026-03-02T11:00:00Z' }
];

const matches = fuzzyMatchEpisodesToVideos(mockEpisodes, mockVideos);

console.log('--- Matching Results ---');
console.log(JSON.stringify(matches, null, 2));

if (matches.length === 2) {
    console.log('✅ Success: Both episodes matched correctly!');
} else {
    console.log('❌ Failure: Expected 2 matches, found ' + matches.length);
}
