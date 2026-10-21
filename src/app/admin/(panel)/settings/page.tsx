import { AdminTitle } from "@/components/admin/AdminShell";
import { SettingsView } from "@/components/admin/ops/SettingsView";
import { requireAdmin } from "@/lib/admin/auth";
import { listTeam, loadRules, loadWorkingDays } from "@/lib/admin/ops-data";
import { loadCapacity, loadEstimates } from "@/lib/admin/team-data";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireAdmin("owner");
  const [rules, workingDays, team, estimates, capacity] = await Promise.all([loadRules(), loadWorkingDays(), listTeam(), loadEstimates(), loadCapacity()]);
  return (
    <>
      <AdminTitle title="Settings" intro="Owner only: deadline rules, working days and who does what." />
      <SettingsView rules={rules} workingDays={workingDays} team={team} estimates={estimates} capacity={capacity} />
    </>
  );
}
