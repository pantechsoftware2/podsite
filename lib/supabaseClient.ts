// lib/supabaseClient.ts
'use client';

import { createClient } from '@supabase/supabase-js';
import { getRequiredSupabaseConfig } from '@/lib/config';

const { url, anonKey } = getRequiredSupabaseConfig();

export const supabaseBrowser = createClient(
  url,
  anonKey,
);
