import { AdminTitle } from "@/components/admin/AdminShell";
import { CalendarBoard } from "@/components/admin/ops/CalendarBoard";
import { WarningsPanel } from "@/components/admin/ops/WarningsPanel";
import { loadWarnings } from "@/lib/admin/team-data";
import { daysFrom } from "@/lib/ops/team";
import { dayOf } from "@/lib/engine/dates";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients, listItems, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { viewRange, type CalendarView } from "@/lib/ops/calendar";
import { todayIST } from "@/lib/ops/deadlines";

export const metadata = { title: "Calendar" };

type SP = { view?: string; date?: string; client?: string; platform?: string; format?: string; stage?: string; assignee?: string; category?: string };
const clean = (v?: string) => (v && /^[\w@.+-]{1,80}$/.test(v) ? v : undefined);

export default async function Calendar({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayIST();
  const view: CalendarView = sp.view === "week" || sp.view === "day" ? sp.view : "month";
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const range = viewRange(view, anchor);
  const [clients, items, shoots, team] = await Promise.all([listClients(), listItems(range), listShoots(range), listTeam()]);
  const warnings = await loadWarnings(range, daysFrom(range.from, dayOf(range.from, range.to)));
  const tasks = await listTasks({ to: "9999-12-31", itemIds: items.map((x) => x.id), openOnly: true });
  return (
    <>
      <AdminTitle title="Calendar" intro="Every client's content in one place. Click an item for details or to move it; on a computer you can also drag it to another day." />
      <WarningsPanel warnings={warnings} />
      <CalendarBoard
        view={view}
        anchor={anchor}
        today={today}
        items={items}
        tasks={tasks}
        shoots={shoots}
        clients={clients.map(({ id, name, category, colour, status }) => ({ id, name, category, colour, status }))}
        team={team}
        filters={{ client: clean(sp.client), platform: clean(sp.platform), format: clean(sp.format), stage: clean(sp.stage), assignee: clean(sp.assignee), category: clean(sp.category) }}
      />
    </>
  );
}
