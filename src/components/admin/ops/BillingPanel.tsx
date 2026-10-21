"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoiceAction, saveBillingAction, saveInvoiceAction } from "@/app/admin/(panel)/billing/actions";
import { inr, invoiceState, PAY_MODES, type Invoice } from "@/lib/ops/billing";
import { Notice } from "../AdminShell";
import { btn, btnSmall, field, fmtDay } from "./ui";
import { useConfirm } from "../shell/Confirm";

const label = "block text-[12px] font-semibold";
const tone = { due: "bg-gold-100 text-gold-700", paid: "bg-ink text-paper", overdue: "bg-red-50 text-red-900 ring-1 ring-red-800/40" } as const;

export function InvoiceBadge({ state }: { state: keyof typeof tone }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${tone[state]}`}>{state}</span>;
}

type Draft = { id?: string; number: string; issuedOn: string; dueOn: string; amount: string; status: string; paidOn: string; mode: string; notes: string };

/** Owner only: fees and invoice records for one client (tracking only — no payments are taken here). */
export function BillingPanel({ clientId, monthlyFee, optimizationFee, invoices, today, nextNumber }: { clientId: string; monthlyFee: number | null; optimizationFee: number | null; invoices: Invoice[]; today: string; nextNumber: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [fees, setFees] = useState({ monthly: monthlyFee?.toString() ?? "", optimization: optimizationFee?.toString() ?? "" });
  const blank: Draft = { number: nextNumber, issuedOn: today, dueOn: today, amount: monthlyFee?.toString() ?? "", status: "due", paidOn: "", mode: "", notes: "" };
  const [d, setD] = useState<Draft>(blank);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const done = (res: { ok: boolean; error?: string }, text: string) => {
    setMsg(res.ok ? { tone: "ok", text } : { tone: "error", text: res.error ?? "Could not save." });
    if (res.ok) router.refresh();
    return res.ok;
  };

  return (
    <div className="space-y-4">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          done(await saveBillingAction(clientId, fees.monthly, fees.optimization), "Fees saved.");
        }}
      >
        <label className={label}>Monthly fee (₹)<input inputMode="decimal" value={fees.monthly} onChange={(e) => setFees({ ...fees, monthly: e.target.value })} className={`mt-1 block w-40 ${field}`} /></label>
        <label className={label}>One-time optimization fee (₹)<input inputMode="decimal" value={fees.optimization} onChange={(e) => setFees({ ...fees, optimization: e.target.value })} className={`mt-1 block w-40 ${field}`} /></label>
        <button className={btn}>Save fees</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-cream/60"><tr><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Due</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Paid</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {invoices.length ? invoices.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{i.number}</td>
                <td className="px-3 py-2">{fmtDay(i.issuedOn)}</td>
                <td className="px-3 py-2">{fmtDay(i.dueOn)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(i.amount)}</td>
                <td className="px-3 py-2"><InvoiceBadge state={invoiceState(i, today)} /></td>
                <td className="px-3 py-2">{i.paidOn ? `${fmtDay(i.paidOn)}${i.mode ? ` · ${PAY_MODES.find((m) => m.id === i.mode)?.label}` : ""}` : "—"}</td>
                <td className="space-x-1 px-3 py-2 text-right">
                  <button type="button" className={btnSmall} onClick={() => setD({ id: i.id, number: i.number, issuedOn: i.issuedOn, dueOn: i.dueOn, amount: String(i.amount), status: i.status === "overdue" ? "due" : i.status, paidOn: i.paidOn ?? "", mode: i.mode, notes: i.notes })}>Edit</button>
                  <button type="button" className={btnSmall} onClick={async () => (await confirm({ title: `Delete invoice ${i.number}?`, body: "The record is removed for good. To change it instead, use Edit.", action: "Delete invoice", danger: true })) && done(await deleteInvoiceAction(i.id, clientId), "Invoice deleted.")}>Delete</button>
                </td>
              </tr>
            )) : <tr><td colSpan={7} className="px-3 py-3 text-muted">No invoices recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-dashed border-ink/30 p-4 sm:grid-cols-3 lg:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (done(await saveInvoiceAction({ ...d, clientId }), d.id ? "Invoice updated." : "Invoice added.")) setD({ ...blank, number: "" });
        }}
      >
        <p className="font-semibold sm:col-span-3 lg:col-span-4">{d.id ? `Edit invoice ${d.number}` : "Record an invoice"}</p>
        <label className={label}>Number<input required value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Invoice date<input type="date" required value={d.issuedOn} onChange={(e) => setD({ ...d, issuedOn: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Due date<input type="date" required value={d.dueOn} onChange={(e) => setD({ ...d, dueOn: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Amount (₹)<input required inputMode="decimal" value={d.amount} onChange={(e) => setD({ ...d, amount: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>
          Status
          <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value, paidOn: e.target.value === "paid" && !d.paidOn ? today : d.paidOn })} className={`mt-1 w-full ${field}`}>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        {d.status === "paid" && (
          <>
            <label className={label}>Paid on<input type="date" required value={d.paidOn} onChange={(e) => setD({ ...d, paidOn: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>
              Mode
              <select value={d.mode} onChange={(e) => setD({ ...d, mode: e.target.value })} className={`mt-1 w-full ${field}`}>
                {PAY_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
          </>
        )}
        <label className={`${label} sm:col-span-3 lg:col-span-4`}>Notes<input value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <div className="flex gap-2 sm:col-span-3 lg:col-span-4">
          <button className={btn}>{d.id ? "Save changes" : "Add invoice"}</button>
          {d.id && <button type="button" className={btnSmall} onClick={() => setD(blank)}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
