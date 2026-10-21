import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, fmtWhen } from "@/components/admin/AdminShell";
import { CalendarBoard } from "@/components/admin/ops/CalendarBoard";
import { ClientDetails, OnboardingChecklist, ShootList } from "@/components/admin/ops/ClientPanels";
import { TaskCard } from "@/components/admin/ops/TodayBoard";
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
};

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; date?: string; platform?: string; format?: string; stage?: string; assignee?: string }> }) {
  await requireAdmin();
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
        {[["overview", "Overview"], ["onboarding", "Onboarding"], ["plans", "Plans"], ["calendar", "Calendar"], ["tasks", "Tasks"], ["shoots", "Shoot days"], ["activity", "Activity"]].map(([h, l]) => (
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
      <div id="activity" className="scroll-mt-6">
        <Section title="Activity">
          {activity.length ? (
            <ol className="space-y-1.5 text-[14px]">
              {activity.map((a, i) => (
                <li key={i} className="flex flex-wrap gap-x-2"><span className="text-muted">{fmtWhen(a.at)}</span><span className="font-semibold">{actionLabel[a.action] ?? a.action}</span><span className="text-muted">by {a.actor}</span></li>
              ))}
            </ol>
          ) : <Empty>No activity yet.</Empty>}
        </Section>
      </div>
    </>
  );
}
