# Admin UX audit and design proposal (Phase 5A, step 1)

**Scope:** every screen under `/admin`, plus the two client-facing link pages. Screenshots were taken at 1440 px
(desktop) and 390 px (phone) from the production build, with realistic sample data:

- 3 clients on approved monthly plans
- 127 content items per month and their tasks
- shoots, leave, invoices and leads

No code was changed in this step.

**How problems are ranked:** by impact on daily work, which is how often the screen is used multiplied by how much
the problem slows people down or causes mistakes.

- **P1:** costs time every day, or causes errors
- **P2:** regular friction
- **P3:** polish

**Your own pain points:** the brief left the placeholder "[write what annoys you…]" unfilled. Tell me what annoys
you before step 2, and I'll put those first.

---

## 1. Cross-cutting findings (apply to every screen)

| # | Problem | Evidence | Rank |
|---|---|---|---|
| X1 | **Navigation doesn't scale.** 13 flat links: a tall sidebar on desktop, and a sideways-scrolling strip on phones where Leads, Images, Payments, Settings… are off-screen. There's no search, so finding a client or post means navigating to it. | All screens; phone screenshots show only 5 of 13 links | P1 |
| X2 | **No feedback layer.** Saves show inline grey text or a `Notice` box at the top of the page, often off-screen. There are 26 `router.refresh()` calls with no optimistic update, so the button freezes and nothing moves until the server replies. There is no Undo; 11 `window.confirm()` dialogs, several of them for reversible actions. | Today Done/Start, onboarding ticks, shot ticks, calendar moves | P1 |
| X3 | **No loading or error states.** No `loading.tsx` or `error.tsx` anywhere in `/admin`: navigation shows the old page until the new one arrives, and a failed query is a blank error. | All routes | P1 |
| X4 | **Tap targets too small on phones.** `btnSmall` is about 26 px high; calendar chips are about 30 px; the Today quick actions (Start/Done/Blocked) sit 8 px apart. The target is 44 px. | Today, client page, shoot list, item page | P1 |
| X5 | **Inputs zoom the page on iPhone.** Inputs are 14 px; iOS Safari zooms in on focus for anything under 16 px, which shifts the layout on every form. | All forms | P1 |
| X6 | **Input borders are almost invisible.** `#E3DCCD` on paper is a 1.29:1 contrast ratio; WCAG 1.4.11 requires 3:1. On the client overview, fields don't look like fields. | All forms | P2 |
| X7 | **Everything has the same weight.** Every button is a black or outlined pill, every section a rounded card with a 30 px serif heading, so the primary action rarely stands out. Disabled primary buttons drop to 2.3:1 contrast and look like a grey slab. | Client page, settings, report editor | P2 |
| X8 | **Long single-column pages.** Client page: 8,600 px on desktop, 25,000 px on phone. Today: 16,000 / 24,500 px. Plan editor: 11,800 / 14,800 px. The in-page chips scroll away. | Client page, Today, plan editor, settings | P1 |
| X9 | **Inconsistent components.** There are four badge styles (StatusBadge, LeadStatusBadge, StageBadge, TaskBadge), two filter patterns (chips that reload the page, and selects that push the URL), and three "save" patterns (form button, `onChange`, blur). Dates appear as both "Mon 2 Nov" and "02-11-2026". | Leads vs calendar vs images | P2 |
| X10 | **Empty states are bare.** "No items this week.", "Nothing overdue.": no explanation and no next step. The overview has no empty state for a brand-new account. | Today, clients, approvals | P3 |
| X11 | **No keyboard flow.** No shortcuts or command palette; dialogs (calendar item) have no focus trap or Escape-to-close; the drag-to-move calendar has no keyboard equivalent beyond the Move form. | Calendar, Today | P2 |
| X12 | **Sample-data warnings flood.** Warnings are a full red box at the top of Today, Calendar and Team (19 rows on the calendar in the sample), pushing the work itself below the fold. | Today, Calendar, Team | P1 |

