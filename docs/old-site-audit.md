# Old site audit: oryzaonline.in

> **Status (Phase 1):** decision taken to drop the old site entirely. The new app lives at the repo root on branch `new-site`; old-site files are deleted there and remain only in `main`'s history (≤ `14bda36`). No old content, claims, images or logo were carried over. Redirects: `src/data/redirects.ts`. Go-live and rollback: `docs/deploy.md`. Sections 8.1–8.4 below describe the plan as proposed before that decision.

Phase 0, read-only. Audited 2026-10-20 from the repo (`D:\Project\Oryza`, branch `main`, HEAD `14bda36`) and from the live site's public responses (DNS and HTTP headers only). No old-site file was changed.

> **Read this first: the repo layout is not what the brief assumes.** There is no `/oryza-web` folder. The new Next.js app has been unpacked into the **repo root**, next to the old HTML files, and none of it is committed yet (`package.json`, `src/`, `public/`, `next.config.ts`, `.gitignore`, `README.md` and the rest are all untracked). Only this audit sits in `/oryza-web/docs/`, because that's where the brief asked for it. See §8.1 for the risk and the proposed fix.

---

## 1. Tech stack, deployment and hosting

| Item | Finding |
| --- | --- |
| Type | Hand-written static HTML. 32 pages, no framework, no CMS, no build step, no `package.json` of its own |
| Styling | Tailwind via the **Play CDN** (`cdn.tailwindcss.com`) on all 31 pages. Tailwind says the Play CDN is not for production: the whole compiler runs in the browser on every visit |
| JS libraries (CDN, unpinned majors) | `@supabase/supabase-js@2` (23 pages), `emailjs-com@3` (23), `swiper@11` (10) plus `swiper@9` (1), `glightbox 3.2.0` (1) |
| Fonts | Google Fonts: Playfair Display + Poppins (+ Inter on 2 pages) |
| Repo | GitHub `jansiddiqui/Oryza-Creative-Agency`, branch `main`, 4 commits (2025-10-20 → 2025-10-28) |
| Hosting | **Vercel** (`x-vercel-id`, `x-vercel-cache` headers). Most likely a Git-connected project that deploys `main` from the repo root as static files. There is no `vercel.json`, so it runs on defaults |
| DNS / CDN | **Cloudflare** nameservers (`hassan`/`vita.ns.cloudflare.com`). Records are **proxied** (orange cloud): `Server: cloudflare`, Cloudflare email obfuscation is on, and robots.txt is Cloudflare's managed one |
| Canonical host | `oryzaonline.in` → **307** → `https://www.oryzaonline.in/`. `http://` → 308 → https |
| URL style | Only `.html` URLs work: `/about.html` returns 200, `/about` returns 404 (no `cleanUrls`) |
| Email | MX `smtp.nevtan.com`, SPF `v=spf1 include:_spf.nevtan.com ~all`. **The cutover must not touch these records** |
| Live vs repo | The live `index.html` matches commit `14bda36`. The uncommitted change in `index.html` (5 `img/serviceN.png` images) is **not live** (`/img/service1.png` returns 404 on production) |
| No config found | No `.htaccess`, `vercel.json`, `netlify.toml`, Dockerfile, CI workflows, cPanel/Hostinger files. `.qodo/` only holds empty folders |

TODO (owner): confirm which Vercel account/team owns the project and who has Cloudflare login access. Both are needed for the cutover.

## 2. Every page: the 301 redirect source list

32 URLs (`/` plus 31 HTML files), all served from `https://www.oryzaonline.in`. `/` and `/index.html` are the same page; `/` stays `/` on the new site, the other 31 are redirected. The old site has no dynamic routes.

**Main pages (9):** `/` (`/index.html`), `/about.html`, `/services.html`, `/shop.html`, `/blog.html`, `/contact.html`, `/privacy-policy.html`, `/terms-of-services.html`, `/cookie-policy.html`

**Blog posts (11), `/blog/…`:**
`Building-a-Memorable-Brand-Identity-from-Scratch.html`, `Creating-Scroll-Stopping-Social-Media-Content.html`, `Grow-Your-Business-Online.html`, `How-Oryza-Builds-Personal-Brands-for-Leaders.html`, `How-Oryza-Helps-You-Establish-Your-Lifestyle-as-a-Brand.html`, `Mastering-Instagram-Stories-for-Business-Growth.html`, `Overcoming-Creative-Block-Strategies-That-Work.html`, `The-Art-of-Visual-Storytelling-in-Marketing.html`, `The-Creative-Workspace-Designing-for-Inspiration.html`, `The-Psychology-of-Color-in-Brand-Identity.html`, `Typography-Trends-for-Modern-Digital-Design.html`

