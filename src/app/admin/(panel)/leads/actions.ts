"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";
import { updateLead } from "@/lib/leads";

export async function updateLeadAction(id: string, status: string, notes: string) {
  return adminAction(async (admin) => {
    if (!LEAD_STATUSES.some((s) => s.id === status)) throw new Error("bad status");
    await updateLead(id, { status: status as LeadStatus, notes: notes.slice(0, 4000) }, admin.email);
    await audit(admin.email, "lead.update", id, { status });
    revalidatePath("/admin/leads");
  });
}
