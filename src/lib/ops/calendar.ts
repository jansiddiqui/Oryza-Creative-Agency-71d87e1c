/** Master calendar logic: filters, overdue rules and month / week / day grids. Pure. */
import { addDays } from "@/lib/engine/dates";
import type { ClientLite, ItemRow, ItemStage, TaskRow } from "./types";

export type CalendarView = "month" | "week" | "day";

export interface CalendarFilters {
  client?: string;
  platform?: string;
  format?: string;
  stage?: string;
  assignee?: string;
  category?: string;
}

const DONE: ItemStage[] = ["published", "done"];

export function filterItems(items: ItemRow[], clients: ClientLite[], f: CalendarFilters): ItemRow[] {
  const cat = new Map(clients.map((c) => [c.id, c.category]));
  return items.filter(
    (x) =>
      (!f.client || x.clientId === f.client) &&
      (!f.platform || x.platform === f.platform) &&
      (!f.format || x.format === f.format) &&
      (!f.stage || x.stage === f.stage) &&
      (!f.assignee || x.assignee === f.assignee) &&
      (!f.category || cat.get(x.clientId) === f.category),
  );
}

/** Overdue: the publish date has passed and it isn't published, or one of its open tasks is past due. */
export function isOverdue(item: Pick<ItemRow, "id" | "date" | "stage">, tasks: Pick<TaskRow, "itemId" | "status" | "due">[], today: string): boolean {
  if (DONE.includes(item.stage)) return false;
  if (item.date < today) return true;
  return tasks.some((t) => t.itemId === item.id && t.status !== "done" && t.due < today);
}

const weekday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();
/** Monday of the week containing iso. */
export const mondayOf = (iso: string) => addDays(iso, -((weekday(iso) + 6) % 7));

/** Weeks (Monday–Sunday) covering the whole month that contains `anchor`. */
export function monthGrid(anchor: string): string[][] {
  const first = anchor.slice(0, 8) + "01";
  const month = first.slice(0, 7);
  const weeks: string[][] = [];
  for (let start = mondayOf(first); start.slice(0, 7) <= month || weeks.length === 0; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
    if (weeks.length > 6) break;
  }
  return weeks.filter((w) => w.some((d) => d.slice(0, 7) === month));
}

export const weekDays = (anchor: string) => Array.from({ length: 7 }, (_, i) => addDays(mondayOf(anchor), i));

/** The anchor date one view-step earlier or later. */
export function shift(view: CalendarView, anchor: string, dir: -1 | 1): string {
  if (view === "day") return addDays(anchor, dir);
  if (view === "week") return addDays(anchor, 7 * dir);
  const d = new Date(anchor.slice(0, 8) + "01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + dir);
  return d.toISOString().slice(0, 10);
}

/** The dates a view shows (for loading data). */
export function viewRange(view: CalendarView, anchor: string): { from: string; to: string } {
  if (view === "day") return { from: anchor, to: anchor };
  if (view === "week") {
    const w = weekDays(anchor);
    return { from: w[0], to: w[6] };
  }
  const g = monthGrid(anchor);
  return { from: g[0][0], to: g[g.length - 1][6] };
}
