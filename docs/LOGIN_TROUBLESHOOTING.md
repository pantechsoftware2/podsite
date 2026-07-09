# Login Troubleshooting – If the Same Problem Happens Again

## Why It Can Happen Again

This kind of "one user can't login, others can" issue can come back because of:

1. **Mixed auth methods** – User signs up with email, later uses Google (or the other way around). Supabase can end up with two identities for the same email; if linking fails, you get SSO/provider issues.
2. **Stale or corrupted sessions** – Old cookies/sessions in the browser can conflict with new logins.
3. **Provider linking bugs** – Supabase/Google OAuth linking can occasionally fail for a user and leave their account in a bad state (e.g. SSO showing "X").
4. **Browser/device quirks** – Extensions, privacy settings, or cached data on one device can break auth for that user only.

So yes, the same type of problem can occur again. Below is how to **prevent** it where possible and **deal with it** when it does.

---

## Prevention (Reduce Future Occurrences)

### 1. One primary auth method per user

- Prefer **either** Email+Password **or** Google for a given user.
- If they use both, use the same method each time when possible (e.g. always "Continue with Google" for that account).

### 2. Google OAuth config (Supabase + Google Cloud)

- **Authorized redirect URIs** must include:
  - Production: `https://your-domain.com/auth/callback`
  - Local: `http://localhost:3000/auth/callback` (and 3001 if you use it)
- **Authorized JavaScript origins**: add `https://your-domain.com` and `http://localhost:3000` (and 3001 if needed).
- If these are wrong or missing, Google login can fail or leave accounts in a bad state.

### 3. Supabase Auth settings

- **Redirect URLs**: Add every URL where you host the app (production + staging + localhost).
- **Email confirmation**: If you require it, users must confirm before login; otherwise they may see confusing errors.

### 4. After fixing a user once

- Tell the affected user to use **one** login method (e.g. "Always use Google" or "Always use email/password") to reduce the chance of provider/linking issues recurring.

---

## When It Happens Again – Step-by-Step

### Step 1: User self-help (no Supabase access needed)

1. **Try the "Having trouble signing in?" link on the login page**  
   - This clears local session/cookies and reloads. Fixes many "stuck" states.

2. **Try in an incognito/private window**  
   - Rules out extensions and old cookies.

3. **Try the other login method**  
   - If they usually use Google, try email/password (or vice versa). If one works, stick to that method from then on.

4. **Different browser or device**  
   - Confirms whether it’s account-related or device/browser-related.

### Step 2: Check Supabase (you or an admin)

1. **Supabase Dashboard → Authentication → Users**
2. Find the user by email.
3. Open the user and check:
   - **Overview**: "SSO" and "Provider Information" – is the method they use (e.g. Google) listed and healthy?
   - **Logs**: Any failed sign-ins or errors?

If SSO shows "X" or the provider they use is missing/broken, their account is in the same kind of bad state as before.

### Step 3: Fix without deleting the user (if possible)

- **Session / cookie issue**: User clears site data or uses "Having trouble signing in?" and tries again (often enough).
- **Provider link broken**: In Supabase you cannot "repair" a single user’s provider link from the UI in a reliable way. So in practice, if the account is clearly broken (e.g. SSO X, wrong providers), the reliable fix is usually **Step 4**.

### Step 4: Fix by deleting and re-registering (reliable fix)

Same approach as with your boss:

1. **Back up or transfer data**
   - In **Supabase → SQL Editor**:
   - Either **transfer** their podcasts to another user:
     ```sql
     UPDATE podcasts
     SET owner_id = 'ADMIN-USER-ID'
     WHERE owner_id = 'AFFECTED-USER-ID';
     ```
   - Or **delete** their podcasts (and episodes) if you don’t need them (delete `episodes` first, then `podcasts` for that `owner_id`).

2. **Delete the user**
   - **Authentication → Users** → find user → **Delete user**.

3. **User re-registers**
   - Same email is fine.
   - They sign up again (Sign up + email/password, or "Continue with Google").
   - They get a new user ID and a clean auth state; login should work.

4. **Optional**: If you transferred podcasts, transfer them back to the new user ID.

---

## Quick Reference: "One user can’t login" checklist

| Step | Action |
|------|--------|
| 1 | User: "Having trouble signing in?" → try again |
| 2 | User: Try incognito and/or other browser |
| 3 | User: Try other method (Google vs email/password) |
| 4 | You: Check user in Supabase (Overview + Logs) |
| 5 | If SSO/providers look broken → transfer podcasts → delete user → user re-registers |

---

## Summary

- **Can it happen again?** Yes – usually due to mixed auth methods, bad provider linking, or session/cookie issues.
- **How to reduce it:** Keep OAuth and redirect URLs correct; encourage one primary login method per user.
- **How to deal with it:** Self-help first (clear session, incognito, other method), then check Supabase; if the account is broken, transfer data → delete user → re-register.

Keeping this playbook (and the "Having trouble signing in?" link on the login page) gives you a repeatable way to handle the same problem in the future.
