import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PodcastPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/podcasts/${id}/episodes`);
}
