import { AdminTitle } from "@/components/admin/AdminShell";
import { TodayBoard } from "@/components/admin/ops/TodayBoard";
import { requireAdmin } from "@/lib/admin/auth";
import { listClients, listItems, listShoots, listTasks, listTeam } from "@/lib/admin/ops-data";
import { addDays } from "@/lib/engine/dates";
import { todayIST } from "@/lib/ops/deadlines";

export const metadata = { title: "Today" };

export default async function Today({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const admin = await requireAdmin();
  const { who } = await searchParams;
  const today = todayIST();
  const [tasks, items, shoots, clients, team] = await Promise.all([
    listTasks({ to: addDays(today, 3), openOnly: true }),
    listItems({ from: addDays(today, -60), to: addDays(today, 40) }),
    listShoots({ from: today, to: today }),
    listClients(),
    listTeam(),
  ]);
  return (
    <>
      <AdminTitle title="Today" intro="What needs doing now, across every client." />
      <TodayBoard
        tasks={tasks}
        items={items}
        shoots={shoots}
        clients={clients.map(({ id, name, category, colour, status }) => ({ id, name, category, colour, status }))}
        team={team}
        me={admin.email}
        today={today}
        initialMine={who === "me"}
      />
    </>
  );
}
