# Supabase setup for the Oryza admin

One-time setup for the database, file storage and sign-in behind `/admin`. About 15 minutes.
Everything is done in the Supabase dashboard; no command line is needed.

> **Keys:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public by design (Row Level Security
> protects the data). `SUPABASE_SERVICE_ROLE_KEY` bypasses all security: keep it only in Vercel (and your own
> `.env.local`), never in code, chat, email or a browser.

## 1. Run the migration (creates tables, security rules and storage buckets)

1. Supabase dashboard → your project (Mumbai) → **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261020000001_admin_foundation.sql` from the repo, copy **all** of it, paste, click **Run**.
   You should see "Success. No rows returned".
3. Check **Table Editor**: `admin_users`, `audit_log`, `leads`, `slot_images` exist, each with **RLS enabled**.
4. Check **Storage**: buckets `site-images` (Public) and `image-originals` (Private) exist.

Run it once. Later migrations will be new files in `supabase/migrations/`, run the same way in order.

*(Alternative with the Supabase CLI: `npx supabase link --project-ref <your-ref>` then `npx supabase db push`. It asks
for the database password from Project Settings → Database.)*

## 2. Make yourself the owner

1. Open `supabase/seed-owner.sql`, replace `YOUR-EMAIL@example.com` with your email **in lower case**.
2. SQL Editor → New query → paste → **Run**.

The owner can add more people later in **/admin → Users**.

## 3. Sign-in settings

**Authentication → Sign In / Providers**
- **Email** provider: enabled.
- **Allow new users to sign up: OFF.** Logins are created by you (step 4), never by strangers.
- Confirm email: can stay on (users you create in step 4 are confirmed automatically).

**Authentication → URL Configuration**
- **Site URL:** `https://www.oryzaonline.in`
- **Redirect URLs** (add each):
  - `https://www.oryzaonline.in/admin/auth/callback`
  - `https://*-jansiddiquis-projects.vercel.app/admin/auth/callback` (Vercel previews)
  - `http://localhost:3000/admin/auth/callback` (local development)

## 4. Create a login for each admin

For yourself now, and for each person you add later under /admin → Users:

1. **Authentication → Users → Add user → Create new user**.
2. Email (the same one as on the allow-list), a temporary password, tick **Auto Confirm User** → Create.
3. Give them the temporary password privately. After signing in they set their own under **Account**.

A login without an allow-list entry cannot open the admin, and an allow-list entry without a login cannot sign in. Both are needed.

## 5. Email for "Email me a sign-in link" (recommended)

Supabase's built-in email only reaches project members and is heavily rate-limited. Send through Resend instead
(the domain is already verified):

1. Resend → **API Keys → Create** a key named "Supabase auth", permission **Sending access**, domain `oryzaonline.in`.
2. Supabase → **Project Settings → Authentication → SMTP Settings → Enable custom SMTP**:
   - Sender email `no-reply@oryzaonline.in`, sender name `Oryza`
   - Host `smtp.resend.com`, port `465`, username `resend`, password = that Resend key
3. Save. Password sign-in works without this; only email links need it.

## 6. Vercel

Already set (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Project Settings → Build and Deployment → Node.js Version → 22.x** (supabase-js is dropping Node 20).
- Redeploy after changing anything.

## 7. Check it works

1. Open `/admin` on the preview → you are sent to the sign-in page.
2. Sign in with the password from step 4 → the Overview opens.
3. **Account** → set your own password.
4. Images → open any slot → the prompt is there; uploading works (see `docs/admin-images.md`).
5. Send a test enquiry from `/contact` → it appears under **Leads** (and in your inbox).

## Security model (for reference)

| Who | Can do |
| --- | --- |
| Public visitors (anon key) | Read **live** image records, safe columns only. Nothing else: no leads, no originals, no admin tables. |
| Signed-in user not on the allow-list | Nothing. |
| Admin (editor) | Through the website server: images, leads, activity log. |
| Owner | Everything editors can, plus Users. |
| Website server (service role) | Used only after the server has checked the admin, plus saving new leads from the public forms. |

Every admin page, action and download checks the admin **on the server**; the `/admin` gate in front is only the
first check. Tests in `supabase/migrations.test.ts` run the real migration and verify these rules.
