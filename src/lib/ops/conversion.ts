/**
 * Lead → client → plan. A plan-builder lead stores the visitor's answers as {category, ...answers}; converting it
 * reuses those answers and generates the plan with exactly the same planner code as the public site.
 */
import { categories } from "@/data/categories";
import { plannerLoaders } from "@/components/planner/configs";
import type { Plan } from "@/lib/engine/types";
import type { PackageId } from "@/lib/engine/packages";

export interface LeadLike {
  id: string;
  name: string;
  phone: string;
  business: string;
  category: string;
  city: string;
  message: string;
  answers: Record<string, unknown> | null;
}

/** The planner category for a lead: from its stored answers, else matched by the category name it chose. */
export function categoryOfLead(lead: LeadLike): string {
  const fromAnswers = typeof lead.answers?.category === "string" ? lead.answers.category : "";
  if (fromAnswers && plannerLoaders[fromAnswers]) return fromAnswers;
  const byName = categories.find((c) => c.name.toLowerCase() === lead.category.trim().toLowerCase());
  return byName && plannerLoaders[byName.slug] ? byName.slug : "";
}

/** The planner answers stored with a plan-builder lead (without the category key), or null. */
export function answersOfLead(lead: LeadLike): Record<string, unknown> | null {
  if (!lead.answers || typeof lead.answers !== "object") return null;
  const { category: _c, ...rest } = lead.answers;
  void _c;
  return Object.keys(rest).length ? rest : null;
}

/** Client details pre-filled from a lead. */
export function clientFromLead(lead: LeadLike) {
  return {
    name: lead.business.trim() || lead.name.trim(),
    category: categoryOfLead(lead),
    contactPerson: lead.name.trim(),
    phone: lead.phone.trim(),
    city: lead.city.trim(),
    notes: lead.message.trim(),
    leadId: lead.id,
  };
}

/**
 * Generate a client's plan with the public planner's own code path: the category's planner config
 * (same answers clean-up) and the shared engine. The package chosen in admin overrides the answers' package.
 */
export async function generateClientPlan(slug: string, answers: Record<string, unknown>, startDate: string, pkg?: PackageId): Promise<Plan> {
  const load = plannerLoaders[slug];
  if (!load) throw new Error(`No planner for category "${slug}"`);
  const config = await load();
  const a = { ...config.initial, ...answers, ...(pkg && { pkg }) };
  return config.generate(a, startDate);
}

export { defaultRenewal, nextMonthStart } from "./dates";
