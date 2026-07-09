// lib/supabaseBrowser.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getRequiredSupabaseConfig } from '@/lib/config';

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getRequiredSupabaseConfig();

  return createBrowserClient(
    url,
    anonKey,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        sameSite: 'lax',
        path: '/',
      }
    }
  );
}
