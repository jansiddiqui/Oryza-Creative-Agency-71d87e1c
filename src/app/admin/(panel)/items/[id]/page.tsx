import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, fmtWhen } from "@/components/admin/AdminShell";
import { ItemEditorPanel } from "@/components/admin/ops/ItemView";
import { SendForApproval } from "@/components/admin/ops/ApprovalPanel";
import { TaskCard } from "@/components/admin/ops/TodayBoard";
import { btnGhost, ClientDot, fmtDay, formatLabel, PlatformGlyph, Section, StageBadge } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { assetViews, getItemDetail, itemResponses } from "@/lib/admin/approvals-data";
import { getClient, listTasks, listTeam } from "@/lib/admin/ops-data";
import { todayIST } from "@/lib/ops/deadlines";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Content item" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const item = await getItemDetail(id);
  if (!item) notFound();
  const [client, tasks, team, assets, responses] = await Promise.all([getClient(item.clientId), listTasks({ to: "9999-12-31", itemIds: [id] }), listTeam(), assetViews(item.assetLinks), itemResponses(id)]);
  if (!client) notFound();
  const lite = { id: client.id, name: client.name, category: client.category, colour: client.colour, status: client.status };
  const today = todayIST();
  return (
    <>
      <AdminTitle
        title={item.title}
        intro={<span className="flex flex-wrap items-center gap-2"><ClientDot colour={client.colour} /> <Link href={`/admin/clients/${client.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">{client.name}</Link> · <PlatformGlyph platform={item.platform} /> {formatLabel(item.format)} · {fmtDay(item.date)} {item.time} <StageBadge stage={item.stage} />{item.clientApproved && <span className="text-[12px] font-semibold text-gold-700">Client approved</span>}</span>}
        actions={<Link href={`/admin/calendar?date=${item.date}&view=week&client=${client.id}`} className={btnGhost}>Open in calendar</Link>}
      />
      {(item.hook || item.cta) && (
        <p className="mb-6 max-w-3xl text-[15px]"><span className="font-semibold">Hook:</span> {item.hook || "—"} <span className="ml-2 font-semibold">CTA:</span> {item.cta || "—"}</p>
      )}
      {item.complianceNote && <p className="mb-6 rounded-xl border border-gold-500/40 bg-gold-100/50 px-4 py-3 text-[14px]"><span className="font-semibold">Compliance note (locked):</span> {item.complianceNote}</p>}
      <div className="grid gap-x-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Section title="Caption and files"><ItemEditorPanel id={id} captionDraft={item.captionDraft} notes={item.notes} assets={assets} /></Section>
        </div>
        <div>
          <Section title="Client approval">
            <SendForApproval clientId={client.id} clientName={client.name} clientPhone={client.phone} clientEmail={client.email} items={[{ id: item.id, title: item.title, date: item.date, platform: item.platform, format: item.format, clientApproved: item.clientApproved }]} preselect />
            <ul className="mt-3 space-y-1.5 text-[14px]">
              {responses.map((r, i) => (
                <li key={i}><span className={`font-semibold ${r.decision === "approved" ? "" : "text-gold-700"}`}>{r.decision === "approved" ? "Approved" : "Changes requested"}</span> <span className="text-muted">· {fmtWhen(r.at)}</span>{r.comment && <span className="block text-ink-soft">“{r.comment}”</span>}</li>
              ))}
            </ul>
          </Section>
          <Section title="Tasks" count={tasks.length}>
            <ul className="space-y-2">{tasks.map((t) => <TaskCard key={t.id} task={t} item={item} client={lite} team={team} today={today} />)}</ul>
          </Section>
        </div>
      </div>
    </>
  );
}
