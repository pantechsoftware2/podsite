import { redirect } from 'next/navigation';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function PodcastSettingsPage({ params }: PageProps) {
    const { id: podcastId } = await params;
    redirect(`/dashboard/customize?siteId=${podcastId}`);
}
