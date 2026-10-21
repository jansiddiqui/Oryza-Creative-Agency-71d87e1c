import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { addDays } from "@/lib/engine/dates";
import { deriveStage, todayIST } from "@/lib/ops/deadlines";
import { consentReminders, itemShotsDone, itemsFedBy, mergedShotList, shootMoveChanges } from "@/lib/ops/shoots";
import type { ItemRow, ShootRow, ShootStatus } from "@/lib/ops/types";
import { getClient, getPlan, listItems, listShoots, listTasks, loadRules, loadWorkingDays } from "./ops-data";

const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};
type R = Record<string, unknown>;

export interface ShotRow {
  id: string;
  itemId: string | null;
  label: string;
  done: boolean;
  doneBy: string | null;
}

export async function getShoot(id: string): Promise<ShootRow | null> {
  const { data, error } = await db().from("shoot_days").select("*").eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  const r = data as R;
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    date: r.shoot_date as string,
    label: r.label as string,
    shots: (r.shot_list as string[]) ?? [],
    location: r.location as string,
    shooter: (r.shooter as string) ?? null,
    status: r.status as ShootStatus,
    startTime: (r.start_time as string) ?? "",
    endTime: (r.end_time as string) ?? "",
    props: (r.props as string) ?? "",
    people: (r.people as string) ?? "",
    notes: (r.notes as string) ?? "",
    planId: (r.plan_id as string) ?? null,
  } as ShootRow & { planId: string | null };
}

async function fedItems(shoot: ShootRow): Promise<ItemRow[]> {
  const items = await listItems({ from: shoot.date, to: addDays(shoot.date, 45) }, shoot.clientId);
  const tasks = await listTasks({ to: "9999-12-31", itemIds: items.map((x) => x.id) });
  return itemsFedBy(shoot, items, tasks);
}

/** Everything the shoot page shows. Missing shot rows are added (the plan's shots plus one per fed item). */
export async function shootDetail(id: string) {
  const shoot = (await getShoot(id)) as (ShootRow & { planId: string | null }) | null;
  if (!shoot) return null;
  const [client, fed, plan] = await Promise.all([getClient(shoot.clientId), fedItems(shoot), shoot.planId ? getPlan(shoot.planId) : null]);
  const seeds = mergedShotList(shoot, fed).map((s) => ({ shoot_id: id, item_id: s.itemId, label: s.label, sort: s.sort }));
  if (seeds.length) fail((await db().from("shoot_shots").upsert(seeds, { onConflict: "shoot_id,item_id,label", ignoreDuplicates: true })).error);
  const { data, error } = await db().from("shoot_shots").select("*").eq("shoot_id", id).order("sort");
  fail(error);
  const shots: ShotRow[] = ((data ?? []) as R[]).map((r) => ({ id: r.id as string, itemId: (r.item_id as string) ?? null, label: r.label as string, done: Boolean(r.done), doneBy: (r.done_by as string) ?? null }));
  return { shoot, client, fed, shots, consent: consentReminders(plan?.draft.compliance ?? [], fed) };
}

async function refreshStage(itemId: string) {
  const tasks = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
  fail((await db().from("content_items").update({ stage: deriveStage(tasks), updated_at: new Date().toISOString() }).eq("id", itemId)).error);
}

/**
 * Ticks a shot. When every shot for a content item is done, that item's "shoot" task is done and its stage moves
 * on; un-ticking reopens the task.
 */
export async function setShot(shotId: string, done: boolean, actor: string): Promise<{ shootId: string; itemId: string | null; clientId: string }> {
  const { data, error } = await db().from("shoot_shots").update({ done, done_by: done ? actor : null, done_at: done ? new Date().toISOString() : null }).eq("id", shotId).select("shoot_id, item_id").single();
  fail(error);
  const shootId = (data as R).shoot_id as string;
  const itemId = ((data as R).item_id as string) ?? null;
  const shoot = await getShoot(shootId);
  if (itemId) {
    const { data: all } = await db().from("shoot_shots").select("item_id, done").eq("shoot_id", shootId);
    const allDone = itemShotsDone(((all ?? []) as R[]).map((r) => ({ itemId: (r.item_id as string) ?? null, done: Boolean(r.done) })), itemId);
    const { data: t } = await db().from("tasks").select("id, status").eq("item_id", itemId).eq("step", "shoot").maybeSingle();
    if (t) {
      const now = new Date().toISOString();
      const patch = allDone
        ? { status: "done", completed_by: actor, completed_at: now, blocked_reason: "", updated_at: now }
        : { status: "in_progress", completed_by: null, completed_at: null, blocked_reason: "", updated_at: now };
      if (allDone || (t as R).status === "done" || (t as R).status === "todo") fail((await db().from("tasks").update(patch).eq("id", (t as R).id as string)).error);
    }
    await refreshStage(itemId);
  }
  return { shootId, itemId, clientId: shoot?.clientId ?? "" };
}

export async function updateShootDetails(id: string, p: { location?: string; startTime?: string; endTime?: string; shooter?: string | null; props?: string; people?: string; notes?: string; status?: ShootStatus }) {
  const row: R = {};
  const time = (t: string) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : "");
  if (p.location !== undefined) row.location = p.location.slice(0, 200);
  if (p.startTime !== undefined) row.start_time = time(p.startTime);
  if (p.endTime !== undefined) row.end_time = time(p.endTime);
  if (p.shooter !== undefined) row.shooter = p.shooter || null;
  if (p.props !== undefined) row.props = p.props.slice(0, 2000);
  if (p.people !== undefined) row.people = p.people.slice(0, 2000);
  if (p.notes !== undefined) row.notes = p.notes.slice(0, 2000);
  if (p.status !== undefined) row.status = p.status;
  fail((await db().from("shoot_days").update(row).eq("id", id)).error);
}

/** The task changes a move would cause (shown for confirmation), and the move itself. */
export async function shootMovePlan(id: string, newDate: string) {
  const shoot = await getShoot(id);
  if (!shoot) throw new Error("Shoot not found");
  const fed = await fedItems(shoot);
  const [tasks, rules, workingDays, others] = await Promise.all([
    listTasks({ to: "9999-12-31", itemIds: fed.map((x) => x.id) }),
    loadRules(),
    loadWorkingDays(),
    listShoots({ from: addDays(newDate, -60), to: addDays(newDate, 60) }, shoot.clientId),
  ]);
  const otherShootDates = others.filter((s) => s.id !== id && s.status !== "cancelled").map((s) => s.date);
  const changes = shootMoveChanges({ newDate, fed, tasks, otherShootDates, rules, workingDays, today: todayIST() });
  return { shoot, changes };
}

export async function moveShoot(id: string, newDate: string) {
  const { shoot, changes } = await shootMovePlan(id, newDate);
  fail((await db().from("shoot_days").update({ shoot_date: newDate }).eq("id", id)).error);
  const now = new Date().toISOString();
  for (const c of changes) fail((await db().from("tasks").update({ due_date: c.due, label: c.label, late: c.late, updated_at: now }).eq("id", c.id)).error);
  // The shot list follows the items again on next open (fed items may change with the date).
  return { shoot, changed: changes.length };
}
