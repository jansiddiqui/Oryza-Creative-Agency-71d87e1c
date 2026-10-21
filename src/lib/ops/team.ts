/** Team workload, capacity and clash warnings, leave and bulk reassignment. Pure (no server code). */
import { addDays, fmtDate, weekdayName } from "@/lib/engine/dates";
import type { ShootRow, TaskRow } from "./types";

export interface Member {
  email: string;
  name: string;
  active: boolean;
  workingDays: number[];
  /** Hours per day; falls back to the agency-wide capacity. */
  capacityHours?: number | null;
}

export interface Leave {
  id?: string;
  email: string;
  start: string;
  end: string;
  note?: string;
}

/** Estimated hours per task step; "default" covers steps without their own estimate. */
export type Estimates = Record<string, number>;

export const DEFAULT_ESTIMATES: Estimates = {
  script: 1, shoot: 3, edit: 2.5, client_approval: 0.25, schedule: 0.25, publish: 0.25, post_check: 0.25,
  copy: 0.75, design: 1.5, prepare: 0.5, draft: 2, default: 0.5,
};

export const DEFAULT_CAPACITY = 7;

export const hoursFor = (step: string, est: Estimates) => est[step] ?? est.default ?? 0.5;
const weekday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();
const round = (n: number) => Math.round(n * 100) / 100;
/** "Wed 11 Nov" for messages. */
export const dayLabel = (iso: string) => `${weekdayName(iso)} ${fmtDate(iso)}`;

export const onLeave = (email: string, date: string, leave: Leave[]) => leave.some((l) => l.email === email && l.start <= date && date <= l.end);

export interface DayLoad {
  date: string;
  tasks: number;
  hours: number;
  capacity: number;
  /** Not a working day for this person, or on leave. */
  off: boolean;
  leave: boolean;
  over: boolean;
}

/**
 * Estimated hours for one person's tasks on one day. All posts filmed at one client's shoot share that shoot, so
 * "shoot" steps count once per client per day, not once per post.
 */
export function dayHours(tasks: { step: string; clientId?: string }[], est: Estimates) {
  const shoots = new Set<string>();
  let h = 0;
  for (const t of tasks) {
    if (t.step === "shoot") {
      const key = t.clientId ?? "";
      if (shoots.has(key)) continue;
      shoots.add(key);
    }
    h += hoursFor(t.step, est);
  }
  return round(h);
}

/** Each person's load per day over `days`: open tasks due that day, estimated hours, and capacity. */
export function workload(tasks: (Pick<TaskRow, "assignee" | "due" | "step" | "status"> & { clientId?: string })[], members: Member[], days: string[], est: Estimates, opts: { capacity?: number; leave?: Leave[] } = {}) {
  const cap = opts.capacity ?? DEFAULT_CAPACITY;
  return members.map((m) => {
    const perDay: DayLoad[] = days.map((date) => {
      const mine = tasks.filter((t) => t.assignee === m.email && t.due === date && t.status !== "done");
      const hours = dayHours(mine, est);
      const leave = onLeave(m.email, date, opts.leave ?? []);
      const off = leave || !m.workingDays.includes(weekday(date));
      const capacity = off ? 0 : (m.capacityHours ?? cap);
      return { date, tasks: mine.length, hours, capacity, off, leave, over: hours > capacity };
    });
    return { member: m, days: perDay, tasks: perDay.reduce((s, d) => s + d.tasks, 0), hours: round(perDay.reduce((s, d) => s + d.hours, 0)) };
  });
}

export type WarningKind = "over_capacity" | "shoot_clash" | "shoot_off_day" | "inactive_assignee" | "leave_assignee";
export interface OpsWarning {
  kind: WarningKind;
  date: string;
  email: string;
  message: string;
  /** Related shoot or task ids (for links and tests). */
  refs: string[];
}

const toMin = (t: string) => (/^\d{2}:\d{2}$/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : null);
/** Two shoots overlap when their time slots overlap; a shoot without times takes the whole day. */
export function slotsOverlap(a: Pick<ShootRow, "startTime" | "endTime">, b: Pick<ShootRow, "startTime" | "endTime">) {
  const [as, ae, bs, be] = [toMin(a.startTime), toMin(a.endTime), toMin(b.startTime), toMin(b.endTime)];
  if (as === null || bs === null) return true;
  const aEnd = ae ?? as + 240;
  const bEnd = be ?? bs + 240;
  return as < bEnd && bs < aEnd;
}

/**
 * Warnings: a person over capacity, two shoots at the same time for one shooter, a shoot on the shooter's day off
 * or leave, and open tasks assigned to an inactive person or to someone on leave that day.
 */
