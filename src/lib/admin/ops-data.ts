import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { addDays } from "@/lib/engine/dates";
import type { PackageId } from "@/lib/engine/packages";
import type { Plan } from "@/lib/engine/types";
import { approvalBundle } from "@/lib/ops/approval";
import { generateClientPlan } from "@/lib/ops/conversion";
import { DEFAULT_RULES, DEFAULT_WORKING_DAYS, deriveStage, recalcTasks, todayIST } from "@/lib/ops/deadlines";
import { onboardingFor } from "@/lib/ops/onboarding";
import { draftFromPlan, mergeDraft } from "@/lib/ops/plan-draft";
import type { ClientLite, ClientStatus, DeadlineRule, ItemRow, PlanDraft, PlanStatus, ShootRow, ShootStatus, TaskRow, TaskStatus, TeamRole } from "@/lib/ops/types";

/* ------------------------------------------------------------------ types */
export interface Client extends ClientLite {
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  package: PackageId;
  startDate: string;
  renewalDate: string | null;
  notes: string;
  leadId: string | null;
  createdAt: string;
}

export interface ClientPlanRow {
  id: string;
  clientId: string;
  monthStart: string;
  answers: Record<string, unknown>;
  draft: PlanDraft;
  engineVersion: string;
  status: PlanStatus;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface TeamMember {
  email: string;
  name: string;
  roles: TeamRole[];
  workingDays: number[];
  active: boolean;
}

export interface OnboardingRow {
  id: string;
  kind: string;
  label: string;
  platform: string;
  done: boolean;
  doneBy: string | null;
  doneAt: string | null;
}

const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

/* ------------------------------------------------------------------ row mappers */
type R = Record<string, unknown>;
const toClient = (r: R): Client => ({
  id: r.id as string,
  name: r.name as string,
  category: r.category as string,
  colour: r.colour as string,
  status: r.status as ClientStatus,
  contactPerson: r.contact_person as string,
  phone: r.phone as string,
  email: r.email as string,
  city: r.city as string,
  package: r.package as PackageId,
  startDate: r.start_date as string,
  renewalDate: (r.renewal_date as string) ?? null,
  notes: r.notes as string,
  leadId: (r.lead_id as string) ?? null,
  createdAt: r.created_at as string,
});
const toPlan = (r: R): ClientPlanRow => ({
  id: r.id as string,
  clientId: r.client_id as string,
  monthStart: r.month_start as string,
  answers: r.answers as Record<string, unknown>,
  draft: r.draft as PlanDraft,
  engineVersion: r.engine_version as string,
  status: r.status as PlanStatus,
  approvedBy: (r.approved_by as string) ?? null,
  approvedAt: (r.approved_at as string) ?? null,
});
const toItem = (r: R): ItemRow => ({
  id: r.id as string,
  clientId: r.client_id as string,
  planId: r.plan_id as string,
  platform: r.platform as ItemRow["platform"],
  format: r.format as string,
  title: r.title as string,
  hook: r.hook as string,
  cta: r.cta as string,
  pillar: r.pillar as string,
  templateId: r.template_id as string,
  date: r.publish_date as string,
  time: r.publish_time as string,
  stage: r.stage as ItemRow["stage"],
  assignee: (r.assignee as string) ?? null,
  complianceNote: r.compliance_notes as string,
  clientApproved: Boolean(r.client_approved_at),
});
const toTask = (r: R): TaskRow => ({
  id: r.id as string,
  itemId: r.item_id as string,
  clientId: r.client_id as string,
  step: r.step as string,
  label: r.label as string,
  due: r.due_date as string,
  time: r.due_time as string,
  role: r.role as TeamRole,
  assignee: (r.assignee as string) ?? null,
  status: r.status as TaskStatus,
  late: Boolean(r.late),
  blockedReason: r.blocked_reason as string,
  note: r.note as string,
});
const toShoot = (r: R): ShootRow => ({
  id: r.id as string,
  clientId: r.client_id as string,
  date: r.shoot_date as string,
  label: r.label as string,
  shots: (r.shot_list as string[]) ?? [],
  location: r.location as string,
  shooter: (r.shooter as string) ?? null,
  status: r.status as ShootStatus,
});

/* ------------------------------------------------------------------ settings, rules, team */
export async function loadRules(): Promise<DeadlineRule[]> {
  const { data, error } = await db().from("deadline_rules").select("*");
  fail(error);
  const rows = (data ?? []) as R[];
  if (!rows.length) return DEFAULT_RULES;
  return rows.map((r) => ({ format: r.format as string, step: r.step as string, label: r.label as string, offset: r.offset_days as number, time: r.due_time as string, role: r.role as TeamRole, sort: r.sort as number }));
}

export async function saveRules(rules: DeadlineRule[]) {
  const rows = rules.map((r) => ({ format: r.format, step: r.step, label: r.label, offset_days: r.offset, due_time: r.time, role: r.role, sort: r.sort }));
  const { error } = await db().from("deadline_rules").upsert(rows, { onConflict: "format,step" });
  fail(error);
}

export async function loadWorkingDays(): Promise<number[]> {
  const { data } = await db().from("ops_settings").select("working_days").eq("id", 1).maybeSingle();
  const wd = (data?.working_days as number[] | undefined) ?? DEFAULT_WORKING_DAYS;
  return wd.length ? wd : DEFAULT_WORKING_DAYS;
}

export async function saveWorkingDays(days: number[], actor: string) {
  const { error } = await db().from("ops_settings").update({ working_days: days, updated_at: new Date().toISOString(), updated_by: actor }).eq("id", 1);
  fail(error);
}

export async function listTeam(): Promise<TeamMember[]> {
  const [{ data: admins, error: e1 }, { data: team, error: e2 }] = await Promise.all([
    db().from("admin_users").select("email, active").order("email"),
    db().from("team_members").select("*"),
  ]);
  fail(e1);
  fail(e2);
  const byEmail = new Map(((team ?? []) as R[]).map((t) => [t.email as string, t]));
  return ((admins ?? []) as R[]).map((a) => {
    const t = byEmail.get(a.email as string);
    return {
      email: a.email as string,
      name: (t?.display_name as string) || (a.email as string).split("@")[0],
      roles: ((t?.roles as TeamRole[]) ?? []),
      workingDays: (t?.working_days as number[]) ?? DEFAULT_WORKING_DAYS,
      active: Boolean(a.active) && (t ? Boolean(t.active) : true),
    };
  });
}

export async function saveTeamMember(m: TeamMember) {
  const { error } = await db()
    .from("team_members")
    .upsert({ email: m.email, display_name: m.name, roles: m.roles, working_days: m.workingDays, active: m.active, updated_at: new Date().toISOString() });
  fail(error);
}

/* ------------------------------------------------------------------ clients */
export async function listClients(): Promise<Client[]> {
  const { data, error } = await db().from("clients").select("*").order("name");
  fail(error);
  return ((data ?? []) as R[]).map(toClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await db().from("clients").select("*").eq("id", id).maybeSingle();
  fail(error);
  return data ? toClient(data as R) : null;
}

export async function clientForLead(leadId: string): Promise<Client | null> {
  const { data } = await db().from("clients").select("*").eq("lead_id", leadId).maybeSingle();
  return data ? toClient(data as R) : null;
}

export interface NewClient {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  package: PackageId;
  startDate: string;
  renewalDate: string | null;
  colour: string;
  notes: string;
  leadId: string | null;
}

/** Creates the client, its first plan (draft) and its onboarding checklist. Returns the client and plan ids. */
export async function createClientWithPlan(c: NewClient, answers: Record<string, unknown>, actor: string): Promise<{ clientId: string; planId: string }> {
  const { data, error } = await db()
    .from("clients")
    .insert({
      name: c.name,
      category: c.category,
      contact_person: c.contactPerson,
      phone: c.phone,
      email: c.email,
      city: c.city,
      package: c.package,
      start_date: c.startDate,
      renewal_date: c.renewalDate,
      colour: c.colour,
      notes: c.notes,
      lead_id: c.leadId,
      created_by: actor,
    })
    .select("id")
    .single();
  fail(error);
  const clientId = (data as R).id as string;
  const planId = await createPlan(clientId, c.category, answers, c.startDate, c.package, actor);
  const seeds = onboardingFor(answers).map((s) => ({ client_id: clientId, ...s }));
  if (seeds.length) fail((await db().from("onboarding_items").insert(seeds)).error);
  if (c.leadId) await db().from("leads").update({ status: "converted", updated_at: new Date().toISOString(), updated_by: actor }).eq("id", c.leadId);
  return { clientId, planId };
}

export async function updateClient(id: string, patch: Partial<Pick<Client, "name" | "contactPerson" | "phone" | "email" | "city" | "package" | "renewalDate" | "status" | "notes" | "colour">>, actor: string) {
  const row: R = { updated_at: new Date().toISOString(), updated_by: actor };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.contactPerson !== undefined) row.contact_person = patch.contactPerson;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.package !== undefined) row.package = patch.package;
  if (patch.renewalDate !== undefined) row.renewal_date = patch.renewalDate || null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.colour !== undefined) row.colour = patch.colour;
  fail((await db().from("clients").update(row).eq("id", id)).error);
}

