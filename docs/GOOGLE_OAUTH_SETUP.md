# Google OAuth Setup Guide

## Required Configuration

To fix Google login issues, you **MUST** configure these URLs in **Google Cloud Console**:

### Step 1: Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project: **podsite-killer-auth**
3. Find your OAuth 2.0 Client ID: `601465632709-rq2t5hpn4k2ci947cs72lsf4pi3fc5id.apps.googleusercontent.com`
4. Click **Edit**

### Step 2: Add Authorized JavaScript Origins

Click **"+ Add URI"** and add:
- `http://localhost:3000`
- `http://localhost:3001` (if you use this port)
- `https://podsite-killer.vercel.app` (your production domain)
- `https://your-production-domain.com` (if different)

### Step 3: Add Authorized Redirect URIs

Click **"+ Add URI"** and add:
- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback` (if you use this port)
- `https://podsite-killer.vercel.app/auth/callback`
- `https://your-production-domain.com/auth/callback` (if different)

**IMPORTANT:** The redirect URI must match **exactly** what's in your code:
- Format: `{origin}/auth/callback`
- No trailing slashes
- Must include `http://` or `https://`

### Step 4: Supabase Configuration

1. Go to: **Supabase Dashboard → Authentication → URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback`
   - `https://podsite-killer.vercel.app/auth/callback`
   - `https://your-production-domain.com/auth/callback`

### Step 5: Save and Test

1. **Save** changes in Google Cloud Console
2. **Save** changes in Supabase
3. Wait 1-2 minutes for changes to propagate
4. Try Google login again

---

## Common Issues

### Issue: "redirect_uri_mismatch"
**Cause:** Redirect URI not in Google Cloud Console's authorized list  
**Fix:** Add the exact redirect URI (including `http://localhost:3000/auth/callback`) to Google Cloud Console

### Issue: "invalid_client"
**Cause:** Client ID mismatch or OAuth client disabled  
**Fix:** Verify Client ID in `.env` matches Google Cloud Console

### Issue: "access_denied"
**Cause:** User cancelled Google login or OAuth consent screen issue  
**Fix:** Check OAuth consent screen in Google Cloud Console, ensure it's published

### Issue: Login works but redirects to `/login#` or `/login`
**Cause:** Cookie/session not being set properly  
**Fix:** 
- Check browser console for errors
- Try "Clear session and try again" on login page
- Verify Supabase redirect URLs are correct

---

## Verification Checklist

- [ ] Google Cloud Console: Authorized JavaScript Origins includes localhost and production
- [ ] Google Cloud Console: Authorized Redirect URIs includes `/auth/callback` for all domains
- [ ] Supabase: Redirect URLs includes `/auth/callback` for all domains
- [ ] `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] `.env.local`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] Tested Google login in incognito mode
- [ ] Tested Google login on production domain

---

## Quick Test

After configuration, test with:
1. Open incognito/private window
2. Go to `/login`
3. Click "Continue with Google"
4. Should redirect to Google → back to your app → dashboard

If it fails, check browser console (F12) for error messages.
