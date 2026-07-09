import { NextResponse } from 'next/server';
import { getWelcomeEmailHtml, sendResend } from '@/lib/emails';

/** Trigger: user_created — send welcome email after signup */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log('=== Welcome Email API ===');
    console.log('Sending welcome email to:', email);
    console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_FROM:', process.env.RESEND_FROM);

    const html = getWelcomeEmailHtml();
    const result = await sendResend(email.trim(), 'Welcome to PodSite 🚀', html);
    
    console.log('Send result:', result);

    if (!result.ok) {
      console.error('Welcome email failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ sent: true });
  } catch (e: any) {
    console.error('Welcome email error', e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
