"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { getClient } from "@/lib/admin/ops-data";
import { createReportLink, getReport, revokeReportLink, saveReport } from "@/lib/admin/reports-data";

const MONTH = /^\d{4}-\d{2}-01$/;

export async function saveReportAction(clientId: string, month: string, input: { metrics: Record<string, Record<string, unknown>>; notes: string; nextFocus: string; topItems: string[] }) {
  return adminAction(async (admin) => {
    if (!MONTH.test(month)) throw new Error("month");
    if (!(await getClient(clientId))) throw new Error("Client not found");
    const id = await saveReport(clientId, month, { metrics: input.metrics ?? {}, notes: String(input.notes ?? ""), nextFocus: String(input.nextFocus ?? ""), topItems: (input.topItems ?? []).map(String) }, admin.email);
    await audit(admin.email, "report.update", id, { clientId, month });
    revalidatePath("/admin", "layout");
    return { id };
  });
}

/** A 7-day signed link to the report for the client. */
export async function shareReportAction(clientId: string, month: string) {
  return adminAction(async (admin) => {
    const report = await getReport(clientId, month);
    if (!report.id) throw new Error("Save the report first");
    const url = await createReportLink(report.id, admin.email);
    await audit(admin.email, "report.share", report.id, { clientId, month });
    revalidatePath("/admin", "layout");
    return { url };
  });
}

export async function revokeReportLinkAction(id: string, clientId: string) {
  return adminAction(async (admin) => {
    await revokeReportLink(id, admin.email);
    await audit(admin.email, "report.share", id, { clientId, revoked: true });
    revalidatePath("/admin", "layout");
  });
}
