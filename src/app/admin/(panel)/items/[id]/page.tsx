import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/AdminShell";
import { ItemPanel } from "@/components/admin/ops/ItemPanel";
import { btnGhost, ClientDot, fmtDay, formatLabel, PlatformGlyph, StageBadge } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { loadItemView } from "@/lib/admin/item-view";
import { todayIST } from "@/lib/ops/deadlines";

export const metadata = { title: "Post" };

/** A content item on its own page (opened directly). From inside the admin it opens as a drawer instead. */
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const view = await loadItemView((await params).id);
  if (!view) notFound();
  const { item, client } = view;
  return (
    <>
      <AdminTitle
        crumb={<><Link href={`/admin/clients/${client.id}`} className="hover:underline">{client.name}</Link> / Content</>}
        title={item.title}
        intro={<span className="flex flex-wrap items-center gap-2"><ClientDot colour={client.colour} /><PlatformGlyph platform={item.platform} />{formatLabel(item.format)} · {fmtDay(item.date)} {item.time} <StageBadge stage={item.stage} /></span>}
        actions={<Link href={`/admin/calendar?date=${item.date}&view=week&client=${client.id}`} className={btnGhost}>Open in calendar</Link>}
      />
      <ItemPanel view={view} today={todayIST()} />
    </>
  );
}
