import Link from "next/link";
import { AdminTitle } from "@/components/admin/AdminShell";
import { InvoiceBadge } from "@/components/admin/ops/BillingPanel";
import { ClientDot, Empty, fmtDay, Section } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllBilling, listInvoices } from "@/lib/admin/billing-data";
import { listClients } from "@/lib/admin/ops-data";
import { billingSummary, inr } from "@/lib/ops/billing";
import { todayIST } from "@/lib/ops/deadlines";

export const metadata = { title: "Payments" };

/** Owner only: dues this month, overdue invoices and upcoming renewals (tracking only; no payment gateway). */
export default async function Billing() {
  await requireAdmin("owner");
  const today = todayIST();
  const [clients, invoices, billing] = await Promise.all([listClients(), listInvoices(), listAllBilling()]);
  const s = billingSummary(invoices, clients, today);
  const client = new Map(clients.map((c) => [c.id, c]));
  const fee = new Map(billing.map((b) => [b.clientId, b]));
  const row = (i: (typeof s.overdue)[number]) => {
    const c = client.get(i.clientId);
    return (
      <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-[14px]">
        <ClientDot colour={c?.colour ?? "#000"} />
        <Link href={`/admin/clients/${i.clientId}#billing`} className="min-w-0 flex-1 font-semibold underline-offset-4 hover:underline">{c?.name ?? "Client"}</Link>
        <span className="text-muted">{i.number} · due {fmtDay(i.dueOn)}</span>
        <span className="tabular-nums font-semibold">{inr(i.amount)}</span>
        <InvoiceBadge state={i.state} />
      </li>
    );
  };
  return (
    <>
      <AdminTitle title="Payments" intro="Owners only. Records of fees, invoices and renewals — no money moves through this site." />
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Overdue", s.totals.overdue, s.overdue.length],
          ["Due this month", s.totals.dueThisMonth, s.dueThisMonth.length],
          ["Paid this month", s.totals.paidThisMonth, s.paidThisMonth.length],
        ].map(([l, amt, n]) => (
          <div key={l as string} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-[13px] text-muted">{l}</p>
            <p className={`mt-1 font-display text-3xl tabular-nums ${l === "Overdue" && (amt as number) > 0 ? "text-red-900" : ""}`}>{inr(amt as number)}</p>
            <p className="text-[12px] text-muted">{n} invoice{n === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-x-8 lg:grid-cols-2">
        <Section title="Overdue" count={s.overdue.length}>
          {s.overdue.length ? <ul className="divide-y divide-line rounded-2xl border border-red-800/30 bg-paper">{s.overdue.map(row)}</ul> : <Empty>Nothing overdue.</Empty>}
        </Section>
        <Section title="Due this month" count={s.dueThisMonth.length}>
          {s.dueThisMonth.length ? <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">{s.dueThisMonth.map(row)}</ul> : <Empty>Nothing else due this month.</Empty>}
        </Section>
      </div>
      <Section title="Renewals in the next 30 days" count={s.renewals.length}>
        {s.renewals.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
            {s.renewals.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-[14px]">
                <ClientDot colour={c.colour} />
                <Link href={`/admin/clients/${c.id}#billing`} className="min-w-0 flex-1 font-semibold underline-offset-4 hover:underline">{c.name}</Link>
                <span className="text-muted">renews {fmtDay(c.renewalDate!)}</span>
                <span className="tabular-nums">{fee.get(c.id)?.monthlyFee != null ? `${inr(fee.get(c.id)!.monthlyFee!)} / month` : "Fee not recorded"}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>No renewals in the next 30 days.</Empty>}
      </Section>
    </>
  );
}
