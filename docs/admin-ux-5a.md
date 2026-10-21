# Phase 5A — admin UI/UX upgrade

Admin only. Public pages, their JS and their CSS are byte-identical to `main`. The admin stylesheet is
`src/app/admin/(panel)/ops.css`. `globals.css` keeps admin, share, docs and migration code out of the public CSS, and
`src/styles/public-css-sources.frozen.txt` keeps the public output fixed. Business rules, permissions and RLS are
unchanged, with one exception: the offline-approval option below.

## App shell
- **Desktop:** a collapsible sidebar grouped into Work (Today, Calendar, Clients, Shoots, Team), Growth (Leads,
  Reports), Content (Images) and Business (Payments, Settings; owners only). The top bar has search, **New**,
  notifications (client approved or asked for changes, overdue tasks, new leads) and the user menu.
- **Command palette:** Ctrl/⌘+K jumps to any client, post, lead or shoot, or runs a command.
- **Keyboard:** press `?` for the full list. `G` then `T`/`C`/`B`/`K`/`L`/`S`/`R` goes to a page, `N C` adds a new
  client, and `J`/`K`/`Enter`/`X` work in lists. Shortcuts never fire while you are typing in a field.
- **Phone:** a bottom tab bar (Today, Calendar, Clients, Leads, More) and a floating **+** (upload from the camera to a
  post, add a note, add a client). Detail screens have a sticky action bar, and you can pull down to refresh.
- **Installable** (PWA): `public/admin-pwa/manifest.webmanifest`, scoped to `/admin/`, with no service worker and no
  offline cache. It is linked only from admin pages.
- **Home:** Today is the admin home page. `/admin` redirects to `/admin/today`.

## Screens
- **Today:** the summary cards show real counts and filter the list. Tasks are grouped by post, with one-tap
  Done / Start / Blocked (and Undo).
- **Posts:** open in a side drawer on desktop or a full-screen sheet on phones, with inline editing. A post's own URL
  still opens the full page.
- **Board view** (Calendar → Board, and on each client's Content tab). It follows the same rules as the rest of the
  app: a drag only does what the app already allows, such as starting or finishing the matching task. Moving a post
  backwards, or past a step that isn't done, is refused with the reason.
- **Calendar:** cleaner month and week views on desktop; on phones, an agenda with a week strip.
- **Lists** (Leads, Clients, Payments, Images, Shoots, Reports, Activity): sorting, saved views, bulk actions, a
  density toggle and sticky headers. They become cards on phones.
- **Client page:** split into tabs (Overview, Content, Approvals, Shoots, Reports, Billing for owners, Activity).
- **Settings:** split into tabs (Workload & working days, Deadlines, Team, Approvals).
- **New lists:** Shoots and Reports, built only from existing data.

## Feedback
- Reversible actions save straight away and show a toast with **Undo**.
- Confirmation dialogs remain only for actions that are destructive or can't be undone: deleting an invoice or an
  upload, revoking a link, approving a plan, moving a shoot, reassigning work, and removing a file.
- Also: skeleton loaders, an error page with "Try again", and helpful empty states.
- Inline validation, plus drafts that survive a reload (client details, captions and notes).
- Phones get 44 px tap targets and 16 px inputs (so iPhones don't zoom). Input borders have at least 3:1 contrast.
- No admin screen scrolls sideways at 390 px.

## Offline approval (the one rule change)
A team member can mark a post **"Approved by client via WhatsApp/call"**, from the board (drop on *Client approved*)
or from the post itself:
- They first confirm in a dialog that requires a short note (5–300 characters) and how the client approved (WhatsApp,
  phone call or in person).
- The post's approval task is marked done, and the activity log records `client.approved_offline` (who, when, note,
  channel).
- The post shows **"Approved offline by &lt;name&gt;"**.
- Owners can switch the option off in **Settings → Approvals** (`ops_settings.allow_offline_approval`, on by default).
  When it is off, only the client's approval link can approve a post.

Migration: `supabase/migrations/20261201000001_offline_approval.sql`.
