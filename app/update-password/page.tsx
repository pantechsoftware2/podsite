'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { getPublicSupabaseConfigStatus } from '@/lib/config';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabaseConfig = getPublicSupabaseConfigStatus();
  const missingSupabaseKeys = supabaseConfig.missing.join(', ');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // We only want users to see this page if they arrived via an auth callback (so they have a session)
  useEffect(() => {
    if (!supabaseConfig.ok) {
      setMessage(`Supabase is not configured. Missing: ${missingSupabaseKeys}`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const establishRecoverySession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
        window.history.replaceState(null, '', url.pathname);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        window.history.replaceState(null, '', url.pathname);
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
      }
    };

    void establishRecoverySession();
  }, [router, supabaseConfig.ok, missingSupabaseKeys]);

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!supabaseConfig.ok) {
        throw new Error(`Supabase is not configured. Missing: ${missingSupabaseKeys}`);
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      setMessage('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_#0ea5e933,_transparent_60%),radial-gradient(circle_at_bottom,_#6366f133,_transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="mt-4 text-2xl font-semibold text-slate-50">
            Create new password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Please enter your new password below.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/85 px-6 py-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <form onSubmit={onUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${message.includes('successfully') ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
