import Link from "next/link";
import { AdminTitle, Notice } from "@/components/admin/AdminShell";
import { ClientsTable } from "@/components/admin/ops/ClientsTable";
import { btn } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllBilling } from "@/lib/admin/billing-data";
import { listClients, listItems, listTasks } from "@/lib/admin/ops-data";
import { addDays, dayOf } from "@/lib/engine/dates";
import { packages } from "@/lib/engine/packages";
import { inr } from "@/lib/ops/billing";
import { todayIST } from "@/lib/ops/deadlines";

export const metadata = { title: "Clients" };

export default async function Clients({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const admin = await requireAdmin();
  const next = (await searchParams)?.next === "approvals" ? "approvals" : undefined;
  const today = todayIST();
  const [clients, tasks, items, billing] = await Promise.all([
    listClients(),
    listTasks({ to: addDays(today, -1), openOnly: true }),
    listItems({ from: addDays(today, -30), to: addDays(today, 60) }),
    admin.role === "owner" ? listAllBilling() : [],
  ]);
  const rows = clients.map((c) => {
    const fee = billing.find((b) => b.clientId === c.id)?.monthlyFee;
    return {
      id: c.id,
      name: c.name,
      category: c.category,
      colour: c.colour,
      status: c.status,
      city: c.city,
      packageName: packages[c.package]?.name ?? c.package,
      renewalDate: c.renewalDate,
      renewIn: c.renewalDate ? dayOf(today, c.renewalDate) - 1 : null,
      overdue: tasks.filter((t) => t.clientId === c.id).length,
      waiting: items.filter((x) => x.clientId === c.id && x.stage === "client_review").length,
      fee: fee != null ? `${inr(fee)}/mo` : null,
    };
  });
  return (
    <>
      <AdminTitle title="Clients" actions={<Link href="/admin/clients/new" className={btn}>Add a client</Link>} />
      {next === "approvals" && <div className="mb-4"><Notice>Choose the client whose posts you want to send for approval.</Notice></div>}
      <ClientsTable clients={rows} next={next} />
    </>
  );
}
