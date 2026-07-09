import { NextResponse } from 'next/server';
import { sendResend } from '@/lib/emails';
import { getLoginSuccessEmailHtml } from '@/lib/emails';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email missing' }, { status: 400 });
    }

    const html = getLoginSuccessEmailHtml();

    await sendResend(
      email.trim(),
      'Successful login to PodSite Killer',
      html
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login success email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