## 2. Screen by screen (ordered by daily use)

### Today (`/admin/today`): used several times a day by everyone
1. **P1 — The overview of the day is buried.** The warnings box, then client pills, then a red "10 tasks are overdue"
   banner come before the first task. On a phone, the first task starts at 1,000 px.
2. **P1 — No filtering by what matters.** The counts per client are links to the client page, not filters. There's
   no one-tap "just mine due today" or "awaiting the client".
3. **P1 — Every action reloads the page.** Tapping Done waits for the server, then reorders the whole list, and the
   card you were looking at jumps. There's no Undo for an accidental Done.
4. **P2 — Cards are tall.** Each task takes 5 lines (title, meta line, 5 buttons). "Next 3 days" alone can be 40+
   cards.
5. **P2 — "Blocked" needs a reason, but the reason field appears inside the card and pushes everything down.**
6. **P3 — Tasks are not grouped by client or item,** so seven tasks for one reel are seven separate cards.

### Calendar (`/admin/calendar`): used daily by strategists and community managers
1. **P1 — Unusable on a phone.** The month view becomes an agenda 22,600 px long, with no week strip and no way to
   jump to a date. The filters (6 selects) open by default and fill the first screen.
2. **P1 — Chips are dense but uninformative.** Month cells show four 2-line chips plus "+7 more". Overdue is pink, but
   stage isn't visible in month view, and client colour is a 4 px left border that is hard to see.
3. **P2 — Opening an item is a modal with limited actions** (move only). Editing the caption or tasks means leaving
   the calendar for the item page.
4. **P2 — Filters cost a page reload per change, and active filters are hidden in a collapsed `<details>`** ("Filters
   (2 on)").
5. **P3 — No "today" scroll position.** The month view starts at the top of the month even late in the month.

### Client page (`/admin/clients/[id]`): used daily by account owners
1. **P1 — Breaks on phones.** The "Send for approval" column forces the page to 1,022 px wide, so it scrolls sideways.
   The cause is long, unwrappable item rows in a grid column without `min-width: 0`.
2. **P1 — Too much scrolling.** 11 stacked sections (overview form, onboarding, plans, approvals, calendar, tasks,
   shoots, reports, billing, activity) on one page. What you need most (open tasks, approvals waiting, next
   publishing dates) is below the fold, under a full edit form.
3. **P1 — Everything is shown in edit mode.** The overview is 11 editable fields shown permanently. Reading a phone
   number means scanning an input grid; it's easy to change something by accident.
4. **P2 — There's no status-at-a-glance header** (e.g. "3 overdue · 6 awaiting approval · renews in 9 days · ₹25,000
   due"). The header line is a run-on sentence.
5. **P2 — Approval links show the full raw URL** in a monospaced box on every card.

### Content item (`/admin/items/[id]`): used many times a day by designers and editors
1. **P1 — It's a separate page.** You have to leave the calendar or Today to open it, and come back afterwards.
2. **P2 — Hook and CTA are read-only text,** while the caption is editable here; title, hook and CTA can only be edited
   in the plan editor before approval.
3. **P2 — The tasks column repeats the item title on every task** ("Script — How to reach us and where to park"),
   with full action rows.
4. **P2 — Uploads have no progress bar** ("Uploading file.jpg…" only) and no drag-and-drop.
5. **P3 — There's no previous/next item navigation** for working through a week.

### Leads (`/admin/leads`): used daily by the owner
1. **P1 — Every lead is a full card with an always-open edit form** (status, notes, save). Ten leads fill several
   screens; there's no compact list.
2. **P2 — Status filters are chips with no counts.** There's no sorting (newest only), no bulk status change, and no
   "follow up today".
3. **P2 — Saving needs a separate Save button per card,** and the disabled Save looks like a big grey bar.
4. **P2 — "Convert to client" (the key action) is visually weaker** than WhatsApp and Call.
5. **P3 — Plan answers are a raw JSON `<pre>`** inside "Message and plan".

### Plan editor (`/admin/clients/[id]/plans/[planId]`)
1. **P1 — 127 items in one long list** (11,800 px). There's no week grouping, no filter by platform or format, and
   no "show only items with warnings".
2. **P2 — The sticky toolbar crowds together** Save, Approve and Next month (date input + button) on phones.
3. **P3 — Expanding an item shifts everything below it.**

### Team (`/admin/team`)
1. **P2 — The workload grid scrolls sideways on phones** (inside its container; that part is acceptable), and the
   capacity cells ("10 · 12 h over 6 h") wrap to 3 lines.
2. **P2 — The leave and reassign forms take more space than the grid itself.**
3. **P3 — The warnings duplicate the grid** (the same over-capacity days appear twice).

### Shoot page and shoot sheet
1. **P2 — The shot list has 20+ checkboxes** with no grouping toggle and no "hide done".
2. **P2 — The details form is always in edit mode** (as on the client page).
3. **P3 — The sheet's WhatsApp text is long;** there's no "copy text" option.

### Images (`/admin/images`) and slot page
1. **P2 — Grid cards are large** (32 slots = 4,250 px on desktop, 11,400 px on phone). There's no compact or list
   view, and no "needs review first" sort.
2. **P2 — Filters need a separate "Filter" button press.**
3. **P3 — On the slot page, Prompt and Review sit side by side** with very different heights.

### Payments, Settings, Users, Activity, Account, Overview
- **Payments (P2):** good summary, but there's no way to mark an invoice paid from the list (you have to go to the
  client page), and the amounts aren't aligned in a table.
