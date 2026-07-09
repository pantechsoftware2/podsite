// lib/youtube/extractHandleFromDescription.ts
export function extractYoutubeHandleFromDescription(
  html: string,
): string | null {
  // Match urls like https://www.youtube.com/@TheInterviewPodcast
  const regex = /https?:\/\/(?:www\.)?youtube\.com\/@([A-Za-z0-9._-]+)/i;
  const match = html.match(regex);
  if (!match) return null;
  return `@${match[1]}`; // return with @
}
