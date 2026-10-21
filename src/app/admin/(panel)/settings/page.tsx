import { AdminTitle } from "@/components/admin/AdminShell";
import { SETTINGS_TABS, SettingsView, type SettingsTab } from "@/components/admin/ops/SettingsView";
import { requireAdmin } from "@/lib/admin/auth";
import { listTeam, loadRules, loadWorkingDays } from "@/lib/admin/ops-data";
import { loadCapacity, loadEstimates } from "@/lib/admin/team-data";
import { loadOfflineApproval } from "@/lib/admin/board-data";

export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("owner");
  const [rules, workingDays, team, estimates, capacity, allowOffline, sp] = await Promise.all([loadRules(), loadWorkingDays(), listTeam(), loadEstimates(), loadCapacity(), loadOfflineApproval(), searchParams]);
  const tab = SETTINGS_TABS.some((t) => t.id === sp.tab) ? (sp.tab as SettingsTab) : "workload";
  return (
    <>
      <AdminTitle title="Settings" intro="Owner only: working days, deadline rules, who does what and how approvals work." />
      <SettingsView rules={rules} workingDays={workingDays} team={team} estimates={estimates} capacity={capacity} allowOffline={allowOffline} tab={tab} />
    </>
  );
}
