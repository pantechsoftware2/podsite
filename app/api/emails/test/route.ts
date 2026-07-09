import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { sendResend, getWelcomeEmailHtml } from '@/lib/emails';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await req.json();
  const targetEmail = email || user.email;

  console.log('--- Manual Email Test Start ---');
  console.log('Sending test welcome email to:', targetEmail);
  
  const result = await sendResend(
    targetEmail,
    'PodSite Test Welcome Email 🚀',
    getWelcomeEmailHtml()
  );

  if (result.ok) {
    console.log('Manual test email sent successfully');
    return NextResponse.json({ ok: true, message: 'Email sent successfully! Check your inbox (and spam).' });
  } else {
    console.error('Manual test email failed:', result.error);
    return NextResponse.json({ ok: false, error: result.error || 'Failed to send' }, { status: 500 });
  }
}
