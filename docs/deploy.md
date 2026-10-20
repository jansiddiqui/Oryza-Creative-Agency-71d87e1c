# Deploy and go-live: oryzaonline.in

The new Next.js site replaces the old static site on the **same Vercel project and the same domain**. The website needs no DNS change: `www.oryzaonline.in` already points at Vercel through Cloudflare. Go-live is a merge of `new-site` into `main`.

| | Old site (live now) | New site |
| --- | --- | --- |
| Branch | `main` | `new-site` (all work happens here) |
| Build | static HTML, no build | Next.js 16 (`vercel.json` → `"framework": "nextjs"`) |
| Where to see it | https://www.oryzaonline.in | Vercel preview URL for the `new-site` branch |

> **Never push to `main` until Oryza says "go live".**

---

## 1. Before go-live (one time)

### 1.1 Export the old newsletter subscribers (Supabase), then retire it
The old site saved newsletter emails to a Supabase table called `subscribers`. The new site has no newsletter, so export the list first:

1. Sign in at https://supabase.com/dashboard and open the project whose URL starts with `enombfjnfoifyjcafknn`.
2. Left sidebar → **Table Editor** → select **`subscribers`**.
3. Top right → **Export** (or the `…` menu next to the table name) → **Export table as CSV**. Save the file somewhere private. It contains personal data, so don't commit it to git.
   - Alternative: **SQL Editor** → run `select * from subscribers order by 1;` → **Export → CSV** under the results.
4. Open the CSV and check the row count matches what the table editor shows.
5. **Check Row Level Security (RLS):** on the same table, look for the RLS badge (or **Authentication → Policies**). If RLS was **off**, the list was publicly readable with the key in the old site's HTML. Note this for your records; under the DPDP Act, a lawyer can advise whether anyone needs to be informed.
6. **After go-live is stable**, delete the table (Table Editor → `…` → **Delete table**), or pause/delete the whole Supabase project if nothing else uses it. The old site's key will still sit in the git history of `main`, so the table must not stay readable.
7. **EmailJS** (sent the old "welcome" email from the browser): sign in at https://dashboard.emailjs.com, then delete template `template_6ljjun3` and service `service_r5d5a8u`, or at least restrict allowed domains, so nobody can keep sending email through your account.

### 1.2 Lead delivery: set up Resend for oryzaonline.in
Every contact-form and plan-builder lead is emailed to **contact@oryzaonline.in** through Resend.

1. Create an account at https://resend.com → **Domains → Add domain** → `oryzaonline.in`. Pick a region (any; the values below change with it).
2. Resend then shows **three records**. Add them in **Cloudflare → oryzaonline.in → DNS → Records → Add record**. Enter names without the domain; set **Proxy status = DNS only** and **TTL = Auto**:

   | Type | Name | Content | Priority |
   | --- | --- | --- | --- |
   | `MX` | `send` | `feedback-smtp.<region>.amazonses.com` (copy exactly from Resend) | `10` |
   | `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | — |
   | `TXT` | `resend._domainkey` | `p=…` (long DKIM key, copy exactly from Resend; it's unique to your account) | — |

   Only add the "inbound" MX record if Resend offers one **and** you want to receive mail in Resend. **You don't need it; skip it.**
3. **Don't change or remove any existing record.** In particular, keep:
   - `MX @ → smtp.nevtan.com` (your mailbox for contact@oryzaonline.in)
   - `TXT @ → v=spf1 include:_spf.nevtan.com ~all` (don't add Resend to this one; Resend's SPF lives on `send`)
   - `TXT _dmarc → v=DMARC1; p=quarantine` (Resend mail passes DMARC through the DKIM record above)
   - the `www` / `@` records pointing at Vercel
4. Back in Resend, click **Verify DNS records**. This usually takes minutes, and can take up to a few hours.
5. Resend → **API Keys → Create API key**, permission **Sending access**, domain `oryzaonline.in`. Copy it once; it's a **secret**.
6. Put it in Vercel as `RESEND_API_KEY` (§2), redeploy, and send a test lead from `/contact`. It should arrive at contact@oryzaonline.in from `website@oryzaonline.in` within a minute. If it doesn't: Vercel → Project → **Logs**, filter by `[lead]`.

### 1.3 Analytics and Search Console
- **GA4:** https://analytics.google.com → Admin → Create property "Oryza website" → Web stream `https://www.oryzaonline.in` → copy the **Measurement ID** (`G-…`) → `NEXT_PUBLIC_GA_ID`.
- **Microsoft Clarity:** https://clarity.microsoft.com → New project → Settings → **Project ID** → `NEXT_PUBLIC_CLARITY_ID`.
- **Search Console (recommended: Domain property):** https://search.google.com/search-console → Add property → **Domain** → `oryzaonline.in` → add the TXT record it gives you in Cloudflare (`@`, DNS only). This covers http/https/www/non-www and survives the switch.
  Alternative, URL-prefix property with the HTML tag method: put only the `content="…"` value into `NEXT_PUBLIC_GSC_VERIFICATION`.

### 1.4 Fill the TODOs
Search the code for `TODO` (`src/lib/site.ts`, the legal pages, `.env.example`). Still open: street address and PIN, hours, social profile URLs, GA4/Clarity IDs, legal entity name, and the legal review of `/privacy-policy` and `/terms`. All are optional for go-live; empty values are hidden.

---

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Set each for **Production** and **Preview** unless noted. Changing a variable only applies to **new** deployments, so redeploy afterwards.

