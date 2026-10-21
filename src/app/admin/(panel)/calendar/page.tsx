import Link from "next/link";
import { AdminTitle } from "@/components/admin/AdminShell";
import { CalendarBoard, type CalendarMode } from "@/components/admin/ops/CalendarBoard";
import { Badge, btnText } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients, listItems, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { loadWarnings } from "@/lib/admin/team-data";
import { dayOf } from "@/lib/engine/dates";
import { viewRange } from "@/lib/ops/calendar";
import { todayIST } from "@/lib/ops/deadlines";
import { daysFrom } from "@/lib/ops/team";

export const metadata = { title: "Calendar" };

type SP = { view?: string; date?: string; client?: string; platform?: string; format?: string; stage?: string; assignee?: string; category?: string };
const clean = (v?: string) => (v && /^[\w@.+-]{1,80}$/.test(v) ? v : undefined);
const MODES: CalendarMode[] = ["month", "week", "day", "list", "board"];

/** Every client's content: Month · Week · Day · List · Board. */
export default async function Calendar({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayIST();
  const view: CalendarMode = MODES.includes(sp.view as CalendarMode) ? (sp.view as CalendarMode) : "month";
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const range = viewRange(view === "list" || view === "board" ? "week" : view, anchor);
  const [clients, items, shoots, team] = await Promise.all([listClients(), listItems(range), listShoots(range), listTeam()]);
  const [warnings, tasks] = await Promise.all([
    loadWarnings(range, daysFrom(range.from, dayOf(range.from, range.to))),
    listTasks({ to: "9999-12-31", itemIds: items.map((x) => x.id), openOnly: true }),
  ]);
  return (
    <>
      <AdminTitle title="Calendar" />
      {warnings.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-bad/25 bg-bad-bg/50 px-4 py-2 text-[14px]">
          <Badge tone="bad" dot={false}>{warnings.length} warning{warnings.length > 1 ? "s" : ""}</Badge>
          <span className="min-w-0 flex-1 basis-60">{warnings[0].message}</span>
          <Link href={`/admin/team?week=${range.from}`} className={btnText}>Review</Link>
        </div>
      )}
      <CalendarBoard
        view={view}
        modes={MODES}
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