/* ------------------------------------------------------------------ plans */
/** Generates a plan with the public engine and stores it with an editable draft. */
export async function createPlan(clientId: string, slug: string, answers: Record<string, unknown>, start: string, pkg: PackageId, actor: string): Promise<string> {
  const plan: Plan = await generateClientPlan(slug, answers, start, pkg);
  const { data, error } = await db()
    .from("client_plans")
    .insert({ client_id: clientId, month_start: start, answers, generated: plan, draft: draftFromPlan(plan), engine_version: plan.version, created_by: actor })
    .select("id")
    .single();
  fail(error);
  return (data as R).id as string;
}

export async function listPlans(clientId: string): Promise<ClientPlanRow[]> {
  const { data, error } = await db().from("client_plans").select("id, client_id, month_start, answers, draft, engine_version, status, approved_by, approved_at").eq("client_id", clientId).order("month_start", { ascending: false });
  fail(error);
  return ((data ?? []) as R[]).map(toPlan);
}

export async function getPlan(id: string): Promise<ClientPlanRow | null> {
  const { data, error } = await db().from("client_plans").select("id, client_id, month_start, answers, draft, engine_version, status, approved_by, approved_at").eq("id", id).maybeSingle();
  fail(error);
  return data ? toPlan(data as R) : null;
}

