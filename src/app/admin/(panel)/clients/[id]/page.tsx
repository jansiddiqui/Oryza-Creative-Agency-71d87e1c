import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, fmtWhen } from "@/components/admin/AdminShell";
import { CalendarBoard } from "@/components/admin/ops/CalendarBoard";
import { ClientDetails, OnboardingChecklist, ShootList } from "@/components/admin/ops/ClientPanels";
import { TaskCard } from "@/components/admin/ops/TodayBoard";
import { ApprovalLinks, SendForApproval } from "@/components/admin/ops/ApprovalPanel";
import { BillingPanel } from "@/components/admin/ops/BillingPanel";
import { approvalUrl, listApprovalLinks } from "@/lib/admin/approvals-data";
import { getBilling, listInvoices } from "@/lib/admin/billing-data";
import { listReports } from "@/lib/admin/reports-data";
import { addDays } from "@/lib/engine/dates";
import { linkSecret } from "@/lib/ops/links";
import { approvalNudgeText, approvalReminderDue } from "@/lib/ops/reminders";
import { monthLabel, monthStart } from "@/lib/ops/report";
import { btn, btnGhost, catLabel, ClientDot, Empty, fmtDay, Section } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { clientActivity, getClient, listItems, listOnboarding, listPlans, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { packages } from "@/lib/engine/packages";
import { viewRange, type CalendarView } from "@/lib/ops/calendar";
import { todayIST } from "@/lib/ops/deadlines";
import { CLIENT_STATUSES } from "@/lib/ops/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const metadata = { title: "Client" };

const actionLabel: Record<string, string> = {
  "client.create": "Client created",
  "client.update": "Details updated",
  "plan.generate": "Plan generated",
  "plan.edit": "Plan draft edited",
  "plan.approve": "Plan approved",
  "item.move": "Item moved",
  "item.update": "Item updated",
  "task.update": "Task updated",
  "shoot.update": "Shoot day updated",
  "onboarding.update": "Onboarding updated",
  "approval.create": "Approval link created",
  "approval.send": "Approval link shared",
  "approval.revoke": "Approval link revoked",
  "client.approved": "Client approved",
  "client.changes_requested": "Client requested changes",
  "reminder.sent": "Reminder sent",
  "shoot.move": "Shoot moved",
  "shot.update": "Shot ticked",
  "asset.add": "File added",
  "asset.remove": "File removed",
  "report.update": "Report updated",
  "report.share": "Report shared",
  "billing.update": "Fees updated",
  "invoice.update": "Invoice updated",
};

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; date?: string; platform?: string; format?: string; stage?: string; assignee?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const client = await getClient(id);
  if (!client) notFound();
  const today = todayIST();
  const view: CalendarView = sp.view === "week" || sp.view === "day" ? sp.view : "month";
  const anchor = sp.date && ISO.test(sp.date) ? sp.date : today;
  const range = viewRange(view, anchor);
  const [plans, onboarding, items, shoots, allShoots, openTasks, team, activity] = await Promise.all([
    listPlans(id),
    listOnboarding(id),
    listItems(range, id),
    listShoots(range, id),
    listShoots({ from: "2000-01-01", to: "9999-12-31" }, id),
    listTasks({ to: "9999-12-31", clientId: id, openOnly: true }),
    listTeam(),
    clientActivity(id),
  ]);
  const itemsForTasks = await listItems({ from: "2000-01-01", to: "9999-12-31" }, id);
  const isOwner = admin.role === "owner";
  // Fee and invoice events stay with the owners.
  const visibleActivity = isOwner ? activity : activity.filter((a) => a.action !== "billing.update" && a.action !== "invoice.update");
  const [links, reports, billing, invoices] = await Promise.all([
    listApprovalLinks(id),
    listReports(id),
    isOwner ? getBilling(id) : null,
    isOwner ? listInvoices(id) : [],
  ]);
  const now = new Date();
  const secret = linkSecret();
  const linkSummaries = links.map((l) => ({
    id: l.id,
    label: l.label,
    url: l.url,
    itemCount: l.itemIds.length,
    responses: l.responses,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
    revokedAt: l.revokedAt,
    firstResponseAt: l.firstResponseAt,
    lastRemindedAt: l.lastRemindedAt,
    reminderDue: approvalReminderDue(l, now),
    nudge: secret ? approvalNudgeText(client.contactPerson || client.name, approvalUrl(l, secret)) : "",
  }));
  const upcoming = itemsForTasks.filter((x) => x.date >= today && x.date <= addDays(today, 60)).map((x) => ({ id: x.id, title: x.title, date: x.date, platform: x.platform, format: x.format, clientApproved: x.clientApproved }));
  const thisMonth = monthStart(today);
  const reportMonths = [...new Set([thisMonth, monthStart(addDays(thisMonth, -1)), ...reports.map((r) => r.month)])].sort().reverse();
  const recorded = new Set(reports.map((r) => r.month));
  const itemById = new Map(itemsForTasks.map((x) => [x.id, x]));
  const current = plans.find((p) => p.monthStart <= today && p.status === "approved") ?? plans[0];
  const lite = { id: client.id, name: client.name, category: client.category, colour: client.colour, status: client.status };

  return (
    <>
      <AdminTitle
        title={<span className="flex items-center gap-3"><ClientDot colour={client.colour} size={14} /> {client.name}</span>}
        intro={`${catLabel(client.category)} · ${packages[client.package]?.name} · ${CLIENT_STATUSES.find((s) => s.id === client.status)?.label} · client since ${fmtDay(client.startDate)}${client.renewalDate ? ` · renews ${fmtDay(client.renewalDate)}` : ""}`}
        actions={current && <Link href={`/admin/clients/${id}/plans/${current.id}`} className={btn}>{current.status === "draft" ? "Edit draft plan" : "Open current plan"}</Link>}
      />
      <nav aria-label="On this page" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 text-[13px] font-semibold sm:mx-0 sm:px-0">
        {[["overview", "Overview"], ["onboarding", "Onboarding"], ["plans", "Plans"], ["approvals", "Approvals"], ["calendar", "Calendar"], ["tasks", "Tasks"], ["shoots", "Shoot days"], ["reports", "Reports"], ...(isOwner ? [["billing", "Billing"]] : []), ["activity", "Activity"]].map(([h, l]) => (
          <a key={h} href={`#${h}`} className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 hover:border-ink">{l}</a>
        ))}
      </nav>

      <div id="overview" className="scroll-mt-6"><Section title="Overview"><ClientDetails client={client} /></Section></div>
      <div id="onboarding" className="scroll-mt-6"><Section title="Onboarding checklist"><OnboardingChecklist items={onboarding} /></Section></div>
      <div id="plans" className="scroll-mt-6">
        <Section title="Plans" count={plans.length}>
          {plans.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
              {plans.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 p-4 text-[14px]">
                  <span className="flex-1 font-semibold">From {fmtDay(p.monthStart)} · {p.draft.items.length} items</span>
                  <span className="text-[13px] text-muted">{p.status === "approved" ? `Approved ${fmtWhen(p.approvedAt)} by ${p.approvedBy}` : "Draft"}</span>
                  <Link href={`/admin/clients/${id}/plans/${p.id}`} className={btnGhost}>{p.status === "draft" ? "Edit" : "View"}</Link>
                </li>
              ))}
            </ul>
          ) : <Empty>No plans yet.</Empty>}
        </Section>
      </div>
      <div id="approvals" className="scroll-mt-6">
        <Section title="Client approvals">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[15px] font-semibold">Send for approval</h3>
              <SendForApproval clientId={id} clientName={client.contactPerson || client.name} clientPhone={client.phone} clientEmail={client.email} items={upcoming} today={today} />
            </div>
            <div>
              <h3 className="mb-2 text-[15px] font-semibold">Links sent</h3>
              <ApprovalLinks links={linkSummaries} clientName={client.contactPerson || client.name} clientPhone={client.phone} clientEmail={client.email} now={now.toISOString()} />
            </div>
          </div>
        </Section>
      </div>
      <div id="calendar" className="scroll-mt-6">
        <Section title="Calendar">
          <CalendarBoard view={view} anchor={anchor} today={today} items={items} tasks={openTasks} shoots={shoots} clients={[lite]} team={team} filters={{ client: id, platform: sp.platform, format: sp.format, stage: sp.stage, assignee: sp.assignee }} basePath={`/admin/clients/${id}`} lockedClient={id} />
        </Section>
      </div>
      <div id="tasks" className="scroll-mt-6">
        <Section title="Open tasks" count={openTasks.length}>
          {openTasks.length ? (
            <ul className="grid gap-2 lg:grid-cols-2">{openTasks.slice(0, 60).map((t) => <TaskCard key={t.id} task={t} item={itemById.get(t.itemId)} client={lite} team={team} today={today} />)}</ul>
          ) : <Empty>No open tasks.</Empty>}
          {openTasks.length > 60 && <p className="mt-2 text-[13px] text-muted">Showing the first 60 by due date.</p>}
        </Section>
      </div>
      <div id="shoots" className="scroll-mt-6"><Section title="Shoot days" count={allShoots.length}><ShootList shoots={allShoots} clientId={id} team={team} /></Section></div>
      <div id="reports" className="scroll-mt-6">
        <Section title="Monthly reports">
          <ul className="flex flex-wrap gap-2">
            {reportMonths.map((m) => (
              <li key={m}><Link href={`/admin/clients/${id}/reports/${m.slice(0, 7)}`} className={btnGhost}>{monthLabel(m)}{recorded.has(m) ? "" : " · start"}</Link></li>
            ))}
          </ul>
        </Section>
      </div>
      {isOwner && billing && (
        <div id="billing" className="scroll-mt-6">
          <Section title="Billing (owners only)">
            <BillingPanel clientId={id} monthlyFee={billing.monthlyFee} optimizationFee={billing.optimizationFee} invoices={invoices} today={today} nextNumber={`ORY-${today.slice(0, 7).replace("-", "")}-${String(invoices.length + 1).padStart(2, "0")}`} />
          </Section>
        </div>
      )}
      <div id="activity" className="scroll-mt-6">
        <Section title="Activity">
          {visibleActivity.length ? (
            <ol className="space-y-1.5 text-[14px]">
              {visibleActivity.map((a, i) => (
                <li key={i} className="flex flex-wrap gap-x-2"><span className="text-muted">{fmtWhen(a.at)}</span><span className="font-semibold">{actionLabel[a.action] ?? a.action}</span><span className="text-muted">by {a.actor}</span></li>
              ))}
            </ol>
          ) : <Empty>No activity yet.</Empty>}
        </Section>
      </div>
    </>
  );
}