**Catalog / "service product" pages (11), `/catalog/…`:**
`premium-social-media-pack.html`, `instagram-content-pack.html`, `facebook-ad-creatives-package.html`, `premium-political-campaign-social-media-kit.html`, `logo-design-package.html`, `brand-style-guide-service.html`, `business-card-design.html`, `professional-visiting-card-design.html`, `customized-bag-designs.html`, `packaging-design-package.html`, `web-design-package.html`

Also redirect the extensionless forms (`/about`, `/blog/<slug>`, `/catalog/<slug>`). They return 404 today, but people may type them or other sites may link them that way. `/portfolio.html` is linked from 7 pages but **never existed**, so point it at the new `/portfolio`.

## 3. Business information

### Verified enough to carry over (still confirm)
| Field | Value on old site | Note |
| --- | --- | --- |
| Name | Oryza Creative Agency | Consistent everywhere |
| Phone | +91 7007345134 | On every page. **TODO: confirm it is also the WhatsApp Business number** |
| Email | contact@oryzaonline.in | Real mailbox (domain MX exists) |
| Domain | www.oryzaonline.in | Live |
| City | Kanpur Nagar, Uttar Pradesh | |
| Jurisdiction (terms) | Kanpur Nagar, Uttar Pradesh | |

### Conflicting or wrong. Do not carry over until confirmed
- **PIN code conflict:** `209214` on most pages, `208001` on `contact.html` (once), `cookie-policy`, `terms` and `catalog/logo-design-package`. **TODO: which is correct, and what is the full street address?** No street address appears anywhere.
- Stray template contacts: `info@oryza.design` (privacy policy), `www.oryza.design` (cookie policy), `email@oryza.com` / `oryza.com` (visiting-card mock-up). Drop all of them.
- **Business hours:** none listed. TODO.
- **Social profiles:** all four footer icons are `href="#"`. **No real profile URLs exist.** TODO.
- **Legal entity / GST:** not stated. TODO (needed for terms and privacy).

### Services the old site advertised
Social media management, social media post design, custom design packages, political campaign branding, logo and visual identity, print design (business/visiting cards, brochures, banners), custom bag design, packaging design, web design, Facebook ad creatives, Instagram content pack, brand style guide, "creative workshops".
**TODO (owner):** which of these do you still sell? The new site centres on social media management by platform. Logo, print, bag, packaging and web design would need either an "Add-on design services" section or to be dropped.

### Prices: treat as template, not real
All prices are in **USD**: packages at $499 / $899 / $1,499 per month on `services.html`, and $129–$899 across the shop/catalog pages. That doesn't fit a Kanpur agency billing in INR, and it matches the template's sample data. **Carry over none of these.** TODO: real INR pricing, or "price on request".

### Team: fabricated
`about.html` lists "Eleanor Sterling, Founder & Creative Director, 10+ years", "Marcus Rodriguez, Senior Graphic Designer" and "Sophia Chen, Social Media Strategist", with initials-only avatars. These are template people. The about text ("began five years ago") also conflicts with a site first committed in Oct 2025. **Drop. TODO: real founder/team names, photos, bios, if wanted.**

### Portfolio / clients: none real
Every "Featured Work" and "Creative Aesthetic" item is a generic template description with no client name ("local restaurant chain", "mayoral campaign", "statewide campaign", "law firm", "tech startup"…). Visuals are `placehold.co` / `picsum.photos` placeholders or gradient boxes. **No real client or project exists on the old site.** → `/portfolio` launches with the empty state unless you supply real work.

### Testimonials and ratings: fabricated
- Jane Smith ("The Daily Grind Cafe"), Michael Rodriguez ("City Council Member"), Sarah Chen ("Bloom & Groom") on `index.html` and `services.html`.
- Sarah Johnson, "Campaign Manager", plus "Congressional / Advocacy Group" on the political kit page. These are US political terms that don't fit an Indian agency.
- Star ratings with review counts on 8 catalog pages, for example "4.9 / 5 (217 Reviews)" and "4.8 / 5 (189 Reviews)". The site has no review system.
- Homepage counters: **150 projects, 200 clients, 75 campaigns, 5 years**. No source.