- **Settings (P2):**
  - It's one 5,000 px page (11,400 px on phone) with 12 deadline-rule groups. It needs tabs (Workload ·
    Deadlines · Team · Working days).
  - Each group has its own Save button, with no "unsaved changes" warning.
- **Users (P3):** the role select and "Switch off access" sit far apart on phone.
- **Activity (P3):**
  - It's an unfiltered list of 200 entries, with no filter by client or person.
  - Actions show raw ids ("lead 2").
- **Account (P3):** fine; it could live in the user menu.
- **Overview (P2):** three image/lead stat tiles that duplicate Today. Recommend making the new Home/Today the
  landing page.

### Client approval page and shared report (client-facing)
- Both work well on phones. **P3:** the approval page could show a progress bar ("2 of 4 answered").
- **Report editor (admin) breaks on phones:** the "Top 3 posts" dropdowns push the page to 489 px. The long option
  labels set the select's width.

---

## 3. Proposed admin design system

The aim is a calm, neutral work surface with brand accents: ink for primary actions, gold for focus and the current
location, and Fraunces only where it helps hierarchy. Every colour pair below was measured; ratios are against the
background they're used on.

### 3.1 Colour tokens

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--canvas` | `#F6F4EF` | App background (slightly cooler than the public paper) | — |
| `--surface` | `#FFFFFF` | Cards, tables, drawers, inputs | — |
| `--surface-2` | `#EFEDE6` | Hover rows, toolbars, subtle panels | — |
| `--border` | `#E3DFD5` | Dividers between rows and cards (decorative) | — |
| `--border-strong` | `#8E968F` | **Input and checkbox borders** | 3.04:1 on surface ✓ (non-text 3:1) |
| `--text` | `#13201C` (brand ink) | Primary text | 15.3:1 on canvas ✓ |
| `--text-2` | `#3B4743` | Secondary text | 9.7:1 ✓ |
| `--muted` | `#5E6763` | Meta, labels, timestamps | 5.8:1 on surface, 5.3:1 on canvas ✓ |
| `--placeholder` | `#6B7471` | Placeholders (always with a visible label) | 4.8:1 ✓ |
| `--primary` | `#13201C` ink | Primary buttons (text `#FBF8F1`, 15.8:1) | ✓ |
| `--accent` | `#B9811A` gold-500 | Focus ring, selected tab underline, active nav marker | 3.4:1 (non-text) ✓ |
| `--accent-text` | `#8F5E0A` gold-700 | Gold text on white (links in brand moments) | 5.6:1 ✓ |
| `--sidebar` | `#13201C` | Desktop sidebar (kept from today, brand) | nav text `#C9CCC6` 10.3:1 ✓, active `#E8B84A` 9.1:1 ✓ |

