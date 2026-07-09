
import { NextResponse } from 'next/server';
import { sendResend } from '@/lib/emails';

export async function GET() {
  try {
    const to = 'pantechsoft26@gmail.com'; // Testing to user's likely email
    const subject = 'PodSite Debug Test 🧪';
    const html = '<p>If you see this, email configuration is CORRECT. 🎉</p>';
    
    console.log('--- Email Debug Test ---');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_FROM:', process.env.RESEND_FROM);

    const result = await sendResend(to, subject, html);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
