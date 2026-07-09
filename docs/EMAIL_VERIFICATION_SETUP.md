# Email Verification (Sign Up) via Resend

## Flow

1. User signs up with email/password.
2. Supabase creates the user and triggers a **confirmation email**.
3. That email is sent via **Resend** (if you configured custom SMTP in Supabase).
4. User clicks the link in the email → Supabase verifies the token and redirects to your app (`/auth/callback`).
5. Your app exchanges the code for a session and redirects to the dashboard → **account activated**.

## Why you might not receive the email

- **Confirm email is disabled** in Supabase (so no email is sent).
- **Custom SMTP (Resend) is not set** in Supabase (so Supabase tries to send itself and may fail or not send).
- **Redirect URL not allowed** in Supabase (so the link in the email is wrong or rejected).
- Email is in **spam**.

## 1. Enable email confirmation in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **Providers** → **Email**.
3. Turn **ON** “Confirm email”.
4. Save.

## 2. Configure Resend as custom SMTP in Supabase

So that Supabase sends the verification email **via Resend**:

1. In Supabase: **Project Settings** (gear) → **Auth**.
2. Scroll to **SMTP Settings**.
3. Enable **Custom SMTP**.
4. Fill in Resend’s SMTP details:
   - **Sender email:** the “From” address you verified in Resend (e.g. `noreply@yourdomain.com` or Resend’s onboarding domain).
   - **Sender name:** e.g. `PodSite` or your app name.
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (TLS).
   - **Username:** `resend`
   - **Password:** your [Resend API key](https://resend.com/api-keys) (use an API key with “Sending access”).
5. Save.

Resend’s docs: [SMTP](https://resend.com/docs/dashboard/sending-domains/send-with-smtp).

## 3. Redirect URLs in Supabase

So the “Confirm your email” link works:

1. **Authentication** → **URL Configuration**.
2. **Site URL:** your production app URL (e.g. `https://podsite-killer.vercel.app`).
3. **Redirect URLs** – add:
   - `https://your-production-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback`
   - (and 3001 if you use it)
4. Save.

Your app’s sign-up flow already uses `emailRedirectTo: origin + '/auth/callback?next=/dashboard'`, so after verification Supabase will send users to `/auth/callback` and they’ll land on the dashboard once the session is set.

## 4. In the app

- After sign up, the user sees: “Check your email (and spam folder) for a verification link.”
- **“Resend verification email”** calls `POST /api/auth/resend-confirmation` with `{ "email": "..." }`, which uses Supabase’s `auth.resend({ type: 'signup', email })` so Supabase sends another confirmation email (still via Resend if SMTP is set).
- If login fails with “Email not confirmed”, the same “Resend verification email” option is shown so they can request another email.

## Checklist

- [ ] Supabase: **Auth → Email** → “Confirm email” **ON**.
- [ ] Supabase: **Project Settings → Auth** → **Custom SMTP** set with Resend (`smtp.resend.com`, API key as password).
- [ ] Supabase: **Redirect URLs** include `https://your-domain.com/auth/callback` and `http://localhost:3000/auth/callback`.
- [ ] Resend: Sending domain (or onboarding domain) is verified so the “From” address is valid.
- [ ] User checks **spam** and uses **“Resend verification email”** if they don’t see the first email.