**None of these can carry over** (rule 2). Showing fake reviews and ratings is also a consumer-protection risk in India (CCPA guidelines on fake reviews and misleading ads). It's worth removing them from the live site before the cutover if that will take a while.

## 4. Integrations

| Integration | Where | How it works | Verdict |
| --- | --- | --- | --- |
| **Contact form** | `contact.html` | **Fake.** It validates, then after a 2-second `setTimeout` shows "success". **Nothing is sent or stored. Every enquiry sent through it has been lost.** | Replace with the new `/api/lead` (Resend + WhatsApp fallback) |
| **Newsletter** | footer on 23 pages | Browser → Supabase `insert` into table `subscribers` (project `enombfjnfoifyjcafknn.supabase.co`, **anon** key hard-coded in the page), then EmailJS sends a "welcome" email from the browser (`service_r5d5a8u`, `template_6ljjun3`, public key hard-coded) | Export the existing subscriber list. Re-create server-side only if you want a newsletter (decision below) |
| "Chat widget" | `contact.html` | `alert("Chat feature coming soon!")` | Drop. The new site uses WhatsApp buttons |
| Cart / checkout | `shop.html`, catalog pages | "Add to Cart" / "Buy Now" buttons do nothing. `alert('Redirecting to checkout...')`. No payment provider | Drop |
| "Download case studies", "Download free guide" | services, political kit | No files behind them | Drop |
| Google Analytics / GTM / Meta Pixel | — | **None installed** (yet `cookie-policy.html` claims Google Analytics is used) | Set up fresh. TODO: GA4 measurement ID, Meta Pixel ID (if you run Meta ads) |
| Search Console verification | — | No meta tag and no DNS TXT verification found. The site is **probably not verified** | Verify a **Domain property** through Cloudflare DNS TXT before the cutover (§8) |
| Payments, other APIs | — | None | — |

**Secrets / config in the old site (names only):** `SUPABASE_URL`, `SUPABASE_KEY` (anon role JWT), EmailJS public key, EmailJS service ID, EmailJS template ID. All of them are hard-coded in HTML, not env vars. The old site has no `.env`.

