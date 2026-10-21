import type { Metadata } from "next";
import { ApprovalView } from "@/components/admin/ops/share/ApprovalView";
import { LinkProblem } from "@/components/admin/ops/share/LinkProblem";
import { fmtDay, formatLabel } from "@/components/admin/ops/ui";
import { platformById, type PlatformId } from "@/data/platforms";
import { openApprovalLink, rateOk } from "@/lib/admin/approvals-data";
import { visitorIp } from "../../request";

export const metadata: Metadata = { title: "Approve your posts" };

const MARK: Record<string, string> = { instagram: "IG", facebook: "FB", whatsapp: "WA", youtube: "YT", gbp: "G", website: "W", linkedin: "in", x: "X", pinterest: "P" };

/** The client's approval page. Rate-limited (60 views per 10 minutes per visitor) and shown only for a valid link. */
export default async function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateOk("share-view", await visitorIp(), 60, 600))) return <LinkProblem state="busy" />;
  const opened = await openApprovalLink(decodeURIComponent(token).slice(0, 200));
  if (opened.state !== "ok") return <LinkProblem state={opened.state} />;
  const until = new Date(opened.link.expiresAt).toLocaleString("en-IN", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const items = opened.items.map((x) => ({
    id: x.id,
    platformName: platformById[x.platform as PlatformId]?.name ?? x.platform,
    platformMark: MARK[x.platform] ?? x.platform.slice(0, 2).toUpperCase(),
    formatLabel: formatLabel(x.format),
    when: `${fmtDay(x.date)}${x.time ? ` · ${x.time}` : ""}`,
    title: x.title,
    captionDraft: x.captionDraft,
    hook: x.hook,
    cta: x.cta,
    complianceNote: x.complianceNote,
    assets: x.assets,
    decision: x.decision,
    comment: x.comment,
  }));
  return <ApprovalView token={decodeURIComponent(token)} clientName={opened.client.name} until={until} label={opened.link.label} items={items} />;
}
