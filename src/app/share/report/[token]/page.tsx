import type { Metadata } from "next";
import { LinkProblem } from "@/components/admin/ops/share/LinkProblem";
import { PrintButton } from "@/components/admin/ops/share/PrintButton";
import { ReportDoc } from "@/components/admin/ops/share/ReportDoc";
import { rateOk } from "@/lib/admin/approvals-data";
import { openReportLink } from "@/lib/admin/reports-data";
import { reportPlatforms } from "@/lib/ops/report";
import { visitorIp } from "../../request";

export const metadata: Metadata = { title: "Monthly report" };

/** A client's shared monthly report (expiring signed link). Rate-limited; nothing shows for a bad link. */
export default async function SharedReport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateOk("share-view", await visitorIp(), 60, 600))) return <LinkProblem state="busy" />;
  const r = await openReportLink(decodeURIComponent(token).slice(0, 200));
  if (r.state !== "ok") return <LinkProblem state={r.state} />;
  return (
    <>
      <div className="mb-6 flex justify-end print:hidden"><PrintButton /></div>
      <ReportDoc clientName={r.client.name} month={r.report.month} platforms={reportPlatforms(r.report.metrics, r.items)} metrics={r.report.metrics} notes={r.report.notes} nextFocus={r.report.nextFocus} delivery={r.delivery} top={r.top} />
    </>
  );
}
