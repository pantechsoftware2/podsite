import BuildProgressClient from './progress-client';

type PageProps = {
  params: Promise<{ siteId: string }>;
};

export default async function BuildingSitePage({ params }: PageProps) {
  const { siteId } = await params;
  return <BuildProgressClient siteId={siteId} />;
}
