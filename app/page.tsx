// app/page.tsx
import { redirect } from 'next/navigation';
// TODO: TEMPORARY LOGIN BYPASS - keep these auth imports ready for restoring
// the root login gate when the Login page is enabled again.
// import { getPublicSupabaseConfigStatus } from '@/lib/config';
// import { createSupabaseServerClient } from '@/lib/supabaseServer';

type HomeProps = {
  searchParams: Promise<{ code?: string; next?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { code, next } = await searchParams;

  if (code) {
    const callbackParams = new URLSearchParams({
      code,
      next: next || '/dashboard',
    });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  // TODO: TEMPORARY LOGIN BYPASS - restore this auth gate when the Login page
  // is enabled again. The original logic is intentionally preserved below.
  /*
  const supabaseConfig = getPublicSupabaseConfigStatus();

  if (!supabaseConfig.ok) {
    const message = `Supabase is not configured. Missing: ${supabaseConfig.missing.join(', ')}`;
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/dashboard' : '/login');
  */

  redirect('/dashboard');
}