/** Saves an edited draft. Only allowed fields are taken; compliance notes always come from the stored draft. */
export async function savePlanDraft(id: string, incoming: PlanDraft): Promise<PlanDraft> {
  const plan = await getPlan(id);
  if (!plan) throw new Error("Plan not found");
  if (plan.status !== "draft") throw new Error("This plan is already approved");
  const merged = mergeDraft(plan.draft, incoming);
  fail((await db().from("client_plans").update({ draft: merged, updated_at: new Date().toISOString() }).eq("id", id)).error);
  return merged;
}

/** The first active team member with a role (for default task assignment). */
const pickFor = (team: TeamMember[], role: TeamRole) => team.find((m) => m.active && m.roles.includes(role))?.email ?? null;

/** Approves a draft: creates content items, their tasks and the shoot days. */
export async function approvePlan(id: string, actor: string, now = new Date()): Promise<{ items: number; tasks: number; shoots: number; late: number }> {
  const plan = await getPlan(id);
  if (!plan) throw new Error("Plan not found");
  if (plan.status !== "draft") throw new Error("This plan is already approved");
  const [rules, workingDays, team] = await Promise.all([loadRules(), loadWorkingDays(), listTeam()]);
  const bundle = approvalBundle(plan.draft, { today: todayIST(now), workingDays }, rules);

  const shooter = pickFor(team, "shooter");
  if (bundle.shoots.length)
    fail((await db().from("shoot_days").insert(bundle.shoots.map((s) => ({ client_id: plan.clientId, plan_id: id, shoot_date: s.date, label: s.label, shot_list: s.shots, shooter })))).error);

  const { data: inserted, error } = await db()
    .from("content_items")
    .insert(
      bundle.items.map(({ item }) => ({
        client_id: plan.clientId,
        plan_id: id,
        draft_item_id: item.id,
        platform: item.platform,
        format: item.format,
        title: item.title,
        hook: item.hook,
        cta: item.cta,
        pillar: item.pillar,
        template_id: item.templateId,
        publish_date: item.date,
        publish_time: item.time,
        assignee: item.assignee,
        compliance_notes: item.complianceNote,
      })),
    )
    .select("id, draft_item_id");
  fail(error);
  const idFor = new Map(((inserted ?? []) as R[]).map((r) => [r.draft_item_id as string, r.id as string]));
  const tasks = bundle.items.flatMap(({ item, tasks: ts }) =>
    ts.map((t) => ({
      item_id: idFor.get(item.id),
      client_id: plan.clientId,
      step: t.step,
      label: t.label,
      due_date: t.due,
      due_time: t.time,
      role: t.role,
      assignee: item.assignee ?? pickFor(team, t.role),
      late: t.late,
    })),
  );
  for (let i = 0; i < tasks.length; i += 500) fail((await db().from("tasks").insert(tasks.slice(i, i + 500))).error);
  fail((await db().from("client_plans").update({ status: "approved", approved_by: actor, approved_at: now.toISOString() }).eq("id", id)).error);
  await db().from("clients").update({ status: "active" }).eq("id", plan.clientId).eq("status", "onboarding");
  return bundle.counts;
}

