'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { getPublicSupabaseConfigStatus, logSupabaseConfigIssues } from '@/lib/config';

const DASHBOARD = '/dashboard';
const LOCAL_APP_ORIGIN = 'http://localhost:3000';

function getAuthOrigin() {
  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_APP_ORIGIN;
  }

  const browserOrigin = window.location.origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    return browserOrigin;
  }

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    console.error(
      'NEXT_PUBLIC_APP_URL is invalid; using the current browser origin for authentication redirects.',
    );
    return browserOrigin;
  }
}

function getAuthCallbackUrl(next = DASHBOARD) {
  const callbackUrl = new URL('/auth/callback', getAuthOrigin());
  callbackUrl.searchParams.set('next', next);
  return callbackUrl.toString();
}

function logAuthRedirect(flow: string, redirectTo: string) {
  console.info('[Auth redirect]', {
    flow,
    environment: process.env.NODE_ENV,
    redirectTo,
  });
}

function LoginContent() {
  const searchParams = useSearchParams();
  const supabaseConfig = getPublicSupabaseConfigStatus();
  const googleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const errorFromUrl = searchParams.get('error');
  const displayMessage =
    message ?? (errorFromUrl ? decodeURIComponent(errorFromUrl) : null);
  const showResendVerification =
    resendSent ||
    displayMessage?.includes('check your email') ||
    displayMessage?.includes('verification link') ||
    displayMessage?.includes('confirmation link') ||
    displayMessage?.includes('Email not confirmed');

  useEffect(() => {
    if (!supabaseConfig.ok) {
      logSupabaseConfigIssues('app/login/page.tsx');
    }
  }, [supabaseConfig.ok]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!supabaseConfig.ok) {
        setMessage(`Supabase is not configured. Missing: ${supabaseConfig.missing.join(', ')}`);
        setLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (isForgotPassword) {
        const passwordResetUrl = new URL('/update-password', getAuthOrigin());
        logAuthRedirect('password-reset', passwordResetUrl.toString());
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: passwordResetUrl.toString(),
        });
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('Password reset instructions sent. Please check your email.');
          setIsForgotPassword(false);
        }
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const emailRedirectTo = getAuthCallbackUrl();
        logAuthRedirect('email-signup', emailRedirectTo);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            // Prevent auto-confirm in production (requires email verification)
            // In development, you might want to disable email confirmation in Supabase settings
          },
        });

        if (error) {
          // Handle specific signup errors
          let errorMsg = error.message;
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            errorMsg = 'An account with this email already exists. Please log in instead.';
          } else if (error.message.includes('password')) {
            errorMsg = 'Password is too weak. Please use a stronger password.';
          }
          setMessage(errorMsg);
          setLoading(false);
          return;
        }

        if (data?.session) {
          window.location.href = DASHBOARD;
          return;
        }

        setMessage('Account created. Please check your email for the confirmation link before logging in.');

        // Removed fetch('/api/emails/welcome') here. It will be sent exactly once in the callback 
        // after they click the verification link, guaranteeing true verification.
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error details:', {
          email,
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // Provide user-friendly error messages
        let errorMsg = error.message;
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid password')) {
          errorMsg = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Please check your email and click the confirmation link before logging in.';
        } else if (error.message.includes('too many requests')) {
          errorMsg = 'Too many login attempts. Please wait a few minutes and try again.';
        } else if (error.message.includes('User not found')) {
          errorMsg = 'No account found with this email. Please sign up first.';
        }
        
        setMessage(errorMsg || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        console.error('Login succeeded but no user data returned');
        setMessage('Login succeeded but session not established. Please try again.');
        setLoading(false);
        return;
      }

      // Verify session is actually set before redirecting
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.error('No session after login, retrying...');
        // Wait a bit and check again (cookie propagation delay)
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: retrySession } = await supabase.auth.getSession();
        if (!retrySession?.session) {
          setMessage('Session not established. Please try "Clear session and try again" below.');
          setLoading(false);
          return;
        }
      }

      console.log('Login successful, session verified, redirecting to dashboard');
      
      // Keep loading spinner active during page transition
      // Use window.location for a full page reload to ensure cookies are set
      window.location.href = DASHBOARD;
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'An unexpected error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    if (!supabaseConfig.ok) {
      setMessage(`Supabase is not configured. Missing: ${supabaseConfig.missing.join(', ')}`);
      setLoading(false);
      return;
    }

    if (!googleAuthEnabled) {
      setMessage('Google sign-in is not enabled for this Supabase project yet. Enable the Google provider in Supabase, add the Google OAuth Client ID and Client Secret, then set NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true and restart the dev server.');
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo = getAuthCallbackUrl();
    logAuthRedirect('google-oauth', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Google OAuth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      setMessage(error.message || 'Google login failed. Please try again.');
      setLoading(false);
    } else if (!data?.url) {
      console.error('Google OAuth: No redirect URL returned');
      setMessage('Could not start Google login. Please check your Google OAuth configuration.');
      setLoading(false);
    } else {
      console.log('Google OAuth redirect URL:', data.url);
      // OAuth redirect will happen automatically
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      {/* soft background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_#0ea5e933,_transparent_60%),radial-gradient(circle_at_bottom,_#6366f133,_transparent_55%)]" />

      <div className="relative w-full max-w-md">
        {/* top logo + subtitle */}
        <div className="mb-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            PodSite-Killer
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-50">
            {isForgotPassword 
              ? 'Reset your password' 
              : isSignUp ? 'Create your studio account' : 'Sign in to your studio'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Import RSS, sync episodes, and manage YouTube from one dashboard.
          </p>
        </div>

        {/* card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/85 px-6 py-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <form onSubmit={onSubmit} className="space-y-4">
            {!supabaseConfig.ok && (
              <div className="rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-200">
                Supabase is not configured. Replace {supabaseConfig.missing.join(', ')} in .env.local, then restart the dev server.
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      // eye
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path
                          fillRule="evenodd"
                          d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      // eye-off
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                        <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                        <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.702 7.69 10.677 7.69.612 0 1.209-.046 1.793-.135l-3.563-3.563A5.25 5.25 0 016.75 12z" />
                      </svg>
                    )}
                  </button>
                </div>
                {!isSignUp && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {displayMessage && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${displayMessage.includes('Account created')
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
                }`}>
                {displayMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading
                ? isForgotPassword 
                  ? 'Sending...'
                  : isSignUp
                    ? 'Creating account…'
                    : 'Signing in…'
                : isForgotPassword
                  ? 'Send Reset Link'
                  : isSignUp
                    ? 'Sign up'
                    : 'Login'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-800" aria-hidden />
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              or
            </span>
            <span className="h-px flex-1 bg-slate-800" aria-hidden />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <span className="h-4 w-4 rounded-[4px] bg-gradient-to-br from-sky-400 via-emerald-400 to-amber-400" />
            </span>
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm text-slate-400">
            {isForgotPassword ? (
              <>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="font-medium text-sky-400 hover:underline"
                >
                  Log in
                </button>
              </>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-medium text-sky-400 hover:underline"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-medium text-sky-400 hover:underline"
                >
                  Sign up
                </button>{' '}
                with email, or use Google above.
              </>
            )}
          </p>

          {showResendVerification && email && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Didn&apos;t get the email?{' '}
              <button
                type="button"
                disabled={resendLoading}
                onClick={async () => {
                  setResendLoading(true);
                  try {
                    const res = await fetch('/api/auth/resend-confirmation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setResendSent(true);
                      setMessage(data.message || 'Verification email sent. Check your inbox and spam.');
                    } else {
                      setMessage(data.error || 'Failed to resend.');
                    }
                  } catch {
                    setMessage('Failed to resend verification email.');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                className="text-sky-400 hover:underline disabled:opacity-50"
              >
                {resendLoading ? 'Sending…' : 'Resend verification email'}
              </button>
            </p>
          )}

          <p className="mt-2 text-center text-xs text-slate-500">
            <Link href="/" className="text-sky-400 hover:underline">
              ← Back to home
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-500">
            Having trouble signing in?{' '}
            <button
              type="button"
              onClick={async () => {
                if (supabaseConfig.ok) {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                }
                window.location.href = '/login';
              }}
              className="text-sky-400 hover:underline"
            >
              Clear session and try again
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
