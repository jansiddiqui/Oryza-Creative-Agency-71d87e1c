import { AdminTitle } from "@/components/admin/AdminShell";
import { TeamView } from "@/components/admin/ops/TeamView";
import { WarningsPanel } from "@/components/admin/ops/WarningsPanel";
import { requireAdmin } from "@/lib/admin/auth";
import { listTasks, listTeam } from "@/lib/admin/ops-data";
import { listLeave, loadCapacity, loadEstimates, loadWarnings, toMember } from "@/lib/admin/team-data";
import { addDays } from "@/lib/engine/dates";
import { mondayOf } from "@/lib/ops/calendar";
import { todayIST } from "@/lib/ops/deadlines";
import { daysFrom, workload } from "@/lib/ops/team";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  await requireAdmin();
  const { week } = await searchParams;
  const today = todayIST();
  const start = mondayOf(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : today);
  const days = daysFrom(start, 7);
  const range = { from: days[0], to: days[6] };
  const [tasks, team, est, capacity, leave, warnings] = await Promise.all([
    listTasks({ ...range, openOnly: true }),
    listTeam(),
    loadEstimates(),
    loadCapacity(),
    listLeave(today),
    loadWarnings(range, days),
  ]);
  const allLeave = await listLeave(range.from);
  const rows = workload(tasks, team.map(toMember), days, est, { capacity, leave: allLeave }).map((r) => ({ email: r.member.email, name: r.member.name, active: r.member.active, days: r.days, tasks: r.tasks, hours: r.hours }));
  return (
    <>
      <AdminTitle title="Team" intro="Who has how much work, leave, and clashes to fix. Hours are estimates per task step (owners set them in Settings)." />
      <WarningsPanel warnings={warnings} limit={20} title="Warnings this week" />
      <TeamView week={days} prev={addDays(start, -7)} next={addDays(start, 7)} today={today} rows={rows} team={team} leave={leave} />
    </>
  );
}