/* ------------------------------------------------------------------ items, tasks, shoots */
export async function listItems(range: { from: string; to: string }, clientId?: string): Promise<ItemRow[]> {
  let q = db().from("content_items").select("*").gte("publish_date", range.from).lte("publish_date", range.to).order("publish_date").order("publish_time");
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as R[]).map(toItem);
}

export async function listTasks(opts: { to: string; from?: string; clientId?: string; itemIds?: string[]; openOnly?: boolean }): Promise<TaskRow[]> {
  let q = db().from("tasks").select("*").lte("due_date", opts.to).order("due_date");
  if (opts.from) q = q.gte("due_date", opts.from);
  if (opts.clientId) q = q.eq("client_id", opts.clientId);
  if (opts.itemIds) q = q.in("item_id", opts.itemIds.length ? opts.itemIds : ["00000000-0000-0000-0000-000000000000"]);
  if (opts.openOnly) q = q.neq("status", "done");
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as R[]).map(toTask);
}

export async function listShoots(range: { from: string; to: string }, clientId?: string): Promise<ShootRow[]> {
  let q = db().from("shoot_days").select("*").gte("shoot_date", range.from).lte("shoot_date", range.to).order("shoot_date");
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as R[]).map(toShoot);
}

export async function getItem(id: string): Promise<ItemRow | null> {
  const { data, error } = await db().from("content_items").select("*").eq("id", id).maybeSingle();
  fail(error);
  return data ? toItem(data as R) : null;
}

/** Moves an item to a new publish date and recalculates its open tasks. Returns how many tasks changed. */
export async function moveItem(id: string, date: string): Promise<{ changed: number; clientApproved: boolean }> {
  const item = await getItem(id);
  if (!item) throw new Error("Item not found");
  const [tasks, rules, workingDays, shoots] = await Promise.all([
    listTasks({ to: "9999-12-31", itemIds: [id] }),
    loadRules(),
    loadWorkingDays(),
    listShoots({ from: addDays(date, -30), to: date }, item.clientId),
  ]);
  const changes = recalcTasks(tasks, { date, format: item.format }, { shootDates: shoots.filter((s) => s.status !== "cancelled").map((s) => s.date), workingDays, today: todayIST() }, rules);
  fail((await db().from("content_items").update({ publish_date: date, updated_at: new Date().toISOString() }).eq("id", id)).error);
  for (const c of changes) fail((await db().from("tasks").update({ due_date: c.due, label: c.label, late: c.late, updated_at: new Date().toISOString() }).eq("id", c.id)).error);
  return { changed: changes.length, clientApproved: item.clientApproved };
}