| Name | Value | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.oryzaonline.in` | no |
| `NEXT_PUBLIC_PHONE` | `+91 7007345134` | no |
| `NEXT_PUBLIC_EMAIL` | `contact@oryzaonline.in` | no |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `917007345134` | no |
| `NEXT_PUBLIC_ADDRESS_STREET`, `NEXT_PUBLIC_ADDRESS_PIN`, `NEXT_PUBLIC_HOURS` | TODO | no |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `…_FACEBOOK_URL`, `…_LINKEDIN_URL`, `…_YOUTUBE_URL` | TODO | no |
| `RESEND_API_KEY` | from §1.2 | **yes** |
| `LEAD_TO_EMAIL` | `contact@oryzaonline.in` | no |
| `LEAD_FROM_EMAIL` | `Oryza Website <website@oryzaonline.in>` | no |
| `NEXT_PUBLIC_GA_ID` | `G-…` (**Production only**, so previews don't pollute stats) | no |
| `NEXT_PUBLIC_CLARITY_ID` | Clarity project ID (**Production only**) | no |
| `NEXT_PUBLIC_GSC_VERIFICATION` | only if using the HTML-tag method | no |

Site URL, phone, email and WhatsApp already default to these values in `src/lib/site.ts`, so the site works even before they're set.

**Domain:** `www.oryzaonline.in` is canonical. In Vercel → Project → **Domains**, `www.oryzaonline.in` must be the primary domain (no redirect) and `oryzaonline.in` must show **Redirect to www.oryzaonline.in (308)**. That's already the setup today; don't change it at go-live.

---

## 3. Preview (review before go-live)

Every push to `new-site` creates a Vercel **preview deployment**. Production is untouched, because only `main` deploys to production.
- Find it at Vercel → Project → **Deployments** (branch `new-site`), or on GitHub → branch `new-site` → the commit's status check "Vercel".
- `vercel.json` tells Vercel to build this branch as Next.js even though the project is still configured for the old static site.
- Previews are not indexed by Google (Vercel sends `X-Robots-Tag: noindex` on preview URLs).

---

## 4. Go live

Do this at a quiet hour. The whole switch takes as long as one build (~1–2 min), and the old site keeps serving until the new build is ready.

1. Confirm on the latest `new-site` preview: pages load, `/contact` lead arrives by email (§1.2), plan builder unlock arrives too, `npm test` is green.
2. Vercel → Project → **Settings → Build & Deployment → Framework Preset → Next.js** (leave build/output/install commands on their defaults). `vercel.json` already forces Next.js; setting the preset keeps the dashboard honest.
3. Make sure all **Production** environment variables from §2 are set.
4. Merge and push:
   ```bash
   git switch main
   git pull jansiddiqui main
   git merge --ff-only new-site
   git push jansiddiqui main
   ```
5. Watch Vercel → Deployments until the production build is **Ready**, then (optional) Cloudflare → Caching → **Purge Everything**.

## 5. Post-launch checklist (same day)

- [ ] `https://www.oryzaonline.in` shows the new site; `https://oryzaonline.in` and `http://` still redirect to `https://www.`.
- [ ] **Redirects:** each old URL returns `301` to its new page. Spot-check, or run the full list:
  ```bash
  for u in /index.html /about.html /services.html /shop.html /blog.html /contact.html /privacy-policy.html /cookie-policy.html /terms-of-services.html /blog/Grow-Your-Business-Online.html /catalog/web-design-package.html; do curl -s -o /dev/null -w "%{http_code} $u -> %{redirect_url}\n" "https://www.oryzaonline.in$u"; done
  ```
  The complete map is in `src/data/redirects.ts` (tested by `src/data/redirects.test.ts`).
- [ ] Send one test lead from `/contact` and one from the plan builder; both arrive at contact@oryzaonline.in.
- [ ] GA4 → **Realtime** shows your visit; Clarity shows a session within ~2 hours.
- [ ] **Search Console:** Sitemaps → submit `https://www.oryzaonline.in/sitemap.xml`. URL Inspection → `https://www.oryzaonline.in/` → **Request indexing**. Repeat for `/services` and `/plan-builder`.
- [ ] **Google Business Profile:** https://business.google.com → Edit profile → Contact → Website → `https://www.oryzaonline.in/`. Also update the website link in your Instagram, Facebook, LinkedIn and YouTube bios and in WhatsApp Business.
- [ ] Run Lighthouse (Chrome DevTools) on `/` and `/plan-builder` on mobile: aim for 90+ in Performance, Accessibility, Best Practices and SEO.
- [ ] One week later: Search Console → **Pages** and **Crawl stats**; look for 404s and fix any with a redirect in `src/data/redirects.ts`.
- [ ] Once stable: finish §1.1 steps 6–7 (delete the Supabase table, disable EmailJS).

## 6. Rollback

**Fastest (≈ 1 minute, no git):** Vercel → Project → **Deployments** → find the last production deployment of the **old** site (before the merge) → `…` → **Promote to Production** (Vercel calls this Instant Rollback). The old static build is served again immediately. Then pause auto-deploys if needed (Project → Settings → Git) while the issue is fixed.

**Permanent (via git), if the new site must stay off for a while:**
```bash
git switch main
git revert --no-edit 14bda36..HEAD   # undoes every commit after the old site's last commit, as new commits
git push jansiddiqui main
```
If you roll back via git, also set the Framework Preset back to **Other**, because the old site has no build step.

The old site's code is never lost: it stays in `main`'s git history up to commit `14bda36`.
