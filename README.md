# Oryza Creative Agency — website

The new oryza website: a public site, plus the rule-based **Plan Engine** that turns a visitor's answers into a detailed 30-day social media plan. It uses no AI and no external API.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Fonts: Fraunces (display) + Manrope (body), self-hosted via Fontsource
- Vitest for engine tests

## Run
```bash
npm install
cp .env.example .env.local   # fill in the values (see docs/deploy.md)
npm run dev                  # http://localhost:3000
npm test                     # plan engine tests
npm run build && npm start   # production
```

## Where things live
| Path | What |
| --- | --- |
| `src/data/categories.ts` | Business categories and the platform fit matrix (Core / Add / skip) |
| `src/data/platforms.ts` | Each platform's job, optimization checklist, monthly scope |
| `src/data/playbooks/school.ts` | School playbook: audiences, pillars, rules, template library |
| `src/data/calendar-india.ts` | National days, yearly festivals (update every year), month themes |
| `src/lib/engine/school-engine.ts` | Deterministic engine: tags → rules → slots → pinned dates → scoring → calendar |
| `src/components/planner/` | Plan builder questionnaire and plan view |
| `src/app/api/lead/route.ts` | Lead intake: email to contact@oryzaonline.in via Resend (database in Phase 3) |
| `src/lib/site.ts` | Business details. Real values are defaults, unknowns are TODO |
| `src/data/redirects.ts` | 301s from every old-site URL (tested in `redirects.test.ts`) |
| `src/components/Analytics.tsx` | GA4 + Microsoft Clarity, loaded only when their env IDs are set |
| `docs/old-site-audit.md` | Audit of the retired static site |
| `docs/deploy.md` | Env vars, Resend DNS, go-live, post-launch checks, rollback |

## Adding a new category playbook
1. Copy `src/data/playbooks/school.ts` and write the audiences, pillars, rules and 60+ templates.
2. Write that category's engine rules (pinned dates and questions), following `school-engine.ts`.
3. Set `plannerLive: true` for the category in `categories.ts` and add its industry page.

## Before launch
See `docs/deploy.md`. Open items:
- [ ] Street address + PIN, hours, WhatsApp number, social profile URLs (`src/lib/site.ts` / env)
- [ ] Resend domain verified and `RESEND_API_KEY` set, so leads arrive
- [ ] GA4 and Clarity IDs, Search Console verified
- [ ] Legal review of `/privacy-policy` and `/terms`
- [ ] Portfolio page only once real client work exists (no invented work)

## Roadmap
- **Phase 2:** shared engine core + playbooks for hospitals/clinics and doctors, real estate, political leaders, restaurants, coaching
- **Phase 3:** PostgreSQL (Supabase) + Payload CMS: saved plans and leads, editable playbooks, blog
- **Phase 4:** Admin panel — client workspaces, plan-to-task conversion, master calendar, Today view, content stages, team workload, shoot planner, client approvals