export function opsWarnings(input: {
  tasks: (Pick<TaskRow, "id" | "assignee" | "due" | "step" | "status" | "label"> & { clientId?: string })[];
  shoots: Pick<ShootRow, "id" | "date" | "shooter" | "status" | "startTime" | "endTime" | "label">[];
  members: Member[];
  days: string[];
  est: Estimates;
  capacity?: number;
  leave?: Leave[];
  clientName?: (shootId: string) => string;
}): OpsWarning[] {
  const out: OpsWarning[] = [];
  const byEmail = new Map(input.members.map((m) => [m.email, m]));
  const name = (e: string) => byEmail.get(e)?.name ?? e;
  const inRange = new Set(input.days);

  for (const row of workload(input.tasks, input.members.filter((m) => m.active), input.days, input.est, { capacity: input.capacity, leave: input.leave }))
    for (const d of row.days)
      // Work on leave days is reported once, as "work during leave" below.
      if (d.over && d.tasks && !d.leave)
        out.push({ kind: "over_capacity", date: d.date, email: row.member.email, refs: [], message: d.capacity ? `${row.member.name} has ${d.hours} h of work on ${dayLabel(d.date)} (capacity ${d.capacity} h).` : `${row.member.name} has ${d.tasks} task${d.tasks > 1 ? "s" : ""} on ${dayLabel(d.date)}, a day off.` });

  const shoots = input.shoots.filter((s) => s.status !== "cancelled" && s.shooter && inRange.has(s.date));
  const what = (s: (typeof shoots)[number]) => (input.clientName ? `${input.clientName(s.id)} (${s.label})` : s.label);
  for (let i = 0; i < shoots.length; i++)
    for (let j = i + 1; j < shoots.length; j++) {
      const a = shoots[i];
      const b = shoots[j];
      if (a.shooter === b.shooter && a.date === b.date && slotsOverlap(a, b))
        out.push({ kind: "shoot_clash", date: a.date, email: a.shooter!, refs: [a.id, b.id], message: `${name(a.shooter!)} has two shoots at the same time on ${dayLabel(a.date)}: ${what(a)} and ${what(b)}.` });
    }
  for (const s of shoots) {
    const m = byEmail.get(s.shooter!);
    if (!m) continue;
    if (onLeave(m.email, s.date, input.leave ?? []))
      out.push({ kind: "shoot_off_day", date: s.date, email: m.email, refs: [s.id], message: `${m.name} is on leave on ${dayLabel(s.date)} but is the shooter for ${what(s)}.` });
    else if (!m.workingDays.includes(weekday(s.date)))
      out.push({ kind: "shoot_off_day", date: s.date, email: m.email, refs: [s.id], message: `${what(s)} on ${dayLabel(s.date)} is on ${m.name}'s day off.` });
    if (!m.active) out.push({ kind: "inactive_assignee", date: s.date, email: m.email, refs: [s.id], message: `${what(s)} is assigned to ${m.name}, who is inactive.` });
  }

  const open = input.tasks.filter((t) => t.status !== "done" && t.assignee && inRange.has(t.due));
  const inactive = new Map<string, string[]>();
  for (const t of open) {
    const m = byEmail.get(t.assignee!);
    if (m && !m.active) inactive.set(m.email, [...(inactive.get(m.email) ?? []), t.id]);
  }
  for (const [email, refs] of inactive)
    out.push({ kind: "inactive_assignee", date: input.days[0], email, refs, message: `${refs.length} open task${refs.length > 1 ? "s are" : " is"} assigned to ${name(email)}, who is inactive. Reassign them.` });
  const leaveTasks = new Map<string, string[]>();
  for (const t of open) if (onLeave(t.assignee!, t.due, input.leave ?? []) && byEmail.get(t.assignee!)?.active !== false) leaveTasks.set(t.assignee!, [...(leaveTasks.get(t.assignee!) ?? []), t.id]);
  for (const [email, refs] of leaveTasks)
    out.push({ kind: "leave_assignee", date: input.days[0], email, refs, message: `${refs.length} open task${refs.length > 1 ? "s fall" : " falls"} on ${name(email)}'s leave. Reassign them.` });

  const order: WarningKind[] = ["shoot_clash", "shoot_off_day", "over_capacity", "leave_assignee", "inactive_assignee"];
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.date.localeCompare(b.date) || a.email.localeCompare(b.email));
}

/** The open tasks to hand from one person to another, optionally only those due within a date range (leave). */
export function tasksToReassign<T extends Pick<TaskRow, "id" | "assignee" | "due" | "status">>(tasks: T[], from: string, range?: { start: string; end: string }): T[] {
  return tasks.filter((t) => t.assignee === from && t.status !== "done" && (!range || (t.due >= range.start && t.due <= range.end)));
}

/** Days from `start` for `n` days (for the workload grid). */
export const daysFrom = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i));
