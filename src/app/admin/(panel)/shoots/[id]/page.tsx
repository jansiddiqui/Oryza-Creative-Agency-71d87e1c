import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/AdminShell";
import { ShootView } from "@/components/admin/ops/ShootView";
import { WarningsPanel } from "@/components/admin/ops/WarningsPanel";
import { fmtDay } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listTeam } from "@/lib/admin/ops-data";
import { shootDetail } from "@/lib/admin/shoots-data";
import { loadWarnings } from "@/lib/admin/team-data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Shoot day" };

export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const detail = await shootDetail(id);
  if (!detail || !detail.client) notFound();
  const { shoot, client, fed, shots, consent } = detail;
  const [team, warnings] = await Promise.all([listTeam(), loadWarnings({ from: shoot.date, to: shoot.date }, [shoot.date])]);
  const mine = warnings.filter((w) => w.refs.includes(shoot.id) || (w.kind === "over_capacity" && shoot.shooter !== null && w.email === shoot.shooter));
  return (
    <>
      <AdminTitle title={`${client.name} · ${shoot.label}`} intro={`${fmtDay(shoot.date)}${shoot.startTime ? ` · ${shoot.startTime}${shoot.endTime ? `–${shoot.endTime}` : ""}` : ""}${shoot.location ? ` · ${shoot.location}` : ""}`} />
      <WarningsPanel warnings={mine} title="Warnings for this shoot" />
      <ShootView key={`${shoot.id}-${shoot.date}`} shoot={shoot} clientName={client.name} clientId={client.id} shots={shots} fed={fed} consent={consent} team={team} />
    </>
  );
}
