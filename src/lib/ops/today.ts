/** The admin's morning screen: tasks and items grouped by urgency, with counts per client. Pure. */
import { addDays } from "@/lib/engine/dates";
import type { ItemRow, ShootRow, TaskRow } from "./types";

export interface TodayGroups {
  overdue: TaskRow[];
  dueToday: TaskRow[];
  next3: TaskRow[];
  publishing: ItemRow[];
  shoots: ShootRow[];
  /** Overdue + due-today task counts per client, highest first. */
  perClient: { clientId: string; overdue: number; today: number }[];
}

export function groupToday(
  tasks: TaskRow[],
  items: ItemRow[],
  shoots: ShootRow[],
  opts: { today: string; me?: string; mine?: boolean },
): TodayGroups {
  const mine = (t: TaskRow) => !opts.mine || t.assignee === opts.me;
  const open = tasks.filter((t) => t.status !== "done" && mine(t));
  const byDue = (a: TaskRow, b: TaskRow) => a.due.localeCompare(b.due) || a.time.localeCompare(b.time) || a.label.localeCompare(b.label);
  const until = addDays(opts.today, 3);
  const overdue = open.filter((t) => t.due < opts.today).sort(byDue);
  const dueToday = open.filter((t) => t.due === opts.today).sort(byDue);
  const next3 = open.filter((t) => t.due > opts.today && t.due <= until).sort(byDue);
  const publishing = items.filter((x) => x.date === opts.today && (!opts.mine || x.assignee === opts.me));
  const todaysShoots = shoots.filter((s) => s.date === opts.today && s.status !== "cancelled" && (!opts.mine || s.shooter === opts.me));
  const counts = new Map<string, { clientId: string; overdue: number; today: number }>();
  for (const t of [...overdue, ...dueToday]) {
    const c = counts.get(t.clientId) ?? { clientId: t.clientId, overdue: 0, today: 0 };
    if (t.due < opts.today) c.overdue++;
    else c.today++;
    counts.set(t.clientId, c);
  }
  const perClient = [...counts.values()].sort((a, b) => b.overdue - a.overdue || b.today - a.today || a.clientId.localeCompare(b.clientId));
  return { overdue, dueToday, next3, publishing, shoots: todaysShoots, perClient };
}

export type TodayFilter = "overdue" | "today" | "next" | "client" | "shoots" | "leads";

/** Tasks grouped by their post, posts ordered by their most urgent task (then by publish date). */
export function groupByItem<T extends Pick<TaskRow, "itemId" | "due" | "time">>(tasks: T[], items: Pick<ItemRow, "id" | "date">[]): { itemId: string; tasks: T[] }[] {
  const date = new Map(items.map((x) => [x.id, x.date]));
  const by = new Map<string, T[]>();
  for (const t of tasks) by.set(t.itemId, [...(by.get(t.itemId) ?? []), t]);
  const first = (ts: T[]) => ts.reduce((m, t) => (t.due < m ? t.due : m), "9999-12-31");
  return [...by.entries()]
    .map(([itemId, ts]) => ({ itemId, tasks: ts.sort((a, b) => a.due.localeCompare(b.due) || a.time.localeCompare(b.time)) }))
    .sort((a, b) => first(a.tasks).localeCompare(first(b.tasks)) || (date.get(a.itemId) ?? "").localeCompare(date.get(b.itemId) ?? ""));
}

/** The tasks a Today filter shows. "client" = approval tasks waiting for the client. */
export function tasksForFilter(g: TodayGroups, f: TodayFilter): TaskRow[] {
  if (f === "overdue") return g.overdue;
  if (f === "today") return g.dueToday;
  if (f === "next") return g.next3;
  if (f === "client") return [...g.overdue, ...g.dueToday, ...g.next3].filter((t) => t.step === "client_approval" && t.status === "in_progress");
  return [];
}
