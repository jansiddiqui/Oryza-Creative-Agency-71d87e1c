/** What approving a plan creates: one content item per calendar item, its tasks, and the shoot days. Pure. */
import { DEFAULT_RULES, planTasks, type DeadlineContext } from "./deadlines";
import type { DeadlineRule, DraftItem, DraftShoot, PlanDraft, PlannedTask } from "./types";

export interface ApprovalBundle {
  items: { item: DraftItem; tasks: PlannedTask[] }[];
  shoots: DraftShoot[];
  counts: { items: number; tasks: number; shoots: number; late: number };
}

export function approvalBundle(draft: PlanDraft, ctx: Omit<DeadlineContext, "shootDates">, rules: DeadlineRule[] = DEFAULT_RULES): ApprovalBundle {
  const shootDates = draft.shoots.map((s) => s.date);
  const items = draft.items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((item) => ({ item, tasks: planTasks(item, { ...ctx, shootDates }, rules) }));
  const tasks = items.flatMap((x) => x.tasks);
  return {
    items,
    shoots: draft.shoots,
    counts: { items: items.length, tasks: tasks.length, shoots: draft.shoots.length, late: tasks.filter((t) => t.late).length },
  };
}
