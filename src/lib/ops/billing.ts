/** Renewals and payments (tracking only, no payment gateway). Pure. */
import { addDays } from "@/lib/engine/dates";
import type { ClientStatus } from "./types";

export type InvoiceStatus = "due" | "paid" | "overdue";
export type PayMode = "" | "upi" | "bank" | "cash" | "cheque" | "card" | "other";
export const PAY_MODES: { id: PayMode; label: string }[] = [
  { id: "", label: "—" },
  { id: "upi", label: "UPI" },
  { id: "bank", label: "Bank transfer" },
  { id: "cash", label: "Cash" },
  { id: "cheque", label: "Cheque" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
];

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  issuedOn: string;
  dueOn: string;
  amount: number;
  status: InvoiceStatus;
  paidOn: string | null;
  mode: PayMode;
  notes: string;
}

/** Paid stays paid; an unpaid invoice past its due date is overdue. */
export const invoiceState = (inv: Pick<Invoice, "status" | "dueOn">, today: string): InvoiceStatus =>
  inv.status === "paid" ? "paid" : inv.dueOn < today ? "overdue" : inv.status;

export const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function billingSummary<C extends { id: string; renewalDate: string | null; status: ClientStatus }>(invoices: Invoice[], clients: C[], today: string, days = 30) {
  const ym = today.slice(0, 7);
  const withState = invoices.map((i) => ({ ...i, state: invoiceState(i, today) }));
  const overdue = withState.filter((i) => i.state === "overdue").sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const dueThisMonth = withState.filter((i) => i.state === "due" && i.dueOn.slice(0, 7) === ym).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const paidThisMonth = withState.filter((i) => i.state === "paid" && (i.paidOn ?? "").slice(0, 7) === ym);
  const until = addDays(today, days);
  const renewals = clients
    .filter((c) => c.renewalDate && c.status !== "ended" && c.renewalDate >= today && c.renewalDate <= until)
    .sort((a, b) => a.renewalDate!.localeCompare(b.renewalDate!));
  const sum = (xs: { amount: number }[]) => xs.reduce((s, x) => s + x.amount, 0);
  return { overdue, dueThisMonth, paidThisMonth, renewals, totals: { overdue: sum(overdue), dueThisMonth: sum(dueThisMonth), paidThisMonth: sum(paidThisMonth) } };
}
