/**
 * Email templates and sender for PodSite (Resend).
 * Used for: welcome, new episode, commerce (buyer + creator), domain live.
 */

const FROM = process.env.RESEND_FROM || 'PodSite <support@makemypodcastsite.com>';

function baseStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
  `;
}

function baseWrap(html: string) {
  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body style="margin:0;padding:0;background-color:#020617;font-family:'Inter',sans-serif;color:#f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#020617;padding:60px 24px;">
    <tr><td align="center">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0f172a;border-radius:24px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#38bdf8 0%,#818cf8 50%,#c084fc 100%);"></td></tr>
        <tr><td style="padding:48px 40px;">
          ${html}
        </td></tr>
        <tr><td style="padding:40px;background:#020617;border-top:1px solid #1e293b;text-align:center;">
          <div style="margin-bottom:24px;">
            <a href="#" style="display:inline-block;width:36px;height:36px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;line-height:36px;text-align:center;color:#f8fafc;text-decoration:none;margin:0 8px;font-weight:900;font-style:italic;font-size:16px;">𝕏</a>
            <a href="#" style="display:inline-block;width:36px;height:36px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;line-height:36px;text-align:center;color:#f8fafc;text-decoration:none;margin:0 8px;font-weight:900;font-style:italic;font-size:14px;">in</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app'}/dashboard" style="display:inline-block;background:#f8fafc;color:#020617;padding:8px 20px;border-radius:8px;font-size:12px;font-weight:900;text-decoration:none;margin-left:16px;text-transform:uppercase;letter-spacing:0.1em;box-shadow:4px 4px 0px #38bdf8;">SUBSCRIBE NOW</a>
          </div>
          <p style="color:#64748b;font-size:11px;margin:0;font-family:'Space Grotesk',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;">&copy; ${new Date().getFullYear()} PODSITE-KILLER. ALL RIGHTS RESERVED.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type SendOptions = { to: string; subject: string; html: string };

/** Welcome email after signup (trigger: user_created) */
export function getWelcomeEmailHtml(): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app';
  const html = `
    <div style="text-align:center;">
      <div style="margin-bottom:32px;">
        <span style="background:rgba(56,189,248,0.1);color:#38bdf8;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;display:inline-block;border:1px solid rgba(56,189,248,0.2);">Welcome Aboard</span>
      </div>
      <h1 style="color:#f8fafc;font-size:36px;font-weight:700;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.03em;">Welcome to PodSite 🚀</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 40px;font-weight:400;">Your high-performance podcast empire starts here. Let's launch your show in three simple steps.</p>
      
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 48px;">
        <tr>
          <td width="33.33%" style="padding:0 8px;">
            <div style="background:#1e293b;border-radius:16px;padding:24px 16px;border:1px solid #334155;text-align:center;">
              <div style="background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;width:32px;height:32px;border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;font-family:'Space Grotesk',sans-serif;">1</div>
              <p style="font-weight:600;color:#f8fafc;margin:0 0 8px;font-size:14px;">Paste RSS</p>
              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.4;">Drop your feed into the dashboard.</p>
            </div>
          </td>
          <td width="33.33%" style="padding:0 8px;">
            <div style="background:#1e293b;border-radius:16px;padding:24px 16px;border:1px solid #334155;text-align:center;">
              <div style="background:linear-gradient(135deg,#818cf8,#c084fc);color:#fff;width:32px;height:32px;border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;font-family:'Space Grotesk',sans-serif;">2</div>
              <p style="font-weight:600;color:#f8fafc;margin:0 0 8px;font-size:14px;">Sync YT</p>
              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.4;">Link your channel for auto-matching.</p>
            </div>
          </td>
          <td width="33.33%" style="padding:0 8px;">
            <div style="background:#1e293b;border-radius:16px;padding:24px 16px;border:1px solid #334155;text-align:center;">
              <div style="background:linear-gradient(135deg,#c084fc,#f472b6);color:#fff;width:32px;height:32px;border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;font-family:'Space Grotesk',sans-serif;">3</div>
              <p style="font-weight:600;color:#f8fafc;margin:0 0 8px;font-size:14px;">Launch</p>
              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.4;">Share your stunning new website.</p>
            </div>
          </td>
        </tr>
      </table>

      <a href="${dashboardUrl}/dashboard" style="display:inline-block;background:linear-gradient(90deg,#38bdf8 0%,#818cf8 100%);color:#fff;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;font-family:'Space Grotesk',sans-serif;text-decoration:none;margin-bottom:32px;text-transform:uppercase;letter-spacing:0.05em;box-shadow:0 10px 25px -5px rgba(56,189,248,0.4);">Enter Dashboard</a>

      <div style="background:rgba(56,189,248,0.05);border-radius:16px;padding:24px;border:1px solid rgba(56,189,248,0.1);text-align:left;">
        <p style="margin:0 0 12px;color:#38bdf8;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;font-family:'Space Grotesk',sans-serif;">⚡ Pro Tips</p>
        <ul style="margin:0;padding-left:20px;list-style-position:outside;line-height:1.6;">
          <li style="color:#cbd5e1;font-size:13px;margin-bottom:8px;">Your first podcast becomes your primary show automatically.</li>
          <li style="color:#cbd5e1;font-size:13px;margin-bottom:8px;">Episodes sync perfectly whenever your RSS feed updates.</li>
          <li style="color:#cbd5e1;font-size:13px;">Use the theme customizer to match your brand's aesthetic.</li>
        </ul>
      </div>
    </div>`;
  return baseWrap(html);
}

/** Verification email for email signups (trigger: email_signup) */
export function getVerificationEmailHtml(verificationUrl: string): string {
  const html = `
    <div style="text-align:center;">
      <div style="margin-bottom:32px;">
        <span style="background:rgba(52,211,153,0.1);color:#34d399;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;display:inline-block;border:1px solid rgba(52,211,153,0.2);">Action Required</span>
      </div>
      <h1 style="color:#f8fafc;font-size:36px;font-weight:700;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.03em;">Verify your email</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 40px;font-weight:400;">Confirm your account. Click the link below to activate your premium podcast studio.</p>
      
      <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(90deg,#34d399 0%,#059669 100%);color:#020617;padding:18px 48px;border-radius:12px;font-size:16px;font-weight:700;font-family:'Space Grotesk',sans-serif;text-decoration:none;margin-bottom:40px;text-transform:uppercase;letter-spacing:0.05em;box-shadow:0 10px 25px -5px rgba(52,211,153,0.4);border:2px solid #a7f3d0;">Click link to activate</a>

      <p style="color:#64748b;font-size:13px;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Or paste this link manually:</p>
      <div style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #1e293b;margin-bottom:40px;box-shadow:inset 0 2px 4px 0 rgba(0,0,0,0.06);">
        <p style="color:#6ee7b7;font-size:13px;margin:0;word-break:break-all;font-family:monospace;letter-spacing:0.05em;">${verificationUrl}</p>
      </div>

      <div style="background:rgba(245,158,11,0.05);border-radius:16px;padding:24px;border:1px solid rgba(245,158,11,0.1);text-align:left;">
        <p style="margin:0 0 8px;color:#fbbf24;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;font-family:'Space Grotesk',sans-serif;">⏳ Link expires soon</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">If you didn't create this account, you can safely ignore this automated email.</p>
      </div>
    </div>`;
  return baseWrap(html);
}

export function getLoginSuccessEmailHtml(): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app';
  const html = `
    <div style="text-align:center;">
      <div style="margin-bottom:32px;">
        <span style="background:rgba(52,211,153,0.1);color:#34d399;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;display:inline-block;border:1px solid rgba(52,211,153,0.2);">Security Alert</span>
      </div>
      <h1 style="color:#f8fafc;font-size:36px;font-weight:700;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.03em;">Successful Login</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 40px;font-weight:400;">We detected a new successful login to your PodSite Killer account.</p>
      
      <a href="${dashboardUrl}/dashboard" style="display:inline-block;background:linear-gradient(90deg,#38bdf8 0%,#818cf8 100%);color:#fff;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;font-family:'Space Grotesk',sans-serif;text-decoration:none;margin-bottom:32px;text-transform:uppercase;letter-spacing:0.05em;box-shadow:0 10px 25px -5px rgba(56,189,248,0.4);">Go to Dashboard</a>

      <div style="background:rgba(245,158,11,0.05);border-radius:16px;padding:24px;border:1px solid rgba(245,158,11,0.1);text-align:left;">
        <p style="margin:0 0 8px;color:#fbbf24;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;font-family:'Space Grotesk',sans-serif;">🛡 Didn't do this?</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">If you did not authorize this login, please change your password immediately and contact support.</p>
      </div>
    </div>`;
  return baseWrap(html);
}
export function getNewEpisodeEmailHtml(episodeTitle: string): string {
  const html = `
    <div style="text-align:center;">
      <p style="background:#eef2ff;color:#6366f1;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;display:inline-block;margin-bottom:24px;">New Episode</p>
      <h1 style="color:#111827;font-size:28px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em;">New episode detected 🎙</h1>
      <p style="color:#374151;font-size:18px;font-weight:600;margin:0 0 12px;">${episodeTitle}</p>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Your website has been updated automatically.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://podsite-killer.vercel.app'}/dashboard" style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">View dashboard</a>
    </div>`;
  return baseWrap(html);
}

/** Commerce: buyer – your purchase is ready (trigger: stripe.payment_succeeded) */
export function getCommerceBuyerEmailHtml(productTitle: string, downloadUrl: string): string {
  const html = `
    <div style="text-align:center;">
      <p style="background:#eef2ff;color:#6366f1;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;display:inline-block;margin-bottom:24px;">Your purchase is ready</p>
      <h1 style="color:#111827;font-size:32px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em;">Thanks for buying!</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Download your file below:</p>
      <a href="${downloadUrl}" style="display:inline-block;background:#111827;color:#fff;padding:18px 40px;border-radius:16px;font-size:16px;font-weight:700;text-decoration:none;">Download PDF</a>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">This link expires in 24 hours. Save the file to your device after downloading.</p>
    </div>`;
  return baseWrap(html);
}

/** Commerce: creator – you made a sale (trigger: stripe.payment_succeeded) */
export function getCommerceCreatorEmailHtml(productTitle: string, amountFormatted: string, dashboardUrl: string): string {
  const html = `
    <div style="text-align:center;">
      <p style="background:#d1fae5;color:#059669;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;display:inline-block;margin-bottom:24px;">Sale</p>
      <h1 style="color:#111827;font-size:28px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em;">You made a sale 🎉</h1>
      <p style="color:#374151;font-size:16px;margin:0 0 8px;"><strong>Product:</strong> ${productTitle}</p>
      <p style="color:#374151;font-size:16px;margin:0 0 24px;"><strong>Amount:</strong> ${amountFormatted}</p>
      <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">View dashboard →</a>
    </div>`;
  return baseWrap(html);
}

/** Domain is live (trigger: after DNS verification) */
export function getDomainLiveEmailHtml(domain: string): string {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const html = `
    <div style="text-align:center;">
      <p style="background:#d1fae5;color:#059669;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;display:inline-block;margin-bottom:24px;">Live</p>
      <h1 style="color:#111827;font-size:28px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em;">Your domain is live 🎉</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Your podcast site is now available at:</p>
      <a href="${url}" style="color:#6366f1;font-size:18px;font-weight:700;text-decoration:none;">${url}</a>
    </div>`;
  return baseWrap(html);
}

export async function sendResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY missing, skip send');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = (data as any)?.message || res.statusText;
      if (msg.includes('testing emails')) {
        return { ok: false, error: 'Resend Test Mode: You can only send emails to your own email address (pantechsoft26@gmail.com) until you verify a domain.' };
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e: any) {
    console.error('Resend send error', e);
    return { ok: false, error: e?.message };
  }
}

export function getProductDeliveryEmailHtml(productName: string, downloadUrl: string) {
  const html = `
    <div style="text-align:center;">
      <div style="margin-bottom:32px;">
        <span style="background:rgba(99,102,241,0.1);color:#818cf8;padding:8px 16px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;display:inline-block;border:1px solid rgba(99,102,241,0.2);">Purchase Complete</span>
      </div>
      <h1 style="color:#f8fafc;font-size:36px;font-weight:700;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.03em;">Thanks for your purchase!</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 40px;font-weight:400;">Your digital product <strong style="color:#fff;">${productName}</strong> is ready for download.</p>
      
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(90deg,#818cf8 0%,#4f46e5 100%);color:#020617;padding:18px 48px;border-radius:12px;font-size:16px;font-weight:700;font-family:'Space Grotesk',sans-serif;text-decoration:none;margin-bottom:40px;text-transform:uppercase;letter-spacing:0.05em;box-shadow:0 10px 25px -5px rgba(99,102,241,0.4);border:2px solid #c7d2fe;">Download Now</a>

      <p style="color:#64748b;font-size:13px;margin:0 0 16px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Or paste this link manually (valid for 7 days):</p>
      <div style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #1e293b;margin-bottom:40px;box-shadow:inset 0 2px 4px 0 rgba(0,0,0,0.06);">
        <p style="color:#a5b4fc;font-size:13px;margin:0;word-break:break-all;font-family:monospace;letter-spacing:0.05em;">${downloadUrl}</p>
      </div>
    </div>`;
  return baseWrap(html);
}
