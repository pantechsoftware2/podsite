import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getRequiredSupabaseConfig, jsonConfigError, MissingConfigError } from '@/lib/config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next');
  const next =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const successResponse = NextResponse.redirect(new URL(next, url.origin));
  let supabaseConfig;

  try {
    supabaseConfig = getRequiredSupabaseConfig();
  } catch (error) {
    const payload = jsonConfigError(error);
    const message = error instanceof MissingConfigError ? payload.error : 'Supabase is not configured.';
    return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(message)}`);
  }

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth Callback - Exchange failed:', {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    
    // Handle specific error cases
    let errorMsg = error.message;
    if (error.message.includes('invalid_grant') || error.message.includes('code')) {
      errorMsg = 'Authentication code expired or invalid. Please try logging in again.';
    } else if (error.message.includes('provider')) {
      errorMsg = 'Authentication provider error. Please try again or use email/password.';
    }
    
    return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  // Verify we got a user and session
  if (!data?.user || !data?.session) {
    console.error('Auth Callback - No user or session after exchange');
    return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent('Session not established. Please try again.')}`);
  }

  console.log('Auth Callback - Success:', {
    userId: data.user.id,
    email: data.user.email,
    hasSession: !!data.session,
  });

  // Send welcome email EXACTLY ONCE upon first verified login
  if (data.user.email && !data.user.user_metadata?.welcome_email_sent) {
    console.log('Auth Callback - First time verification/login! Sending Welcome Email to:', data.user.email);
    
    try {
      if (process.env.RESEND_API_KEY) {
        const { getWelcomeEmailHtml, sendResend } = await import('@/lib/emails');
        console.log('Sending welcome email to:', data.user.email);
        const emailResult = await sendResend(
          data.user.email,
          'Welcome to PodSite! 🚀',
          getWelcomeEmailHtml()
        );

        if (emailResult.ok) {
          console.log('Welcome email sent successfully');
          const { error: updateError } = await supabase.auth.updateUser({
            data: { welcome_email_sent: true }
          });
          if (updateError) console.error('Error updating welcome_email_sent flag:', updateError);
          else console.log('Auth Callback - Welcome Email status saved to metadata.');
        } else {
          console.error('Failed to send welcome email:', emailResult.error);
        }
      } else {
        console.warn('Auth Callback - RESEND_API_KEY missing - skipping welcome email');
      }
    } catch (emailErr) {
      console.error('Auth Callback - Unexpected error during welcome email dispatch:', emailErr);
    }
  }

  return successResponse;
}
