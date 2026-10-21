/**
 * Deadline rules: every content item's tasks are worked back from its publish date. Pure and deterministic.
 * Working days only — a due date on a non-working day moves earlier; a task already past its due date when it
 * is created is flagged "late". Moving an item recalculates its open tasks; finished tasks keep their dates.
 */
import { addDays } from "@/lib/engine/dates";
import type { DeadlineRule, PlannedTask, TaskRow, TeamRole } from "./types";

/** Mon–Sat (0 = Sunday … 6 = Saturday). */
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6];

const r = (format: string, step: string, label: string, offset: number, time: string, role: TeamRole, sort: number): DeadlineRule => ({ format, step, label, offset, time, role, sort });

/** The default rule table (owners can edit it in admin). "default" applies to formats without their own rules. */
export const DEFAULT_RULES: DeadlineRule[] = [
  r("reel", "script", "Script", -5, "6:00 pm", "strategist", 1),
  r("reel", "shoot", "Shoot", -3, "6:00 pm", "shooter", 2),
  r("reel", "edit", "Edit", -2, "6:00 pm", "editor", 3),
  r("reel", "client_approval", "Client approval", -1, "1:00 pm", "strategist", 4),
  r("reel", "schedule", "Schedule", -1, "6:00 pm", "community", 5),
  r("reel", "publish", "Publish", 0, "", "community", 6),
  r("reel", "post_check", "Post-check", 1, "6:00 pm", "community", 7),
  r("post", "copy", "Copy", -4, "6:00 pm", "strategist", 1),
  r("post", "design", "Design", -3, "6:00 pm", "designer", 2),
  r("post", "client_approval", "Client approval", -1, "1:00 pm", "strategist", 3),
  r("post", "schedule", "Schedule", -1, "6:00 pm", "community", 4),
  r("post", "publish", "Publish", 0, "", "community", 5),
  r("story", "prepare", "Prepare", -1, "6:00 pm", "designer", 1),
  r("story", "publish", "Publish", 0, "", "community", 2),
  r("short", "edit", "Cut the Short", -1, "6:00 pm", "editor", 1),
  r("short", "publish", "Publish", 0, "", "community", 2),
  r("video", "edit", "Edit", -4, "6:00 pm", "editor", 1),
  r("video", "client_approval", "Client approval", -2, "1:00 pm", "strategist", 2),
  r("video", "publish", "Publish", 0, "", "community", 3),
  r("blog", "draft", "Draft", -5, "6:00 pm", "strategist", 1),
  r("blog", "client_approval", "Client approval", -2, "1:00 pm", "strategist", 2),
  r("blog", "publish", "Publish", 0, "", "community", 3),
  r("gpost", "copy", "Copy and photo", -2, "6:00 pm", "strategist", 1),
  r("gpost", "publish", "Publish", 0, "", "community", 2),
  r("broadcast", "copy", "Write the message", -1, "1:00 pm", "strategist", 1),
  r("broadcast", "publish", "Send", 0, "", "community", 2),
  r("status", "prepare", "Prepare", -1, "6:00 pm", "designer", 1),
  r("status", "publish", "Publish", 0, "", "community", 2),
  r("event", "prepare", "Set up the event", -1, "1:00 pm", "community", 1),
  r("event", "publish", "Publish", 0, "", "community", 2),
  r("pin", "design", "Design pins", -2, "6:00 pm", "designer", 1),
  r("pin", "publish", "Publish", 0, "", "community", 2),
  r("default", "prepare", "Prepare", -1, "6:00 pm", "community", 1),
  r("default", "publish", "Publish", 0, "", "community", 2),
];

const weekday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();

/** The same day if it is a working day, otherwise the nearest earlier working day. */
export function workingDayOnOrBefore(iso: string, workingDays: number[] = DEFAULT_WORKING_DAYS): string {
  if (!workingDays.length) return iso;
  let d = iso;
  for (let i = 0; i < 7 && !workingDays.includes(weekday(d)); i++) d = addDays(d, -1);
  return d;
}

/** Today's date in India (IST), as yyyy-mm-dd. */
export const todayIST = (now: Date = new Date()) => new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

/** Rules for a format (a carousel follows the post rules; others fall back to "default"), in order. */
export function rulesFor(format: string, rules: DeadlineRule[] = DEFAULT_RULES): DeadlineRule[] {
  const f = format === "carousel" ? "post" : format;
  const own = rules.filter((x) => x.format === f);
  return (own.length ? own : rules.filter((x) => x.format === "default")).slice().sort((a, b) => a.sort - b.sort);
}

export interface DeadlineContext {
  /** Shoot days for the client (ISO dates). */
  shootDates: string[];
  workingDays?: number[];
  /** Today (ISO). Tasks due before this are flagged late. */
  today: string;
}

/** Due date (and label) for one rule step, before the working-day adjustment. */
function dueFor(rule: DeadlineRule, publish: string, shootDates: string[]): { due: string; label: string } {
  if (rule.step !== "shoot") return { due: addDays(publish, rule.offset), label: rule.label };
  const latest = addDays(publish, rule.offset);
  const shoot = shootDates.filter((s) => s <= latest).sort().pop();
  return shoot ? { due: shoot, label: "Shoot (shoot day)" } : { due: addDays(publish, -4), label: "Client sends footage" };
}

/** All tasks for one content item, worked back from its publish date. */
export function planTasks(item: { date: string; format: string }, ctx: DeadlineContext, rules: DeadlineRule[] = DEFAULT_RULES): PlannedTask[] {
  const wd = ctx.workingDays ?? DEFAULT_WORKING_DAYS;
  return rulesFor(item.format, rules).map((rule) => {
    const { due: raw, label } = dueFor(rule, item.date, ctx.shootDates);
    // Publishing stays on its planned date; every other step moves earlier off non-working days.
    const due = rule.step === "publish" ? raw : workingDayOnOrBefore(raw, wd);
    return { step: rule.step, label, due, time: rule.time, role: rule.role, late: due < ctx.today };
  });
}

/**
 * After an item moves to a new publish date: new dates for its open tasks (finished tasks keep theirs).
 * Returns only the tasks that change.
 */
export function recalcTasks(
  tasks: Pick<TaskRow, "id" | "step" | "status" | "due" | "label" | "late">[],
  item: { date: string; format: string },
  ctx: DeadlineContext,
  rules: DeadlineRule[] = DEFAULT_RULES,
): { id: string; due: string; label: string; late: boolean }[] {
  const planned = new Map(planTasks(item, ctx, rules).map((t) => [t.step, t]));
  const out: { id: string; due: string; label: string; late: boolean }[] = [];
  for (const t of tasks) {
    if (t.status === "done") continue;
    const p = planned.get(t.step);
    if (!p) continue;
    if (p.due !== t.due || p.label !== t.label || p.late !== t.late) out.push({ id: t.id, due: p.due, label: p.label, late: p.late });
  }
  return out;
}

/** An item's stage, derived from its tasks. */
export function deriveStage(tasks: Pick<TaskRow, "step" | "status">[]): import("./types").ItemStage {
  if (!tasks.length) return "planned";
  const s = (step: string) => tasks.find((t) => t.step === step)?.status;
  if (tasks.every((t) => t.status === "done")) return "done";
  if (s("publish") === "done") return "published";
  if (s("schedule") === "done") return "scheduled";
  if (s("client_approval") === "done") return "approved";
  if (s("client_approval") === "in_progress") return "client_review";
  if (tasks.some((t) => t.status === "done" || t.status === "in_progress")) return "in_production";
  return "planned";
}
