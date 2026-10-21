import Link from "next/link";
import { AdminTitle } from "@/components/admin/AdminShell";
import { btn, catLabel, ClientDot, Empty, fmtDay } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients } from "@/lib/admin/ops-data";
import { packages } from "@/lib/engine/packages";
import { CLIENT_STATUSES } from "@/lib/ops/types";

export const metadata = { title: "Clients" };

export default async function Clients() {
  await requireAdmin();
  const clients = await listClients();
  return (
    <>
      <AdminTitle title="Clients" intro="Every client, their package and renewal. Convert a lead from the Leads page, or add a client directly." actions={<Link href="/admin/clients/new" className={btn}>Add a client</Link>} />
      {!clients.length ? (
        <Empty>No clients yet. Open a lead and choose “Convert to client”.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clients/${c.id}`} className="flex flex-col gap-1 p-4 hover:bg-cream/50 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold"><ClientDot colour={c.colour} /> {c.name}</span>
                <span className="text-[13px] text-muted">{catLabel(c.category)} · {packages[c.package]?.name} · {c.city || "—"}</span>
                <span className="text-[13px] text-muted">{c.renewalDate ? `Renews ${fmtDay(c.renewalDate)}` : "No renewal date"}</span>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-[12px] font-semibold">{CLIENT_STATUSES.find((s) => s.id === c.status)?.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
