import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { DEFAULT_CAPACITY, DEFAULT_ESTIMATES, opsWarnings, tasksToReassign, type Estimates, type Leave, type Member, type OpsWarning } from "@/lib/ops/team";
import { listClients, listShoots, listTasks, listTeam, type TeamMember } from "./ops-data";

const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};
type R = Record<string, unknown>;

export async function loadEstimates(): Promise<Estimates> {
  const { data } = await db().from("task_estimates").select("step, hours");
  const rows = (data ?? []) as R[];
  return rows.length ? Object.fromEntries(rows.map((r) => [r.step as string, Number(r.hours)])) : DEFAULT_ESTIMATES;
}

export async function saveEstimates(est: Estimates) {
  const rows = Object.entries(est).map(([step, hours]) => ({ step, hours }));
  fail((await db().from("task_estimates").upsert(rows, { onConflict: "step" })).error);
}

export async function loadCapacity(): Promise<number> {
  const { data } = await db().from("ops_settings").select("capacity_hours").eq("id", 1).maybeSingle();
  const n = Number(data?.capacity_hours);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CAPACITY;
}

export async function saveCapacity(hours: number, actor: string) {
  fail((await db().from("ops_settings").update({ capacity_hours: hours, updated_at: new Date().toISOString(), updated_by: actor }).eq("id", 1)).error);
}

export async function listLeave(from?: string): Promise<Leave[]> {
  let q = db().from("team_leave").select("*").order("start_date");
  if (from) q = q.gte("end_date", from);
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as R[]).map((r) => ({ id: r.id as string, email: r.email as string, start: r.start_date as string, end: r.end_date as string, note: r.note as string }));
}

export async function addLeave(l: Leave, actor: string): Promise<string> {
  const { data, error } = await db().from("team_leave").insert({ email: l.email, start_date: l.start, end_date: l.end, note: l.note ?? "", created_by: actor }).select("id").single();
  fail(error);
  return (data as R).id as string;
}

export async function removeLeave(id: string) {
  fail((await db().from("team_leave").delete().eq("id", id)).error);
}

/** Moves open tasks (and the shoots they shoot) from one person to another; returns how many tasks moved. */
export async function reassignTasks(from: string, to: string, range?: { start: string; end: string }): Promise<{ tasks: number; shoots: number }> {
  const all = await listTasks({ to: "9999-12-31", openOnly: true });
  const ids = tasksToReassign(all, from, range).map((t) => t.id);
  for (let i = 0; i < ids.length; i += 200) fail((await db().from("tasks").update({ assignee: to, updated_at: new Date().toISOString() }).in("id", ids.slice(i, i + 200))).error);
  let q = db().from("shoot_days").update({ shooter: to }).eq("shooter", from).eq("status", "planned");
  if (range) q = q.gte("shoot_date", range.start).lte("shoot_date", range.end);
  const { data, error } = await q.select("id");
  fail(error);
  return { tasks: ids.length, shoots: (data ?? []).length };
}

export const toMember = (m: TeamMember): Member => ({ email: m.email, name: m.name, active: m.active, workingDays: m.workingDays, capacityHours: m.capacityHours ?? null });

/** Clash and capacity warnings for a date range (used on Today, the calendar, the team and shoot pages). */
export async function loadWarnings(range: { from: string; to: string }, days: string[]): Promise<OpsWarning[]> {
  const [tasks, shoots, team, est, capacity, leave, clients] = await Promise.all([
    listTasks({ from: range.from, to: range.to, openOnly: true }),
    listShoots(range),
    listTeam(),
    loadEstimates(),
    loadCapacity(),
    listLeave(range.from),
    listClients(),
  ]);
  const clientOf = new Map(shoots.map((s) => [s.id, clients.find((c) => c.id === s.clientId)?.name ?? "A client"]));
  return opsWarnings({ tasks, shoots, members: team.map(toMember), days, est, capacity, leave, clientName: (id) => clientOf.get(id) ?? "" });
}
