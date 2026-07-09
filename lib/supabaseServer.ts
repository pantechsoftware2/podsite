// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { getRequiredSupabaseConfig, getRequiredSupabaseServiceRoleConfig } from '@/lib/config';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getRequiredSupabaseConfig();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            await Promise.all(
              cookiesToSet.map(async ({ name, value, options }) => {
                await cookieStore.set(name, value, {
                  ...options,
                  path: '/',
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                });
              })
            );
          } catch {
            // ignore
          }
        },
      },
    }
  );
}

export function createSupabaseServiceRoleClient() {
  const { url, serviceRoleKey } = getRequiredSupabaseServiceRoleConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('getCurrentUser error', error);
  }

  return data.user ?? null;
}
