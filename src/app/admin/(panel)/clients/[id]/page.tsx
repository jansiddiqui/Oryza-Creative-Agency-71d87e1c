import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, fmtWhen } from "@/components/admin/AdminShell";
import { ApprovalLinks, SendForApproval } from "@/components/admin/ops/ApprovalPanel";
import { BillingPanel } from "@/components/admin/ops/BillingPanel";
import { Board } from "@/components/admin/ops/Board";
import { CalendarBoard } from "@/components/admin/ops/CalendarBoard";
import { ClientDetails, OnboardingChecklist, ShootList } from "@/components/admin/ops/ClientPanels";
import { TaskRow } from "@/components/admin/ops/TaskRow";
import { Badge, btn, btnGhost, btnText, card, catLabel, ClientDot, Empty, fmtDay, formatLabel, PlatformGlyph, Section, StageBadge } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { approvalUrl, listApprovalLinks } from "@/lib/admin/approvals-data";
import { getBilling, listInvoices } from "@/lib/admin/billing-data";
import { clientActivity, getClient, listItems, listOnboarding, listPlans, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { listReports } from "@/lib/admin/reports-data";
import { addDays, dayOf } from "@/lib/engine/dates";
import { packages } from "@/lib/engine/packages";
import { inr, invoiceState } from "@/lib/ops/billing";
import { viewRange, type CalendarView } from "@/lib/ops/calendar";
import { todayIST } from "@/lib/ops/deadlines";
import { linkSecret } from "@/lib/ops/links";
import { approvalNudgeText, approvalReminderDue } from "@/lib/ops/reminders";
import { monthLabel, monthStart } from "@/lib/ops/report";
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
  "item.move": "Post moved",
  "item.update": "Post updated",
  "task.update": "Task updated",
  "shoot.update": "Shoot day updated",
  "onboarding.update": "Onboarding updated",
  "approval.create": "Approval link created",
  "approval.send": "Approval link shared",
  "approval.revoke": "Approval link revoked",
  "client.approved": "Client approved",
  "client.approved_offline": "Approved offline (WhatsApp/call)",
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

type Tab = "overview" | "content" | "approvals" | "shoots" | "reports" | "billing" | "activity";
type SP = { tab?: string; cv?: string; view?: string; date?: string; platform?: string; format?: string; stage?: string; assignee?: string };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const client = await getClient(id);
  if (!client) notFound();
  const isOwner = admin.role === "owner";
  const tabs: [Tab, string][] = [["overview", "Overview"], ["content", "Content"], ["approvals", "Approvals"], ["shoots", "Shoots"], ["reports", "Reports"], ...(isOwner ? ([["billing", "Billing"]] as [Tab, string][]) : []), ["activity", "Activity"]];
  const tab: Tab = tabs.some(([t]) => t === sp.tab) ? (sp.tab as Tab) : "overview";
  const today = todayIST();
  const base = `/admin/clients/${id}`;

  // Always: the header's "at a glance" numbers.
  const [openTasks, plans, team, window, links] = await Promise.all([
    listTasks({ to: "9999-12-31", clientId: id, openOnly: true }),
    listPlans(id),
    listTeam(),
    listItems({ from: addDays(today, -30), to: addDays(today, 60) }, id),
    listApprovalLinks(id),
  ]);
  const [billing, invoices] = await Promise.all([isOwner ? getBilling(id) : null, isOwner ? listInvoices(id) : []]);
  const overdue = openTasks.filter((t) => t.due < today).length;
  const waiting = window.filter((x) => x.stage === "client_review").length;
  const renewIn = client.renewalDate ? dayOf(today, client.renewalDate) - 1 : null;
  const overdueMoney = invoices.filter((i) => invoiceState(i, today) === "overdue").reduce((s, i) => s + i.amount, 0);
  const current = plans.find((p) => p.monthStart <= today && p.status === "approved") ?? plans[0];
  const itemById = new Map(window.map((x) => [x.id, x]));
  const lite = { id: client.id, name: client.name, category: client.category, colour: client.colour, status: client.status };
  const tabHref = (t: Tab) => `${base}${t === "overview" ? "" : `?tab=${t}`}`;

  let body: React.ReactNode = null;
  if (tab === "overview") {
    const onboarding = await listOnboarding(id);
    const next = [...openTasks].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
    const publishing = window.filter((x) => x.date >= today && x.stage !== "published" && x.stage !== "done").slice(0, 5);
    body = (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <section className={card} aria-labelledby="next-h">
            <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
              <h2 id="next-h" className="font-display text-[18px]">Next up</h2>
              <Link href={tabHref("content")} className={btnText}>All content</Link>
            </div>
            {next.length ? <ul>{next.map((t) => <TaskRow key={t.id} task={t} today={today} team={team} title={itemById.get(t.itemId)?.title} />)}</ul> : <p className="px-4 py-3 text-[14px] text-muted">No open tasks.</p>}
          </section>
          <OnboardingChecklist items={onboarding} />
        </div>
        <div className="min-w-0 space-y-5">
          <ClientDetails client={client} />
          <section className={card} aria-labelledby="up-h">
            <div className="flex items-center justify-between border-b border-edge px-4 py-2.5"><h2 id="up-h" className="font-display text-[18px]">Coming up</h2></div>
            {publishing.length ? (
              <ul className="divide-y divide-edge">
                {publishing.map((x) => (
                  <li key={x.id}><Link href={`/admin/items/${x.id}`} scroll={false} className="flex min-h-12 items-center gap-2 px-4 py-2 text-[14px] hover:bg-surface-2/60"><PlatformGlyph platform={x.platform} /><span className="min-w-0 flex-1 truncate">{fmtDay(x.date)} · {x.title}</span><StageBadge stage={x.stage} /></Link></li>
                ))}
              </ul>
            ) : <p className="px-4 py-3 text-[14px] text-muted">Nothing planned yet.</p>}
          </section>
          <section className={card} aria-labelledby="plans-h">
            <div className="flex items-center justify-between border-b border-edge px-4 py-2.5"><h2 id="plans-h" className="font-display text-[18px]">Plans</h2></div>
            {plans.length ? (
              <ul className="divide-y divide-edge">
                {plans.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[14px]">
                    <span className="min-w-0 flex-1 font-semibold">From {fmtDay(p.monthStart)} · {p.draft.items.length} posts</span>
                    {p.status === "approved" ? <Badge tone="ok">Approved</Badge> : <Badge tone="warn">Draft</Badge>}
                    <Link href={`${base}/plans/${p.id}`} className={btnText}>{p.status === "draft" ? "Edit" : "View"}</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-3 text-[14px] text-muted">No plans yet.</p>}
          </section>
        </div>
      </div>
    );
  } else if (tab === "content") {
    const cv = sp.cv === "board" || sp.cv === "calendar" ? sp.cv : "list";
    const seg = (v: string, l: string) => <Link href={`${base}?tab=content${v === "list" ? "" : `&cv=${v}`}`} aria-current={cv === v ? "page" : undefined} className={`flex min-h-10 items-center rounded-lg px-3 text-[13px] font-semibold md:min-h-8 ${cv === v ? "bg-surface shadow-sm" : "text-text-2"}`}>{l}</Link>;
    let inner: React.ReactNode;
    if (cv === "calendar") {
      const view: CalendarView = sp.view === "week" || sp.view === "day" ? sp.view : "month";
      const anchor = sp.date && ISO.test(sp.date) ? sp.date : today;
      const range = viewRange(view, anchor);
      const [items, shoots] = await Promise.all([listItems(range, id), listShoots(range, id)]);
      inner = <CalendarBoard view={view} anchor={anchor} today={today} items={items} tasks={openTasks} shoots={shoots} clients={[lite]} team={team} filters={{ client: id, platform: sp.platform, format: sp.format, stage: sp.stage, assignee: sp.assignee }} basePath={`${base}?tab=content&cv=calendar`} lockedClient={id} />;
    } else if (cv === "board") {
      inner = <Board items={window.filter((x) => x.date >= addDays(today, -14) && x.date <= addDays(today, 30))} clients={[lite]} today={today} />;
    } else {
      const list = window.filter((x) => x.date >= addDays(today, -7));
      const byDate = new Map<string, typeof list>();
      for (const x of list) byDate.set(x.date, [...(byDate.get(x.date) ?? []), x]);
      inner = list.length ? (
        <div className={`${card} overflow-hidden`}>
          {[...byDate.entries()].map(([d, xs]) => (
            <div key={d}>
              <p className={`border-t border-edge bg-surface-2/70 px-4 py-1.5 text-[13px] font-semibold first:border-t-0 ${d === today ? "text-gold-700" : ""}`}>{fmtDay(d)}{d === today && " · Today"}</p>
              <ul className="divide-y divide-edge">
                {xs.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/items/${x.id}`} scroll={false} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 hover:bg-surface-2/60">
                      <PlatformGlyph platform={x.platform} />
                      <span className="min-w-0 flex-1 basis-48"><span className="block truncate text-[14px] font-semibold">{x.title}</span><span className="text-[12px] text-muted">{formatLabel(x.format)} · {x.time}</span></span>
                      <StageBadge stage={x.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : <Empty title="No posts in this period">Approve a plan to fill the calendar.</Empty>;
    }
    body = (
      <>
        <div role="group" aria-label="View" className="mb-4 inline-flex rounded-[10px] bg-surface-2 p-[3px]">{seg("list", "List")}{seg("board", "Board")}{seg("calendar", "Calendar")}</div>
        {inner}
      </>
    );
  } else if (tab === "approvals") {
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
    const upcoming = window.filter((x) => x.date >= today).map((x) => ({ id: x.id, title: x.title, date: x.date, platform: x.platform, format: x.format, clientApproved: x.clientApproved }));
    body = (
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0" aria-labelledby="send-h"><h2 id="send-h" className="mb-2 font-display text-[18px]">Send for approval</h2><SendForApproval clientId={id} clientName={client.contactPerson || client.name} clientPhone={client.phone} clientEmail={client.email} items={upcoming} today={today} /></section>
        <section className="min-w-0" aria-labelledby="links-h"><h2 id="links-h" className="mb-2 font-display text-[18px]">Links sent</h2><ApprovalLinks links={linkSummaries} clientName={client.contactPerson || client.name} clientPhone={client.phone} clientEmail={client.email} now={now.toISOString()} /></section>
      </div>
    );
  } else if (tab === "shoots") {
    const shoots = await listShoots({ from: "2000-01-01", to: "9999-12-31" }, id);
    body = <ShootList shoots={shoots} clientId={id} team={team} />;
  } else if (tab === "reports") {
    const reports = await listReports(id);
    const thisMonth = monthStart(today);
    const months = [...new Set([thisMonth, monthStart(addDays(thisMonth, -1)), ...reports.map((r) => r.month)])].sort().reverse();
    const recorded = new Set(reports.map((r) => r.month));
    body = (
      <ul className={`${card} divide-y divide-edge`}>
        {months.map((m) => (
          <li key={m}><Link href={`${base}/reports/${m.slice(0, 7)}`} className="flex min-h-12 items-center gap-3 px-4 hover:bg-surface-2/60"><span className="flex-1 font-semibold">{monthLabel(m)}</span>{recorded.has(m) ? <Badge tone="ok">Recorded</Badge> : <Badge>Not started</Badge>}</Link></li>
        ))}
      </ul>
    );
  } else if (tab === "billing" && isOwner && billing) {
    body = (
      <Section title="Billing (owners only)">
        <BillingPanel clientId={id} monthlyFee={billing.monthlyFee} optimizationFee={billing.optimizationFee} invoices={invoices} today={today} nextNumber={`ORY-${today.slice(0, 7).replace("-", "")}-${String(invoices.length + 1).padStart(2, "0")}`} />
      </Section>
    );
  } else if (tab === "activity") {
    const activity = await clientActivity(id);
    // Fee and invoice events stay with the owners.
    const visibleActivity = isOwner ? activity : activity.filter((a) => a.action !== "billing.update" && a.action !== "invoice.update");
    body = visibleActivity.length ? (
      <ol className={`${card} divide-y divide-edge`}>
        {visibleActivity.map((a, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-[14px]"><span className="font-semibold">{actionLabel[a.action] ?? a.action}</span><span className="text-muted">by {a.actor} · {fmtWhen(a.at)}</span></li>
        ))}
      </ol>
    ) : <Empty>No activity yet.</Empty>;
  }

  return (
    <>
      <AdminTitle
        crumb={<><Link href="/admin/clients" className="hover:underline">Clients</Link> / {catLabel(client.category)}</>}
        title={<span className="flex items-center gap-3"><ClientDot colour={client.colour} size={14} />{client.name}</span>}
        intro={
          <span className="mt-1 flex flex-wrap gap-1.5">
            {overdue > 0 && <Link href={tabHref("overview")}><Badge tone="bad">{overdue} overdue</Badge></Link>}
            {waiting > 0 && <Link href={tabHref("approvals")}><Badge tone="warn">{waiting} awaiting approval</Badge></Link>}
            <Badge>{packages[client.package]?.name}{isOwner && billing?.monthlyFee ? ` · ${inr(billing.monthlyFee)} / month` : ""}</Badge>
            <Badge tone={client.status === "active" ? "ok" : "neutral"}>{CLIENT_STATUSES.find((s) => s.id === client.status)?.label}</Badge>
            {renewIn !== null && renewIn >= 0 && renewIn <= 45 && <Badge tone={renewIn <= 7 ? "warn" : "info"}>Renews in {renewIn} day{renewIn === 1 ? "" : "s"}</Badge>}
            {overdueMoney > 0 && <Link href={tabHref("billing")}><Badge tone="bad" dot={false}>{inr(overdueMoney)} overdue</Badge></Link>}
          </span>
        }
        actions={
          <span className="hidden gap-2 md:flex">
            {current && <Link href={`${base}/plans/${current.id}`} className={btnGhost}>{current.status === "draft" ? "Edit draft plan" : "Open plan"}</Link>}
            <Link href={tabHref("approvals")} className={btn}>Send for approval</Link>
          </span>
        }
      />
      <nav aria-label="Client sections" className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-edge px-4 md:mx-0 md:px-0">
        {tabs.map(([t, l]) => (
          <Link key={t} href={tabHref(t)} scroll={false} aria-current={tab === t ? "page" : undefined} className={`-mb-px flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-[14px] font-semibold ${tab === t ? "border-gold-500 text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {l}
            {t === "approvals" && waiting > 0 && <span className="ml-1.5 text-[12px] text-muted tabular-nums">{waiting}</span>}
          </Link>
        ))}
      </nav>
      {body}
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 flex gap-2 border-t border-edge bg-surface px-4 py-2 md:hidden">
        {current && <Link href={`${base}/plans/${current.id}`} className={`${btnGhost} flex-1`}>Open plan</Link>}
        <Link href={tabHref("approvals")} className={`${btn} flex-1`}>Send for approval</Link>
      </div>
    </>
  );
}
