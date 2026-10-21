"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { deleteInvoice, saveBilling, saveInvoice } from "@/lib/admin/billing-data";
import { getClient } from "@/lib/admin/ops-data";
import { PAY_MODES, type InvoiceStatus, type PayMode } from "@/lib/ops/billing";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const money = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1e10) throw new Error("Enter amounts as numbers");
  return Math.round(n * 100) / 100;
};
const refresh = () => revalidatePath("/admin", "layout");

/** Owner only: the client's monthly fee and one-time optimization fee. */
export async function saveBillingAction(clientId: string, monthlyFee: string, optimizationFee: string) {
  return adminAction(async (admin) => {
    if (!(await getClient(clientId))) throw new Error("Client not found");
    await saveBilling({ clientId, monthlyFee: money(monthlyFee), optimizationFee: money(optimizationFee) }, admin.email);
    await audit(admin.email, "billing.update", clientId, { clientId });
    refresh();
  }, "owner");
}

/** Owner only: add or update an invoice record. */
export async function saveInvoiceAction(inv: { id?: string; clientId: string; number: string; issuedOn: string; dueOn: string; amount: string; status: string; paidOn: string; mode: string; notes: string }) {
  return adminAction(async (admin) => {
    if (!(await getClient(inv.clientId))) throw new Error("Client not found");
    const number = String(inv.number ?? "").trim().slice(0, 40);
    if (!number) throw new Error("Enter the invoice number");
    if (!ISO.test(inv.issuedOn) || !ISO.test(inv.dueOn) || inv.dueOn < inv.issuedOn) throw new Error("Check the invoice and due dates");
    if (!["due", "paid", "overdue"].includes(inv.status)) throw new Error("status");
    if (inv.status === "paid" && !ISO.test(inv.paidOn)) throw new Error("Enter the date it was paid");
    if (!PAY_MODES.some((m) => m.id === inv.mode)) throw new Error("mode");
    const amount = money(inv.amount);
    if (amount === null) throw new Error("Enter the amount");
    const id = await saveInvoice(
      { id: inv.id || undefined, clientId: inv.clientId, number, issuedOn: inv.issuedOn, dueOn: inv.dueOn, amount, status: inv.status as InvoiceStatus, paidOn: inv.status === "paid" ? inv.paidOn : null, mode: inv.mode as PayMode, notes: String(inv.notes ?? "").slice(0, 1000) },
      admin.email,
    );
    await audit(admin.email, "invoice.update", id, { clientId: inv.clientId, number, status: inv.status, amount });
    refresh();
    return { id };
  }, "owner");
}

export async function deleteInvoiceAction(id: string, clientId: string) {
  return adminAction(async (admin) => {
    await deleteInvoice(id);
    await audit(admin.email, "invoice.update", id, { clientId, deleted: true });
    refresh();
  }, "owner");
}
