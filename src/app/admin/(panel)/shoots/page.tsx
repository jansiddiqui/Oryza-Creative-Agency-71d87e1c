import { AdminTitle } from "@/components/admin/AdminShell";
import { ShootsTable } from "@/components/admin/ops/ListTables";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients, listShoots, listTeam } from "@/lib/admin/ops-data";
import { addDays } from "@/lib/engine/dates";
import { todayIST } from "@/lib/ops/deadlines";
import { slotsOverlap } from "@/lib/ops/team";

export const metadata = { title: "Shoots" };

/** Every client's shoot days (existing data only): upcoming first, clashes flagged. */
export default async function Shoots() {
  await requireAdmin();
  const today = todayIST();
  const [shoots, clients, team] = await Promise.all([listShoots({ from: addDays(today, -60), to: addDays(today, 120) }), listClients(), listTeam()]);
  const client = new Map(clients.map((c) => [c.id, c]));
  const clash = (s: (typeof shoots)[number]) => shoots.some((o) => o.id !== s.id && o.shooter && o.shooter === s.shooter && o.date === s.date && o.status !== "cancelled" && s.status !== "cancelled" && slotsOverlap(o, s));
  return (
    <>
      <AdminTitle title="Shoots" intro="Shoot days across all clients. Open one to plan the shot list, people and props." />
      <ShootsTable
        today={today}
        rows={shoots.map((s) => ({
          id: s.id,
          date: s.date,
          time: s.startTime ? `${s.startTime}${s.endTime ? `–${s.endTime}` : ""}` : "",
          client: client.get(s.clientId)?.name ?? "Client",
          colour: client.get(s.clientId)?.colour ?? "#999",
          label: s.label,
          location: s.location,
          shooter: team.find((m) => m.email === s.shooter)?.name ?? "",
          shots: s.shots.length,
          status: s.status,
          clash: clash(s),
        }))}
      />
    </>
  );
}
