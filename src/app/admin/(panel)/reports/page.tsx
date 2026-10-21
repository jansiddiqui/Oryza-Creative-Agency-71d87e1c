import Link from "next/link";
import { AdminTitle, fmtWhen } from "@/components/admin/AdminShell";
import { ReportsTable } from "@/components/admin/ops/ListTables";
import { btnSmall } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients } from "@/lib/admin/ops-data";
import { reportsForMonth } from "@/lib/admin/reports-data";
import { todayIST } from "@/lib/ops/deadlines";
import { monthLabel, monthStart } from "@/lib/ops/report";
import { CLIENT_STATUSES } from "@/lib/ops/types";

export const metadata = { title: "Reports" };

const shiftMonth = (m: string, n: number) => {
  const d = new Date(m + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

/** Monthly reports for every client (existing data only). Defaults to last month — the one being reported. */
export default async function Reports({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const { month: m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? `${m}-01` : shiftMonth(monthStart(todayIST()), -1);
  const [clients, reports] = await Promise.all([listClients(), reportsForMonth(month)]);
  const rows = clients
    .filter((c) => c.status !== "ended" || reports.some((r) => r.clientId === c.id))
    .map((c) => {
      const r = reports.find((x) => x.clientId === c.id);
      return {
        clientId: c.id,
        client: c.name,
        colour: c.colour,
        status: CLIENT_STATUSES.find((s) => s.id === c.status)?.label ?? c.status,
        recorded: r?.recorded ?? 0,
        updated: r ? `${fmtWhen(r.updatedAt)} · ${r.updatedBy}` : "",
        href: `/admin/clients/${c.id}/reports/${month.slice(0, 7)}`,
      };
    });
  return (
    <>
      <AdminTitle
        title={`Reports · ${monthLabel(month)}`}
        intro="Enter each client's real numbers from the platforms' insights. Blank stays “Not recorded”."
        actions={
          <span className="flex gap-2">
            <Link href={`/admin/reports?month=${shiftMonth(month, -1).slice(0, 7)}`} className={btnSmall} aria-label="Previous month">←</Link>
            <Link href={`/admin/reports?month=${shiftMonth(month, 1).slice(0, 7)}`} className={btnSmall} aria-label="Next month">→</Link>
          </span>
        }
      />
      <ReportsTable rows={rows} />
    </>
  );
}
