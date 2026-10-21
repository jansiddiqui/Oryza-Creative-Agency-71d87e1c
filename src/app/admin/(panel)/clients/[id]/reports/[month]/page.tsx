import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/AdminShell";
import { ReportEditor } from "@/components/admin/ops/ReportEditor";
import { PrintButton } from "@/components/admin/ops/share/PrintButton";
import { ReportDoc } from "@/components/admin/ops/share/ReportDoc";
import { btnGhost, Section } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listPlans } from "@/lib/admin/ops-data";
import { listReportLinks, reportView } from "@/lib/admin/reports-data";
import { monthLabel, reportPlatforms } from "@/lib/ops/report";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const shiftMonth = (m: string, n: number) => {
  const d = new Date(m + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

export const metadata = { title: "Monthly report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string; month: string }> }) {
  await requireAdmin();
  const { id, month: raw } = await params;
  const month = /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : /^\d{4}-\d{2}-01$/.test(raw) ? raw : "";
  if (!UUID.test(id) || !month) notFound();
  const [view, plans] = await Promise.all([reportView(id, month), listPlans(id)]);
  if (!view.client) notFound();
  const { client, report, items, delivery, top } = view;
  const selected = (plans.find((p) => p.monthStart.slice(0, 7) <= month.slice(0, 7))?.answers.platforms as string[] | undefined) ?? [];
  const platforms = reportPlatforms(report.metrics, items, selected);
  const links = report.id ? await listReportLinks(report.id) : [];
  const published = items.filter((x) => x.stage === "published" || x.stage === "done");
  return (
    <>
      <AdminTitle
        title={`Report · ${monthLabel(month)}`}
        intro={<><Link href={`/admin/clients/${client.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">{client.name}</Link>. Enter the numbers from each platform&apos;s insights. Leave a field blank if you did not record it.</>}
        actions={
          <span className="flex gap-2">
            <Link href={`/admin/clients/${id}/reports/${shiftMonth(month, -1).slice(0, 7)}`} className={btnGhost} aria-label="Previous month">←</Link>
            <Link href={`/admin/clients/${id}/reports/${shiftMonth(month, 1).slice(0, 7)}`} className={btnGhost} aria-label="Next month">→</Link>
          </span>
        }
      />
      <Section title="Numbers">
        <ReportEditor
          key={`${report.id}-${report.updatedAt}`}
          clientId={client.id}
          clientName={client.contactPerson || client.name}
          clientPhone={client.phone}
          month={month}
          platforms={platforms}
          metrics={report.metrics}
          notes={report.notes}
          nextFocus={report.nextFocus}
          topItems={report.topItems}
          candidates={(published.length ? published : items).map((x) => ({ id: x.id, title: x.title, date: x.date }))}
          links={links}
          saved={Boolean(report.id)}
        />
      </Section>
      <Section title="Preview">
        <div className="mb-4 flex justify-end"><PrintButton /></div>
        <div className="rounded-2xl border border-line bg-cream/30 p-4 sm:p-6">
          <ReportDoc clientName={client.name} month={month} platforms={platforms} metrics={report.metrics} notes={report.notes} nextFocus={report.nextFocus} delivery={delivery} top={top} />
        </div>
      </Section>
    </>
  );
}
