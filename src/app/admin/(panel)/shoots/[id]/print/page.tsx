import { notFound } from "next/navigation";
import { WhatsAppShare } from "@/components/admin/ops/ShareButtons";
import { ShotList } from "@/components/admin/ops/ShootView";
import { PrintButton } from "@/components/admin/ops/share/PrintButton";
import { fmtDay } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listTeam } from "@/lib/admin/ops-data";
import { shootDetail } from "@/lib/admin/shoots-data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Shoot sheet" };

/** A phone-friendly, printable shoot sheet for the shooter (who signs in like everyone on the team). */
export default async function ShootSheet({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const detail = await shootDetail(id);
  if (!detail || !detail.client) notFound();
  const { shoot, client, fed, shots, consent } = detail;
  const shooter = (await listTeam()).find((m) => m.email === shoot.shooter);
  const when = `${fmtDay(shoot.date)}${shoot.startTime ? `, ${shoot.startTime}${shoot.endTime ? `–${shoot.endTime}` : ""}` : ""}`;
  const lines = [`Shoot: ${client.name} — ${when}`];
  if (shoot.location) lines.push(`Where: ${shoot.location}`);
  if (shoot.people) lines.push(`People: ${shoot.people}`);
  if (shoot.props) lines.push(`Props: ${shoot.props}`);
  lines.push("", "Shots:", ...shots.map((s) => `${s.done ? "✓" : "☐"} ${s.label}`));
  if (consent.length) lines.push("", "Consent:", ...consent.map((c) => `• ${c}`));
  return (
    <article className="mx-auto max-w-2xl space-y-5 print:max-w-none">
      <div className="flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        <WhatsAppShare text={lines.join("\n")} label="Send to shooter on WhatsApp" />
      </div>
      <header>
        <p className="text-[13px] font-semibold text-gold-700">Shoot sheet</p>
        <h1 className="font-display text-3xl">{client.name}</h1>
        <p className="mt-1 text-[16px] font-semibold">{when}</p>
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-[15px] sm:grid-cols-[110px_1fr]">
          <dt className="text-muted">Where</dt>
          <dd>{shoot.location || "To confirm"}</dd>
          <dt className="text-muted">Shooter</dt>
          <dd>{shooter?.name ?? "Not assigned"}</dd>
          {shoot.people && (<><dt className="text-muted">People</dt><dd className="whitespace-pre-wrap">{shoot.people}</dd></>)}
          {shoot.props && (<><dt className="text-muted">Props</dt><dd className="whitespace-pre-wrap">{shoot.props}</dd></>)}
          {shoot.notes && (<><dt className="text-muted">Notes</dt><dd className="whitespace-pre-wrap">{shoot.notes}</dd></>)}
        </dl>
      </header>
      {consent.length > 0 && (
        <section className="break-inside-avoid rounded-2xl border border-gold-500/40 bg-gold-100/40 p-4">
          <h2 className="mb-1 font-semibold">Consent reminders</h2>
          <ul className="list-disc space-y-1 pl-5 text-[14px]">{consent.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      )}
      <section className="rounded-2xl border border-line bg-paper p-4">
        <h2 className="mb-2 font-semibold">Shots ({shots.filter((s) => s.done).length}/{shots.length})</h2>
        <ShotList shots={shots} fed={fed} />
      </section>
    </article>
  );
}