**Status colours.** These are reserved for meaning and always shown with a label or icon, never colour alone.

| Status | Text | Background | Ratio | Used for |
|---|---|---|---|---|
| success | `#1E6B45` | `#E4F3EA` | 5.6:1 | Approved, paid, done |
| warning | `#7A4E00` | `#FBEFD3` | 6.3:1 | Due today, waiting for the client, changes requested |
| danger | `#A8261B` | `#FCE9E7` | 6.1:1 (7.1:1 on white) | Overdue, blocked, clash |
| info | `#1F5A9E` | `#E6EEF9` | 6.0:1 | In production, scheduled |
| violet | `#5B3F96` | `#EEE8F8` | 6.8:1 | Scheduled (stage only) |
| neutral | `#4A5450` | `#EEECE6` | 6.6:1 | Planned, draft, off |

**Stage mapping (one badge component):**

| Stage | Colour |
|---|---|
| Planned | neutral |
| In production | info |
| With client | warning |
| Client approved | success |
| Scheduled | violet |
| Published / Done | ink badge (`#13201C` on `#E8E6E0`) |

**Priority:**

| Priority | Colour | Marker |
|---|---|---|
| Overdue | danger | 4 px left rule plus an "Overdue" label |
| Due today | warning | |
| Next 3 days | neutral | |

**Client colours** stay as they are (the 10 existing hues). They are used as a dot or a 3 px bar, never as text.

### 3.2 Type

| Role | Font | Size / line height | Weight |
|---|---|---|---|
| Page title | Fraunces | 28/34 desktop · 24/30 phone | 500 |
| Section title | Fraunces | 18/24 | 500 |
| Card / drawer title | Manrope | 16/22 | 650 |
| Body / UI | Manrope | 14/20 desktop · **16/24 on phone inputs** (stops iOS zoom) | 450 |
| Secondary / meta | Manrope | 13/18 | 450 |
| Caption / badge | Manrope | 12/16 | 600 |
| Numbers (counts, money) | Manrope with tabular numbers | 24/28 for stat cards | 650 |

Serif headings drop from about 30 px to 18–28 px. Fraunces marks *where you are*; Manrope does the work.

### 3.3 Spacing, radius, elevation

- **Spacing:** a 4 px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48. Page padding is 24 px desktop and 16 px phone. Cards use
  16 px padding, table rows are 44 px (comfortable) or 36 px (compact).
- **Radius:**

  | Element | Radius |
  |---|---|
  | Controls | 8 px |
  | Cards and tables | 12 px |
  | Drawers, sheets, modals | 16 px |
  | Badges and avatars | full (pills) |

  Buttons stop being pills; this is the biggest single change to the overall feel.
- **Elevation:** borders by default. Shadows are only for floating layers:
  - `0 1px 2px` for sticky bars
  - `0 8px 24px` for menus, toasts and drawers
  - `0 24px 64px` for modals and the command palette
- **Motion:** 150 ms ease-out for hover and press, and 200 ms for drawers and sheets. All motion is off under
  `prefers-reduced-motion`.

### 3.4 Components

