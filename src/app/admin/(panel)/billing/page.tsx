import Link from "next/link";
import { AdminTitle } from "@/components/admin/AdminShell";
import { PaymentsView } from "@/components/admin/ops/PaymentsView";
import { card, ClientDot, Empty, fmtDay, Section } from "@/components/admin/ops/ui";
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
  const tiles: [string, number, number, boolean][] = [
    ["Overdue", s.totals.overdue, s.overdue.length, s.totals.overdue > 0],
    ["Due this month", s.totals.dueThisMonth, s.dueThisMonth.length, false],
    ["Paid this month", s.totals.paidThisMonth, s.paidThisMonth.length, false],
  ];
  return (
    <>
      <AdminTitle title="Payments" intro="Owners only. Records of fees, invoices and renewals — no money moves through this site." />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map(([l, amt, n, bad]) => (
          <div key={l} className={`${card} p-4`}>
            <p className="text-[13px] font-semibold text-muted">{l}</p>
            <p className={`mt-1 text-[26px] font-bold leading-[30px] tabular-nums ${bad ? "text-bad" : ""}`}>{inr(amt)}</p>
            <p className="text-[12px] text-muted">{n} invoice{n === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>
      <Section title="Invoices">
        <PaymentsView today={today} invoices={invoices.map((i) => ({ ...i, client: client.get(i.clientId)?.name ?? "Client", colour: client.get(i.clientId)?.colour ?? "#999" }))} />
      </Section>
      <Section title="Renewals in the next 30 days" count={s.renewals.length}>
        {s.renewals.length ? (
          <ul className={`${card} divide-y divide-edge`}>
            {s.renewals.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clients/${c.id}?tab=billing`} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[14px] hover:bg-surface-2/60">
                  <ClientDot colour={c.colour} />
                  <span className="min-w-0 flex-1 font-semibold">{c.name}</span>
                  <span className="text-muted">renews {fmtDay(c.renewalDate!)}</span>
                  <span className="tabular-nums">{fee.get(c.id)?.monthlyFee != null ? `${inr(fee.get(c.id)!.monthlyFee!)} / month` : "Fee not recorded"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty>No renewals in the next 30 days.</Empty>}
      </Section>
    </>
  );
}