**New-site env vars already defined** (`.env.example`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL`, `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL`.
**Proposed for Phase 1:** `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` (optional if verified via DNS).

## 5. SEO assets

- **Titles:** every page has one. Several blog titles are duplicates: "How Oryza Builds Personal Brands for Leaders" is used by two different posts.
- **Meta descriptions:** missing on `index.html`, `privacy-policy`, `terms-of-services`, `logo-design-package`, and 8 of the 11 blog posts.
- **Open Graph:** only on `index.html`, and its `og:image` is `https://example.com/oryza-og-image.jpg` (broken).
- **Canonical tags:** none. **Sitemap:** none (`/sitemap.xml` → 404). **robots.txt:** Cloudflare-managed content-signals file only, with no sitemap line.
- **Schema:** `BlogPosting` microdata on blog posts only. No `Organization` / `LocalBusiness`.
- **Blog dates are not credible:** posts are dated Apr–Aug **2023**, but the repo and site started in Oct 2025. Don't carry those dates over.
- **Likely ranking pages:** the site is about a year old, has thin, generic content, no sitemap, and is probably not in Search Console. Realistic rankings are limited to brand searches ("Oryza Creative Agency", "Oryza Kanpur") on `/`, `/contact.html` and `/about.html`. **TODO: if you have Search Console or Cloudflare analytics access, export the top pages and queries.** That's the only way to know for sure. Redirecting every URL (§8.3) protects whatever equity exists either way.

## 6. Images and media worth reusing

| Path | What it is | Reuse? |
| --- | --- | --- |
| `img/logo.png` (778×775) | **Old logo**: navy "O" on a yellow rounded square | **No.** The brief forbids it. Must not appear on the new site |
| `img/service1–5.png` (1536×1024, ~2 MB each, uncommitted) | **AI-generated mock-ups**: social screens with fake engagement numbers ("1.2K", "320"), tote bags, business cards, political billboard, brand stationery. Garbled UI text, generic leaf logos, **no real client** | **No, not as portfolio.** At best decorative "concept" imagery, but they show invented metrics. Recommend dropping |
| `New folder/*.png` (1254×1254 etc., untracked) | **New gold "O" logo masters**: master mark, primary full logo, horizontal, vertical stacked, wordmark, transparent variants | **Yes.** Higher-res than `public/brand/` (267 px wide). Use to make sharper `public/brand` assets, favicons and the OG image in Phase 1 |
| `public/brand/*` | New logo set already in the new app | Keep |
| Photos / videos of real work | **None in the repo** | TODO: supply real shoots, reels, client posts (with client permission) |

## 7. Broken, insecure or not to carry over

**Security**
1. **Supabase anon key in public HTML.** The anon key is designed to be public, but then the `subscribers` table is only safe if **Row Level Security** allows `insert` and blocks `select`/`update`/`delete` for `anon`. Without RLS, anyone can read the full subscriber email list. **TODO (owner): check in the Supabase dashboard → Table editor → subscribers → RLS.** I did not query the live database.
2. **EmailJS can be abused to send email from the browser.** The template takes `to_email` from the page, so anyone with the public key and IDs (all in the HTML) can send "Welcome to Oryza" emails to any address, using your EmailJS quota and reputation. After the cutover, **disable that template or the service**, or at least restrict allowed origins in EmailJS.
3. Unpinned CDN scripts (`supabase-js@2`, `emailjs-com@3`, `swiper@11`) with no Subresource Integrity. Supply-chain exposure; the new site bundles its dependencies instead.

**Broken**
4. Contact form sends nothing (§4). **This is the most important finding. Leads have been lost.**
5. Relative links inside `/blog/` point at `about.html`, `index.html`, `services.html`, `contact.html`, `blog.html` (resolve to `/blog/about.html` and so on → 404) on 9–12 pages. `portfolio.html` is linked from 7 pages and doesn't exist.
6. Social icons are `href="#"`. `og:image` is on example.com. Chat, cart, checkout, case-study and guide downloads are fake.
7. The cookie policy claims Google Analytics, but none is installed. The legal pages were never legally reviewed and contain template contacts.
8. Performance: Tailwind Play CDN on every page, ~50–80 KB of inline HTML per page, 2 MB PNGs (uncommitted).

**Do NOT carry over:** the old logo, all testimonials, ratings and review counts, the homepage counters, the team section, USD prices, placeholder portfolio items and images, the AI service mock-ups, 2023 blog dates, stray `oryza.design`/`oryza.com` contacts, the client-side Supabase/EmailJS code, the fake chat/cart/checkout.

## 8. Migration plan

### 8.1 Fix the repo layout first (the risk to the live site)
The live Vercel project deploys `main` from the repo root. The new app's files sit **untracked in that same root**. If someone runs `git add -A && git push` today, the next production deploy gets a `package.json` with a `next build` script next to the old HTML. Depending on the project's framework setting, that either breaks the build or replaces the live site with an unfinished app.

**Proposal (needs your OK, then Phase 1 step 0):**
1. Move the new app's files (`src/`, `public/`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mts`, `.env.example`, `.gitignore`, `README.md`) into `/oryza-web/`, matching the brief. Delete the generated `tsconfig.tsbuildinfo` / `next-env.d.ts`. **No old-site file is touched.**
2. Do all new-site work on a branch `new-site`, not `main`.
3. Leave `New folder/` (logo masters) and the uncommitted `img/service*.png` + `index.html` edit alone until you decide. Recommendation: don't publish the service mock-ups.

### 8.2 Keep / port / redirect / drop

| Old asset | Action |
| --- | --- |
| Name, phone, email, city, domain | **Keep**, after confirmation → `.env.local` + `src/lib/site.ts` |
| PIN code, street address, hours, socials, WhatsApp number, entity/GST | **TODO**, owner to supply. Left blank, never guessed |
| Contact form | **Replace** with new `/api/lead` |
| Newsletter subscribers | **Export** the CSV from Supabase. Decide whether to keep a newsletter |
| Privacy / Terms / Cookie | **Rewrite** as `/privacy-policy` (cookies section merged in) and `/terms`, marked TODO for legal review |
| Blog: on-topic posts (Instagram Stories, scroll-stopping content, leaders' personal brands, grow online) | **Port in Phase 3** (CMS blog), rewritten, honest dates. Until then → 301 to closest page |
| Blog: off-topic design posts (typography, color, workspace, creative block, visual storytelling, brand identity, lifestyle duplicate) | **Drop**, 301 to `/` (or `/blog` once it exists) |
| Catalog / shop | **Drop** the pages, 301 to `/services` (political kit → `/industries/political-leaders`) |
| Everything in the §7 "do not carry over" list | **Drop** |

### 8.3 Redirect map (Phase 1 → `next.config.ts`, all `permanent: true`)

| Old URL | New URL |
| --- | --- |
| `/index.html` | `/` |
| `/about.html`, `/about` | `/about` *(new small page, real facts only; fallback `/how-it-works`)* |
| `/services.html` | `/services` |
| `/shop.html` | `/services` |
| `/contact.html` | `/contact` |
| `/blog.html` | `/` until Phase 3, then `/blog` |
| `/privacy-policy.html` | `/privacy-policy` |
| `/cookie-policy.html` | `/privacy-policy` |
| `/terms-of-services.html` | `/terms` |
| `/portfolio.html` | `/portfolio` |
| `/catalog/premium-political-campaign-social-media-kit(.html)` | `/industries/political-leaders` *(`/industries` until Phase 2c ships)* |
| `/catalog/instagram-content-pack(.html)` | `/platforms` |
| `/catalog/facebook-ad-creatives-package(.html)` | `/platforms` |
| `/catalog/premium-social-media-pack(.html)` | `/services` |
| other 7 `/catalog/*` (logo, brand guide, business card, visiting card, bags, packaging, web design) | `/services` |
| `/blog/Mastering-Instagram-Stories-for-Business-Growth(.html)`, `/blog/Creating-Scroll-Stopping-Social-Media-Content(.html)` | `/platforms` (→ ported post in Phase 3) |
| `/blog/How-Oryza-Builds-Personal-Brands-for-Leaders(.html)`, `/blog/How-Oryza-Helps-You-Establish-Your-Lifestyle-as-a-Brand(.html)` | `/industries` (→ ported post / `/industries/political-leaders`) |
| `/blog/Grow-Your-Business-Online(.html)` | `/how-it-works` |
| other 6 `/blog/*` | `/` (→ `/blog` in Phase 3) |
| `/img/logo.png` | not redirected. Returns 404 (old logo must not live on) |

A Phase 1 test will load this list and check that every old URL either redirects or matches a real route.

### 8.4 Zero-downtime cutover (no DNS change needed)
Old and new both run on Vercel, so the switch is a **domain move between two Vercel projects**. The Cloudflare records (`CNAME` → Vercel) stay exactly as they are, and **MX/SPF are never touched**.

1. **Before the cutover:** verify `oryzaonline.in` as a Search Console **Domain property** (TXT in Cloudflare; harmless to the live site). Export Supabase subscribers. Lower nothing (Cloudflare proxied records already have short TTLs).
2. Create a **new Vercel project** `oryza-web` from the same GitHub repo, **Root Directory = `oryza-web`**, production branch `new-site` (or `main` after merge). Set all env vars. Test on its `*.vercel.app` URL: forms deliver, redirects work (run the redirect test against the preview), Lighthouse, mobile, WCAG checks.
3. **Cutover (~1 minute):** in Vercel, remove `www.oryzaonline.in` + `oryzaonline.in` from the old project and add them to `oryza-web`, keeping www as primary and the apex redirecting to www as today. Purge the Cloudflare cache. Spot-check 10 old URLs for 301s.
4. **Post-launch:** submit `/sitemap.xml` in Search Console, run URL inspection on key pages, update the website link on the Google Business Profile, send a test lead.
5. **Rollback (~1 minute):** move the two domains back to the old Vercel project, which stays untouched and keeps its last deployment. Nothing is deleted until you confirm the new site is stable. Only then does the old code move into `/_old-site` (Phase 1.8), and the old Vercel project can be paused.

Full steps go into `/oryza-web/docs/deploy.md` in Phase 1.

---

## Decisions needed from you before Phase 1
1. **Repo layout:** OK to move the new app into `/oryza-web/` and work on a `new-site` branch (§8.1)?
2. **Correct PIN code** (209214 or 208001) and the street address, hours, WhatsApp number (same as +91 7007345134?), social profile URLs, legal entity / GST.
3. **Which old services do you still sell?** (logo, print, bags, packaging, web design, ad creatives, workshops)
4. **Newsletter:** keep it (needs a server-side route + email provider) or drop it? Either way, export the Supabase list.
5. **Real work, team or testimonials:** do you have any to supply? Otherwise `/portfolio` launches empty, and the site carries no testimonials or team section.
6. **Analytics IDs:** GA4? Meta Pixel? Do you have Search Console access already?
7. **Interim fix to the live site:** should the fake contact form, fake reviews and fake testimonials on the live site be fixed or removed *now*, before the new site is ready? (That would mean modifying old-site files, so it needs your explicit OK.)