export async function updateItem(id: string, patch: { title?: string; hook?: string; cta?: string; captionDraft?: string; notes?: string; assignee?: string | null; assetLinks?: string[] }) {
  const row: R = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title.slice(0, 200);
  if (patch.hook !== undefined) row.hook = patch.hook.slice(0, 500);
  if (patch.cta !== undefined) row.cta = patch.cta.slice(0, 200);
  if (patch.captionDraft !== undefined) row.caption_draft = patch.captionDraft.slice(0, 4000);
  if (patch.notes !== undefined) row.notes = patch.notes.slice(0, 4000);
  if (patch.assignee !== undefined) row.assignee = patch.assignee;
  if (patch.assetLinks !== undefined) row.asset_links = patch.assetLinks.slice(0, 20);
  fail((await db().from("content_items").update(row).eq("id", id)).error);
}

/** Updates a task's status (or note) and keeps its item's stage in step. */
export async function updateTask(id: string, patch: { status?: TaskStatus; blockedReason?: string; note?: string }, actor: string): Promise<{ itemId: string; clientId: string }> {
  const row: R = { updated_at: new Date().toISOString() };
  if (patch.status) {
    row.status = patch.status;
    row.blocked_reason = patch.status === "blocked" ? (patch.blockedReason ?? "").slice(0, 500) : "";
    row.completed_by = patch.status === "done" ? actor : null;
    row.completed_at = patch.status === "done" ? new Date().toISOString() : null;
  }
  if (patch.note !== undefined) row.note = patch.note.slice(0, 2000);
  const { data, error } = await db().from("tasks").update(row).eq("id", id).select("item_id, client_id, step").single();
  fail(error);
  const itemId = (data as R).item_id as string;
  const all = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
  const stage = deriveStage(all);
  const itemPatch: R = { stage, updated_at: new Date().toISOString() };
  if ((data as R).step === "client_approval") itemPatch.client_approved_at = patch.status === "done" ? new Date().toISOString() : null;
  fail((await db().from("content_items").update(itemPatch).eq("id", itemId)).error);
  return { itemId, clientId: (data as R).client_id as string };
}

export async function updateShoot(id: string, patch: { status?: ShootStatus; location?: string; shooter?: string | null }) {
  const row: R = {};
  if (patch.status) row.status = patch.status;
  if (patch.location !== undefined) row.location = patch.location.slice(0, 200);
  if (patch.shooter !== undefined) row.shooter = patch.shooter;
  fail((await db().from("shoot_days").update(row).eq("id", id)).error);
}

/* ------------------------------------------------------------------ onboarding + activity */
export async function listOnboarding(clientId: string): Promise<OnboardingRow[]> {
  const { data, error } = await db().from("onboarding_items").select("*").eq("client_id", clientId).order("kind").order("label");
  fail(error);
  return ((data ?? []) as R[]).map((r) => ({ id: r.id as string, kind: r.kind as string, label: r.label as string, platform: r.platform as string, done: Boolean(r.done), doneBy: (r.done_by as string) ?? null, doneAt: (r.done_at as string) ?? null }));
}

export async function setOnboarding(id: string, done: boolean, actor: string): Promise<string> {
  const { data, error } = await db().from("onboarding_items").update({ done, done_by: done ? actor : null, done_at: done ? new Date().toISOString() : null }).eq("id", id).select("client_id").single();
  fail(error);
  return (data as R).client_id as string;
}

export async function clientActivity(clientId: string) {
  const { data } = await db().from("audit_log").select("at, actor_email, action, target, details").or(`target.eq.${clientId},details->>clientId.eq.${clientId}`).order("at", { ascending: false }).limit(50);
  return ((data ?? []) as R[]).map((r) => ({ at: r.at as string, actor: r.actor_email as string, action: r.action as string, details: r.details as Record<string, unknown> }));
}
