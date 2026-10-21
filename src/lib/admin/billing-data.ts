import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import type { Invoice, InvoiceStatus, PayMode } from "@/lib/ops/billing";

/** Billing records (tracking only). Callers must already have checked the admin is an owner. */
const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};
type R = Record<string, unknown>;

export interface Billing {
  clientId: string;
  monthlyFee: number | null;
  optimizationFee: number | null;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const toInvoice = (r: R): Invoice => ({
  id: r.id as string,
  clientId: r.client_id as string,
  number: r.number as string,
  issuedOn: r.issued_on as string,
  dueOn: r.due_on as string,
  amount: Number(r.amount),
  status: r.status as InvoiceStatus,
  paidOn: (r.paid_on as string) ?? null,
  mode: ((r.mode as string) ?? "") as PayMode,
  notes: (r.notes as string) ?? "",
});

export async function getBilling(clientId: string): Promise<Billing> {
  const { data } = await db().from("client_billing").select("*").eq("client_id", clientId).maybeSingle();
  return { clientId, monthlyFee: num((data as R | null)?.monthly_fee), optimizationFee: num((data as R | null)?.optimization_fee) };
}

export async function listAllBilling(): Promise<Billing[]> {
  const { data } = await db().from("client_billing").select("*");
  return ((data ?? []) as R[]).map((r) => ({ clientId: r.client_id as string, monthlyFee: num(r.monthly_fee), optimizationFee: num(r.optimization_fee) }));
}

export async function saveBilling(b: Billing, actor: string) {
  fail((await db().from("client_billing").upsert({ client_id: b.clientId, monthly_fee: b.monthlyFee, optimization_fee: b.optimizationFee, updated_by: actor, updated_at: new Date().toISOString() })).error);
}

export async function listInvoices(clientId?: string): Promise<Invoice[]> {
  let q = db().from("invoices").select("*").order("issued_on", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as R[]).map(toInvoice);
}

export async function saveInvoice(inv: Omit<Invoice, "id"> & { id?: string }, actor: string): Promise<string> {
  const row = {
    client_id: inv.clientId,
    number: inv.number,
    issued_on: inv.issuedOn,
    due_on: inv.dueOn,
    amount: inv.amount,
    status: inv.status,
    paid_on: inv.status === "paid" ? inv.paidOn : null,
    mode: inv.mode,
    notes: inv.notes,
  };
  if (inv.id) {
    fail((await db().from("invoices").update(row).eq("id", inv.id)).error);
    return inv.id;
  }
  const { data, error } = await db().from("invoices").insert({ ...row, created_by: actor }).select("id").single();
  fail(error);
  return (data as R).id as string;
}

export async function deleteInvoice(id: string) {
  fail((await db().from("invoices").delete().eq("id", id)).error);
}
