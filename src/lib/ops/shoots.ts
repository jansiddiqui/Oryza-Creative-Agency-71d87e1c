/** Shoot-day planner: which content items a shoot feeds, the merged shot list, consent reminders, moves. Pure. */
import { DEFAULT_WORKING_DAYS, recalcTasks } from "./deadlines";
import type { DeadlineRule, ItemRow, ShootRow, TaskRow } from "./types";

const FORMAT = (f: string) => (f === "gpost" ? "Google post" : f.charAt(0).toUpperCase() + f.slice(1));

/** Items whose "shoot" task is planned on this shoot's day (same client). */
export function itemsFedBy(shoot: Pick<ShootRow, "clientId" | "date">, items: ItemRow[], tasks: Pick<TaskRow, "itemId" | "step" | "due">[]): ItemRow[] {
  const ids = new Set(tasks.filter((t) => t.step === "shoot" && t.due === shoot.date).map((t) => t.itemId));
  return items.filter((x) => x.clientId === shoot.clientId && ids.has(x.id)).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export interface ShotSeed {
  itemId: string | null;
  label: string;
  sort: number;
}

/** The full shot list for a shoot day: the plan's general shots first, then one line per content item it feeds. */
export function mergedShotList(shoot: Pick<ShootRow, "shots">, fed: Pick<ItemRow, "id" | "format" | "title" | "hook">[]): ShotSeed[] {
  const out: ShotSeed[] = [];
  const seen = new Set<string>();
  for (const s of shoot.shots) {
    const label = s.trim().slice(0, 300);
    if (label && !seen.has(`-${label}`)) {
      seen.add(`-${label}`);
      out.push({ itemId: null, label, sort: out.length });
    }
  }
  for (const x of fed) {
    const label = `${FORMAT(x.format)}: ${x.title}${x.hook ? ` — hook: ${x.hook}` : ""}`.slice(0, 300);
    if (!seen.has(`${x.id}${label}`)) {
      seen.add(`${x.id}${label}`);
      out.push({ itemId: x.id, label, sort: out.length });
    }
  }
  return out;
}

const CONSENT = /consent|faces?\b|patient|child|children|student|minor|parent|testimonial|photo|video|people|customer|citizen/i;

/** Consent and people reminders for the shoot: matching plan compliance notes plus the fed items' own notes. */
export function consentReminders(planCompliance: string[], fed: Pick<ItemRow, "complianceNote">[]): string[] {
  const out = new Set<string>();
  for (const c of planCompliance) if (CONSENT.test(c)) out.add(c);
  for (const x of fed) if (x.complianceNote) out.add(x.complianceNote);
  return [...out];
}

/** True when every shot for the item is done (and it has at least one). */
export function itemShotsDone(shots: { itemId: string | null; done: boolean }[], itemId: string) {
  const mine = shots.filter((s) => s.itemId === itemId);
  return mine.length > 0 && mine.every((s) => s.done);
}

/**
 * Moving a shoot: the open tasks of every item it feeds are recalculated with the new shoot date (other shoot days
 * of the client still count). Returns the changes to show for confirmation, then to save.
 */
export function shootMoveChanges(input: {
  newDate: string;
  fed: Pick<ItemRow, "id" | "date" | "format" | "title">[];
  tasks: Pick<TaskRow, "id" | "itemId" | "step" | "status" | "due" | "label" | "late">[];
  otherShootDates: string[];
  rules: DeadlineRule[];
  workingDays?: number[];
  today: string;
}) {
  const shootDates = [...input.otherShootDates, input.newDate];
  return input.fed.flatMap((x) =>
    recalcTasks(
      input.tasks.filter((t) => t.itemId === x.id),
      { date: x.date, format: x.format },
      { shootDates, workingDays: input.workingDays ?? DEFAULT_WORKING_DAYS, today: input.today },
      input.rules,
    ).map((c) => ({ ...c, itemId: x.id, itemTitle: x.title, from: input.tasks.find((t) => t.id === c.id)?.due ?? "" })),
  );
}