| Component | Spec |
|---|---|
| **Button** | Sizes: sm (32 px desktop only), md (40 px), lg (44 px, every touch layout). Variants: primary (ink), secondary (white + border-strong), ghost (text only), danger (only inside confirm dialogs). One primary per view. Disabled = 50% opacity on the *same* colours (no grey slab). |
| **Icon button** | 40 × 40 desktop, 44 × 44 touch; always has `aria-label` and a tooltip. |
| **Input / select / textarea** | 40 px high (44 on touch), 16 px text on phone, `--border-strong` border, gold 2 px focus ring. Label above, hint below, error in danger text with an icon. Inline validation on blur. |
| **Badge** | One component: `<Badge tone="success\|warning\|danger\|info\|violet\|neutral\|ink">`, 20 px high, 12 px text, optional dot. It replaces the four badge styles. |
| **Table** | Sticky header, sortable columns (aria-sort), row hover, checkbox column for bulk actions, density toggle (44 / 36 px). Below 768 px each row becomes a card with the same fields. |
| **Card** | White, 12 px radius, 16 px padding, optional header row with an action. |
| **Tabs** | Underline tabs (gold 2 px), scrollable on phone, URL-synced (`?tab=`) so back/forward works. |
| **Drawer (desktop)** | 520 px from the right, focus-trapped, Esc closes, URL-synced (`?item=…`). |
| **Sheet (phone)** | Full-height from the bottom, drag handle, sticky bottom action bar. |
| **Modal / confirm** | Only for destructive or irreversible actions (revoke link, delete invoice, approve plan). |
| **Toast** | Bottom-left (desktop) or above the tab bar (phone), 5 s, with **Undo** for reversible actions (Done, Start, move item, reassign, tick shot). `aria-live="polite"`. |
| **Empty state** | Icon, one sentence on why it's empty, and one primary next step ("No leads yet — share the plan builder link"). |
| **Skeleton** | Grey blocks matching the final layout (no shift), shown by `loading.tsx` per route. |
| **Stat card** | Count, label, delta or hint; clickable as a filter (pressed state with a gold underline). |
| **Command palette** | Ctrl/⌘+K, fuzzy search over clients, leads, items, shoots and actions; ↑↓ Enter; recent items first. |
| **Bottom tab bar (phone)** | Today · Calendar · Clients · Leads · More; 56 px high plus the safe-area inset; the floating "+" sits above it. |

### 3.5 Accessibility and performance rules

- WCAG AA contrast for every pair above. Every interactive element is reachable by keyboard, with a visible gold
  focus ring.
- 44 × 44 px minimum touch targets on touch layouts. Inputs are 16 px on phones.
- No layout shift: skeletons match final sizes, toasts float, drawers overlay.
- Drawers and sheets are lazy-loaded. No new dependencies beyond what is needed (drag and drop uses native pointer
  events). All admin CSS stays in the admin stylesheet, so public files stay byte-identical.

---

## 4. Mockups

Clickable static mockups of the five most-used screens, built with the tokens above, are in
[`docs/admin-ux/mockups/`](admin-ux/mockups/index.html). Open `index.html`; each page works at desktop width and on a
phone (resize the window, or open on a phone):

| Mockup | What to try |
|---|---|
| `today.html` | Summary cards filter the list; Done shows a toast with Undo; tasks are grouped by item; tap a task to open the item drawer or sheet. |
| `calendar.html` | Month and week on desktop; on a phone, a week strip with an agenda by day; click an item for the drawer. |
| `client.html` | Header with status-at-a-glance, tabs (Overview · Content · Approvals · Shoots · Reports · Billing), read mode with Edit. |
| `item.html` | The content item drawer and sheet: inline-editable caption, hook and CTA; files; tasks as a compact checklist; send for approval. |
| `leads.html` | Sortable table with bulk actions and density toggle on desktop; cards on a phone; side drawer for the lead. |

The mockups also show the shell: grouped collapsible sidebar, top bar with search, quick-create and notifications,
the command palette (Ctrl/⌘+K), and the phone tab bar with "+".

## 5. Proposed order for step 2

1. Shell (sidebar groups, top bar, phone tab bar, command palette, toasts, `loading.tsx` skeletons). This fixes X1,
   X2, X3 and X4 everywhere at once.
2. Today and the item drawer or sheet (the most-used flow).
3. Client page tabs plus the mobile overflow fix. Calendar mobile agenda.
4. Leads table, then the Clients, Payments and Images tables. Board view.
5. Remaining screens (settings tabs, plan editor grouping), PWA manifest, keyboard help.
