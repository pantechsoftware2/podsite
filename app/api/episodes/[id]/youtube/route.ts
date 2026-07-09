// app/api/episodes/[id]/youtube/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const contentType = req.headers.get('content-type') ?? '';
  let youtubeVideoId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null) as
      | { youtubeVideoId?: string }
      | null;
    youtubeVideoId = body?.youtubeVideoId ?? null;
  } else {
    const formData = await req.formData();
    youtubeVideoId = (formData.get('youtubeVideoId') as string) || null;
  }

  if (!youtubeVideoId) {
    return NextResponse.json(
      { error: 'youtubeVideoId required' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('episodes')
    .update({ youtube_video_id: youtubeVideoId })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If called from an HTML form (dashboard), redirect back
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect('/dashboard', 303);
  }

  return NextResponse.json({ ok: true });
}
