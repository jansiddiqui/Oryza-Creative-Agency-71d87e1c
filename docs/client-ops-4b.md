# Phase 4B: team workload, shoot planner, client approvals, reminders, reports, payments

Everything stays inside `/admin` with the same sign-in, allow-list, Row Level Security and activity log as before.
It is all rule-based (no AI calls). Two new kinds of page open **without a login** for clients:
`/share/approve/…` (approve posts) and `/share/report/…` (monthly report). Each one only works with a
signed link that expires after 7 days and can be revoked. They are never indexed, carry no analytics or
tracking, and are rate-limited per visitor.

## 1. Run the migration (once, about 2 minutes)

You need the earlier migrations already run (`20261020000001_admin_foundation.sql`, then
`20261101000001_client_ops.sql`).

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste all of `supabase/migrations/20261115000001_ops_team_approvals_reports.sql` → **Run**. You should see
   "Success. No rows returned".
3. Check **Table Editor**: these new tables exist, each with **RLS enabled**:
   `task_estimates` (12 rows), `team_leave`, `shoot_shots`, `approval_links`, `approval_responses`, `rate_limits`,
   `reminder_log`, `monthly_reports`, `report_links`, `client_billing`, `invoices`.
4. Check **Storage**: a new **private** bucket `client-assets` exists (designs and videos for approvals).
5. Optional check, SQL Editor: `select public.rate_hit('test', 2, 60);` returns `true` (you are the service role
   there); then `delete from public.rate_limits where key = 'test';`.

Nothing in the earlier migrations is changed or deleted. Three things are added or widened:

- new columns on `ops_settings`, `team_members` and `shoot_days`
- a wider activity-log action list
- the new storage bucket

## 2. New environment variables (Vercel → Project → Settings → Environment Variables)

| Name | What | Example |
| --- | --- | --- |
| `SHARE_LINK_SECRET` | Signs client approval and report links. At least 32 random characters. **Secret.** If you change it, every link sent so far stops working. | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `CRON_SECRET` | Vercel Cron sends it to `/api/cron/reminders`; anything else gets 401. At least 16 characters. **Secret.** | Generate the same way |
| `OPS_FROM_EMAIL` (optional) | Sender for digests and client emails. Defaults to `LEAD_FROM_EMAIL`. The domain must be verified in Resend. | `Oryza Creative Agency <team@oryzaonline.in>` |

Add them for **Production** (and Preview if you test there), then redeploy. `RESEND_API_KEY` from earlier is reused.
Never put these in a `NEXT_PUBLIC_` variable.

## 3. Reminders (Vercel Cron)

`vercel.json` schedules two daily runs (times in UTC):

| Cron | India time | What it sends |
| --- | --- | --- |
| `15 3 * * *` → `/api/cron/reminders` | **8:45 am IST** | Each team member's digest: their overdue tasks, tasks due today and shoots today. Also any approval reminders and renewal reminders due. |
| `30 12 * * *` → `/api/cron/reminders?only=approval` | 6:00 pm IST | Approval reminders only |

- **Digest:** only sent between 8:30 and 10:00 am IST, so a late retry never sends a stale one. It is not sent to
  people who are inactive, who opted out (**Settings → Team → Morning digest email**), or who have nothing to do.
- **Approval reminder:** sent once, 24 hours after a link was sent with no answer yet.
  - It emails the client the same link, if the client page has an email.
  - The client page also shows a ready **Send WhatsApp reminder** button for the team to send.
- **Renewal reminders:** emailed to every active owner 15, 7 and 1 day before a client's renewal date (not for
  ended clients).
- **Sent once:** every reminder is written to `reminder_log`, so a second run on the same day sends nothing twice.

After deploying, Vercel → Project → **Settings → Cron Jobs** should list both jobs. On the Hobby plan, Vercel runs
daily jobs within the scheduled hour, not to the minute.

## 4. What's new in the admin

- **Team** (`/admin/team`):
  - Shows open tasks and estimated hours per person per day.
  - Flags anyone over capacity.
  - Leave can be added with an option to hand that period's open tasks to someone else, and there is a separate
    bulk reassign tool.
- **Warnings** (Team, Today, Calendar and shoot pages) flag:
  - someone over their hours for a day
  - two shoots at the same time for one shooter
  - a shoot on the shooter's day off or leave
  - open tasks assigned to an inactive person or to someone on leave
- **Settings** (owners only):
  - estimated hours per task step
  - default hours per person per day
  - each person's own hours per day and their digest opt-out
- **Shoot page** (from the calendar, Today or the client page):
  - **Details:** location, time slot, shooter, the people and props needed, and consent reminders taken from the
    plan's compliance notes.
  - **Merged shot list:** the plan's shots plus one line per post the shoot feeds, with checkboxes. Ticking every
    shot for a post marks its shoot task done and moves its stage on.
  - **Moving the shoot:** shows which tasks would change before you confirm.
  - **Print / share with shooter** opens a phone-friendly sheet with a WhatsApp button.
- **Item page** (click any item):
  - caption draft, team notes and tasks
  - designs and videos, uploaded privately to `client-assets`; outside https links (Drive, Canva) also work
- **Client approvals** (client page or item page):
  1. Pick a week and tick the items to include.
  2. Press **Send for approval** to create the link.
  3. Copy it, send a prefilled WhatsApp message, or email it.

  The client sees each post with its caption, designs and compliance note, and can **Approve**, **Request
  changes** (with a comment) or **Approve all**. Each answer instantly does three things:
  - updates the item's stage and its "Client approval" task
  - appears in the activity log as "Client approved" or "Client requested changes"
  - shows on Today, if it was a change request

  Links can be revoked at any time.
- **Monthly reports** (client page → Reports):
  - The team types the real numbers per platform. Blank fields show as **"Not recorded"**, never as zero.
  - The system adds its own delivery stats (planned vs published, on-time %).
  - Charts are drawn only from the numbers entered.
  - Next month's focus and the top 3 posts can be added.
  - Share it with a 7-day link, or print / save it as a PDF.
- **Payments** (owners only, `/admin/billing`; "Payments" in the menu):
  - dues this month, overdue invoices and renewals in the next 30 days
  - each client page has an owner-only Billing section with fees and invoice records

  This is tracking only: no money moves through the site.

## 5. Who can see what

| | Visitors | Signed-in non-admin | Editor | Owner |
| --- | --- | --- | --- | --- |
| Leave, shots, approval links, reports | nothing | nothing | read + edit | read + edit |
| Client answers (`approval_responses`) | nothing (only through a valid link, via the server) | nothing | read | read |
| Task estimates, capacity | nothing | nothing | read | read + edit |
| Fees and invoices | nothing | nothing | **nothing** | read + edit |
| Rate limiter, reminder log | nothing | nothing | reminder log: read | reminder log: read |

## 6. Check it works

1. **Approval link:**
   1. Client page → **Send for approval** for this week. Open the link in a private window and approve one item.
   2. Back in the admin, the item shows "Client approved" and Activity shows "Client approved".
   3. Revoke the link; the private window now says the link has been switched off.
2. **Shoot page:** tick every shot for one reel. Its shoot task shows done on Today.
3. **Team:** add a day of leave for someone, handing their tasks to a colleague. The workload grid shows "Leave"
   that day and the tasks moved.
4. **Report:** enter two numbers and save. The preview shows them, and "Not recorded" everywhere else.
5. **Cron:** `curl -H "Authorization: Bearer $CRON_SECRET" https://www.oryzaonline.in/api/cron/reminders?only=approval`
   returns `{"ok":true,…}`. Without the header it returns 401.
