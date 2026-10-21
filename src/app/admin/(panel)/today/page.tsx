import { AdminTitle, Notice } from "@/components/admin/AdminShell";
import { TodayBoard } from "@/components/admin/ops/TodayBoard";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients, listItems, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { loadWarnings } from "@/lib/admin/team-data";
import { listLeads } from "@/lib/leads";
import { addDays } from "@/lib/engine/dates";
import { todayIST } from "@/lib/ops/deadlines";
import { daysFrom } from "@/lib/ops/team";
import type { TodayFilter } from "@/lib/ops/today";

export const metadata = { title: "Today" };

const FILTERS: TodayFilter[] = ["overdue", "today", "next", "client", "shoots", "leads"];
const hello = (now = new Date()) => {
  const h = new Date(now.getTime() + 5.5 * 3600_000).getUTCHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** The admin home. */
export default async function Today({ searchParams }: { searchParams: Promise<{ who?: string; f?: string; denied?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const today = todayIST();
  const days = daysFrom(today, 4);
  const [tasks, items, shoots, clients, team, leads, warnings] = await Promise.all([
    listTasks({ to: addDays(today, 3), openOnly: true }),
    listItems({ from: addDays(today, -60), to: addDays(today, 40) }),
    listShoots({ from: today, to: today }),
    listClients(),
    listTeam(),
    listLeads({ status: "new", limit: 10 }).catch(() => []),
    loadWarnings({ from: days[0], to: days[3] }, days),
  ]);
  const waiting = items.filter((x) => x.stage === "client_review");
  const approvalTasks = waiting.length ? await listTasks({ to: "9999-12-31", itemIds: waiting.map((x) => x.id), openOnly: true }) : [];
  const awaiting = waiting.map((item) => ({ item, task: approvalTasks.find((t) => t.itemId === item.id && t.step === "client_approval") ?? null }));
  const name = team.find((m) => m.email === admin.email)?.name ?? admin.email.split("@")[0];
  return (
    <>
      <AdminTitle title={`${hello()}, ${name}`} intro={`${clients.filter((c) => c.status === "active").length} active clients`} />
      {sp.denied === "1" && <div className="mb-4"><Notice tone="error">That page is for owners only.</Notice></div>}
      <TodayBoard
        tasks={tasks}
        items={[...items, ...awaiting.map((a) => a.item).filter((x) => !items.includes(x))]}
        shoots={shoots}
        clients={clients.map(({ id, name, category, colour, status }) => ({ id, name, category, colour, status }))}
        team={team}
        me={admin.email}
        today={today}
        initialMine={sp.who === "me"}
        leads={leads.map((l) => ({ id: l.id, name: l.name, business: l.business, source: l.source, createdAt: l.createdAt }))}
        awaiting={awaiting}
        warnings={warnings}
        initialFilter={FILTERS.includes(sp.f as TodayFilter) ? (sp.f as TodayFilter) : undefined}
      />
    </>
  );
}
