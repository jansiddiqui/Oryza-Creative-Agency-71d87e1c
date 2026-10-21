"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import {
  approvePlan,
  clientForLead,
  createClientWithPlan,
  createPlan,
  getClient,
  getPlan,
  savePlanDraft,
  setOnboarding,
  updateClient,
  updateItem,
  updateShoot,
  type NewClient,
} from "@/lib/admin/ops-data";
import { plannerLoaders } from "@/components/planner/configs";
import { packages, type PackageId } from "@/lib/engine/packages";
import { nextMonthStart } from "@/lib/ops/conversion";
import { editWarnings } from "@/lib/ops/rule-check";
import { CLIENT_STATUSES, type ClientStatus, type PlanDraft, type ShootStatus } from "@/lib/ops/types";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-f]{6}$/i;
const refresh = () => revalidatePath("/admin", "layout");

function cleanClient(c: NewClient): NewClient {
  if (!c.name?.trim()) throw new Error("name");
  if (!plannerLoaders[c.category]) throw new Error("category");
  if (!(c.package in packages)) throw new Error("package");
  if (!ISO.test(c.startDate) || (c.renewalDate && !ISO.test(c.renewalDate))) throw new Error("dates");
  return {
    name: c.name.trim().slice(0, 120),
    category: c.category,
    contactPerson: (c.contactPerson ?? "").trim().slice(0, 120),
    phone: (c.phone ?? "").trim().slice(0, 30),
    email: (c.email ?? "").trim().slice(0, 160),
    city: (c.city ?? "").trim().slice(0, 80),
    package: c.package,
    startDate: c.startDate,
    renewalDate: c.renewalDate || null,
    colour: HEX.test(c.colour) ? c.colour : "#8f5e0a",
    notes: (c.notes ?? "").slice(0, 4000),
    leadId: c.leadId || null,
  };
}

/** Lead (or blank) → client + first draft plan + onboarding checklist. */
export async function createClientAction(input: NewClient, answers: Record<string, unknown>) {
  return adminAction(async (admin) => {
    const c = cleanClient(input);
    if (c.leadId && (await clientForLead(c.leadId))) throw new Error("This lead is already a client");
    const { clientId, planId } = await createClientWithPlan(c, answers ?? {}, admin.email);
    await audit(admin.email, "client.create", clientId, { clientId, name: c.name, category: c.category, leadId: c.leadId });
    await audit(admin.email, "plan.generate", planId, { clientId, start: c.startDate, package: c.package });
    refresh();
    return { clientId, planId };
  });
}

export async function updateClientAction(id: string, patch: { name?: string; contactPerson?: string; phone?: string; email?: string; city?: string; package?: string; renewalDate?: string | null; status?: string; notes?: string; colour?: string }) {
  return adminAction(async (admin) => {
    if (patch.status && !CLIENT_STATUSES.some((s) => s.id === patch.status)) throw new Error("status");
    if (patch.package && !(patch.package in packages)) throw new Error("package");
    if (patch.renewalDate && !ISO.test(patch.renewalDate)) throw new Error("date");
    if (patch.colour && !HEX.test(patch.colour)) throw new Error("colour");
    await updateClient(id, { ...patch, package: patch.package as PackageId | undefined, status: patch.status as ClientStatus | undefined }, admin.email);
    await audit(admin.email, "client.update", id, { clientId: id, fields: Object.keys(patch) });
    refresh();
  });
}

export async function savePlanAction(planId: string, draft: PlanDraft) {
  return adminAction(async (admin) => {
    const plan = await getPlan(planId);
    if (!plan) throw new Error("Plan not found");
    const saved = await savePlanDraft(planId, draft);
    await audit(admin.email, "plan.edit", planId, { clientId: plan.clientId, items: saved.items.length });
    refresh();
    return saved;
  });
}

export async function approvePlanAction(planId: string) {
  return adminAction(async (admin) => {
    const plan = await getPlan(planId);
    if (!plan) throw new Error("Plan not found");
    const counts = await approvePlan(planId, admin.email);
    await audit(admin.email, "plan.approve", planId, { clientId: plan.clientId, ...counts });
    refresh();
    return counts;
  });
}

/** Next month's plan: a new draft with the same answers, from the given (or default) start date. */
export async function nextMonthAction(planId: string, start?: string) {
  return adminAction(async (admin) => {
    const plan = await getPlan(planId);
    if (!plan) throw new Error("Plan not found");
    const client = await getClient(plan.clientId);
    if (!client) throw new Error("Client not found");
    const from = start && ISO.test(start) ? start : nextMonthStart(plan.monthStart);
    const id = await createPlan(client.id, client.category, plan.answers, from, client.package, admin.email);
    await audit(admin.email, "plan.generate", id, { clientId: client.id, start: from, from: planId });
    refresh();
    return { planId: id };
  });
}

export async function setOnboardingAction(id: string, done: boolean) {
  return adminAction(async (admin) => {
    const clientId = await setOnboarding(id, done, admin.email);
    await audit(admin.email, "onboarding.update", id, { clientId, done });
    refresh();
  });
}

export async function updateShootAction(id: string, clientId: string, patch: { status?: string; location?: string; shooter?: string | null }) {
  return adminAction(async (admin) => {
    if (patch.status && !["planned", "done", "cancelled"].includes(patch.status)) throw new Error("status");
    await updateShoot(id, { ...patch, status: patch.status as ShootStatus | undefined });
    await audit(admin.email, "shoot.update", id, { clientId, ...patch });
    refresh();
  });
}

export async function updateItemAction(id: string, clientId: string, patch: { title?: string; hook?: string; cta?: string; captionDraft?: string; notes?: string; assignee?: string | null; assetLinks?: string[] }) {
  return adminAction(async (admin) => {
    await updateItem(id, patch);
    await audit(admin.email, "item.update", id, { clientId, fields: Object.keys(patch) });
    refresh();
  });
}

/** The category's wording checks for text typed in the plan editor (run here so the rules stay out of the browser bundle). */
export async function checkWordingAction(planId: string, text: string) {
  return adminAction(async () => {
    const plan = await getPlan(planId);
    if (!plan) throw new Error("Plan not found");
    const client = await getClient(plan.clientId);
    return client ? editWarnings(client.category, text.slice(0, 2000), plan.answers) : [];
  });
}
