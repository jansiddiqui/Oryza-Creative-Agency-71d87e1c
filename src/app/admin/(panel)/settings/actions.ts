"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { saveRules, saveTeamMember, saveWorkingDays, type TeamMember } from "@/lib/admin/ops-data";
import { TEAM_ROLES, type DeadlineRule } from "@/lib/ops/types";

const ROLE_IDS = TEAM_ROLES.map((r) => r.id as string);
const cleanDays = (d: number[]) => [...new Set(d.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();

/** Owner only: the deadline rule table (offsets in days from the publish date). */
export async function saveRulesAction(rules: DeadlineRule[]) {
  return adminAction(async (admin) => {
    const clean = rules.map((r) => {
      if (!Number.isInteger(r.offset) || r.offset < -30 || r.offset > 7) throw new Error("offset");
      if (!ROLE_IDS.includes(r.role)) throw new Error("role");
      return { ...r, label: r.label.trim().slice(0, 60) || r.step, time: /^(\d{1,2}:\d{2} (am|pm))?$/.test(r.time.trim()) ? r.time.trim() : "6:00 pm" };
    });
    await saveRules(clean);
    await audit(admin.email, "rules.update", "deadline_rules", { rules: clean.length });
    revalidatePath("/admin", "layout");
  }, "owner");
}

/** Owner only: the agency's working days (0 = Sunday … 6 = Saturday). */
export async function saveWorkingDaysAction(days: number[]) {
  return adminAction(async (admin) => {
    const clean = cleanDays(days);
    if (!clean.length) throw new Error("At least one working day is needed");
    await saveWorkingDays(clean, admin.email);
    await audit(admin.email, "settings.update", "working_days", { days: clean });
    revalidatePath("/admin", "layout");
  }, "owner");
}

/** Owner only: a team member's name, roles, working days and whether they get tasks. */
export async function saveTeamMemberAction(m: TeamMember) {
  return adminAction(async (admin) => {
    const clean: TeamMember = {
      email: m.email.toLowerCase(),
      name: m.name.trim().slice(0, 80),
      roles: m.roles.filter((r) => ROLE_IDS.includes(r)),
      workingDays: cleanDays(m.workingDays),
      active: Boolean(m.active),
    };
    await saveTeamMember(clean);
    await audit(admin.email, "team.update", clean.email, { roles: clean.roles, active: clean.active });
    revalidatePath("/admin", "layout");
  }, "owner");
}
