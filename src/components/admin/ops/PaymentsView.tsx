"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveInvoiceAction } from "@/app/admin/(panel)/billing/actions";
import { inr, invoiceState, type Invoice } from "@/lib/ops/billing";
import { useToast } from "../shell/Toasts";
import { DataTable, type Column } from "../ui/DataTable";
import { InvoiceBadge } from "./BillingPanel";
import { btnSmall, ClientDot, fmtDay } from "./ui";

type Row = Invoice & { client: string; colour: string };
const asInput = (i: Invoice, patch: Partial<Invoice>) => {
  const v = { ...i, ...patch };
  return { id: v.id, clientId: v.clientId, number: v.number, issuedOn: v.issuedOn, dueOn: v.dueOn, amount: String(v.amount), status: v.status, paidOn: v.paidOn ?? "", mode: v.mode, notes: v.notes };
};

/** Owner only: every invoice with views (overdue, due this month, paid), Mark paid with Undo. */
export function PaymentsView({ invoices: initial, today }: { invoices: Row[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const ym = today.slice(0, 7);
  const update = (id: string, p: Partial<Invoice>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const markPaid = async (list: Row[]) => {
    const prev = list.map((r) => ({ ...r }));
    list.forEach((r) => update(r.id, { status: "paid", paidOn: today }));
    const res = await Promise.all(list.map((r) => saveInvoiceAction(asInput(r, { status: "paid", paidOn: today }))));
    if (res.some((r) => !r.ok)) return toast.show({ message: "Some invoices could not be updated", tone: "error" });
    toast.show({
      message: list.length === 1 ? `${list[0].number} marked paid` : `${list.length} invoices marked paid`,
      undo: async () => {
        prev.forEach((r) => update(r.id, { status: r.status, paidOn: r.paidOn }));
        await Promise.all(prev.map((r) => saveInvoiceAction(asInput(r, {}))));
        router.refresh();
      },
    });
    router.refresh();
  };
  const columns: Column<Row>[] = [
    { key: "number", label: "Invoice", sort: (r) => r.number, card: "title", render: (r) => <span className="font-semibold">{r.number}</span> },
    { key: "client", label: "Client", sort: (r) => r.client, card: "meta", render: (r) => <Link href={`/admin/clients/${r.clientId}?tab=billing`} className="inline-flex items-center gap-2 hover:underline"><ClientDot colour={r.colour} />{r.client}</Link> },
    { key: "due", label: "Due", sort: (r) => r.dueOn, card: "meta", className: "whitespace-nowrap", render: (r) => fmtDay(r.dueOn) },
    { key: "amount", label: "Amount", sort: (r) => r.amount, card: "meta", className: "text-right tabular-nums", render: (r) => inr(r.amount) },
    { key: "status", label: "Status", sort: (r) => ["overdue", "due", "paid"].indexOf(invoiceState(r, today)), card: "badge", render: (r) => <InvoiceBadge state={invoiceState(r, today)} /> },
    { key: "paid", label: "Paid", sort: (r) => r.paidOn ?? "", card: "hide", className: "whitespace-nowrap text-muted", render: (r) => (r.paidOn ? fmtDay(r.paidOn) : "—") },
  ];
  return (
    <DataTable
      id="invoices"
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      initialSort={{ key: "due", dir: "asc" }}
      search={(r) => `${r.number} ${r.client} ${r.notes}`}
      views={[
        { id: "open", label: "Unpaid", test: (r) => invoiceState(r, today) !== "paid" },
        { id: "overdue", label: "Overdue", test: (r) => invoiceState(r, today) === "overdue" },
        { id: "month", label: "Due this month", test: (r) => invoiceState(r, today) === "due" && r.dueOn.slice(0, 7) === ym },
        { id: "paid", label: "Paid this month", test: (r) => invoiceState(r, today) === "paid" && (r.paidOn ?? "").slice(0, 7) === ym },
        { id: "all", label: "All", test: () => true },
      ]}
      bulk={[{ label: "Mark paid today", run: (list) => markPaid(list.filter((r) => r.status !== "paid")) }]}
      actions={(r) => (r.status !== "paid" ? <button type="button" className={btnSmall} onClick={() => markPaid([r])}>Mark paid</button> : null)}
      empty={<p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">No invoices here. Record invoices from a client&apos;s Billing tab.</p>}
    />
  );
}
