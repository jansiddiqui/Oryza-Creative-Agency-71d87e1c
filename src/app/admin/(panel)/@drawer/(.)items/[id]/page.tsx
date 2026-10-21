import { ItemDrawer } from "@/components/admin/ops/ItemDrawer";
import { ItemPanel } from "@/components/admin/ops/ItemPanel";
import { fmtDay, formatLabel, StageBadge } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { loadItemView } from "@/lib/admin/item-view";
import { todayIST } from "@/lib/ops/deadlines";

/** A post opened from Today, the calendar, the board or a client page: a drawer (desktop) or full-screen sheet (phone). */
export default async function ItemDrawerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const view = await loadItemView(id);
  if (!view) return null;
  const { item, client } = view;
  return (
    <ItemDrawer id={id} title={item.title} subtitle={`${client.name} · ${formatLabel(item.format)} · ${fmtDay(item.date)} ${item.time}`} badge={<StageBadge stage={item.stage} />}>
      <ItemPanel view={view} today={todayIST()} drawer />
    </ItemDrawer>
  );
}
