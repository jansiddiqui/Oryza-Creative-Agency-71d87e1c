"use client";

import { AdminTitle, fmtWhen } from "./AdminShell";
import { Badge, type Tone } from "./ops/ui";
import { DataTable, type Column } from "./ui/DataTable";

export type AuditRow = { id: number; at: string; actor_email: string; action: string; target: string; details: Record<string, unknown> };

const verb: Record<string, string> = {
  "image.upload": "uploaded an image for",
  "image.approve": "approved and published",
  "image.replace": "replaced the live image of",
  "image.rollback": "restored an earlier version of",
  "image.remove": "took the image off",
  "image.delete": "deleted a version of",
  "image.focal": "moved the focal point of",
  "lead.update": "updated lead",
  "user.add": "gave admin access to",
  "user.update": "changed access for",
  "client.create": "added a client",
  "client.update": "updated a client",
  "plan.generate": "generated a plan",
  "plan.edit": "edited a plan draft",
  "plan.approve": "approved a plan",
  "item.move": "moved a post",
  "item.update": "updated a post",
  "task.update": "updated a task",
  "task.reassign": "reassigned work",
  "shoot.update": "updated a shoot",
  "shoot.move": "moved a shoot",
  "shot.update": "updated a shot list",
  "onboarding.update": "updated onboarding",
  "team.update": "updated a team member",
  "rules.update": "changed deadline rules",
  "settings.update": "changed a setting",
  "leave.update": "updated leave",
  "estimates.update": "changed workload estimates",
  "asset.add": "added a file to a post",
  "asset.remove": "removed a file from a post",
  "approval.create": "created an approval link",
  "approval.revoke": "revoked an approval link",
  "approval.send": "sent an approval link",
  "client.approved": "recorded a client approval",
  "client.changes_requested": "recorded a change request",
  "client.approved_offline": "marked a post approved offline",
  "reminder.sent": "sent a reminder",
  "report.update": "updated a monthly report",
  "report.share": "shared a monthly report",
  "billing.update": "changed fees",
  "invoice.update": "updated an invoice",
};

const AREAS: { id: string; label: string; tone: Tone; test: (a: string) => boolean }[] = [
  { id: "images", label: "Images", tone: "info", test: (a) => a.startsWith("image.") },
  { id: "leads", label: "Leads", tone: "gold", test: (a) => a.startsWith("lead.") },
  { id: "approvals", label: "Approvals", tone: "ok", test: (a) => a.startsWith("approval.") || a.startsWith("client.approved") || a === "client.changes_requested" || a === "reminder.sent" },
  { id: "content", label: "Clients & content", tone: "violet", test: (a) => /^(client|plan|item|task|shoot|shot|onboarding|asset|report)\./.test(a) },
  { id: "team", label: "Team & settings", tone: "neutral", test: (a) => /^(team|rules|settings|leave|estimates|user)\./.test(a) },
  { id: "billing", label: "Billing", tone: "warn", test: (a) => /^(billing|invoice)\./.test(a) },
];
export const auditArea = (action: string) => AREAS.find((x) => x.test(action)) ?? AREAS[AREAS.length - 1];
/** Plain-language description; ids are hidden (they mean nothing to a reader). */
export function describe(r: AuditRow): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(r.target);
  const d = r.details ?? {};
  let s = verb[r.action] ?? r.action.replace(/[._]/g, " ");
  if (!uuid && r.target && !["rules.update", "estimates.update"].includes(r.action)) s += ` ${r.target}`;
  if (typeof d.version === "number") s += ` (version ${d.version})`;
  if (typeof d.status === "string") s += ` → ${d.status}`;
  if (r.action === "settings.update" && typeof d.enabled === "boolean") s += ` (${d.enabled ? "on" : "off"})`;
  return s;
}

export function AuditView({ rows }: { rows: AuditRow[] }) {
  const columns: Column<AuditRow>[] = [
    { key: "at", label: "When", sort: (r) => r.at, card: "meta", className: "whitespace-nowrap text-muted", render: (r) => <time dateTime={r.at}>{fmtWhen(r.at)}</time> },
    { key: "who", label: "Who", sort: (r) => r.actor_email, card: "meta", render: (r) => <span className="font-semibold">{r.actor_email}</span> },
    {
      key: "what",
      label: "What",
      card: "title",
      render: (r) => (
        <span>
          {describe(r)}
          {typeof r.details?.note === "string" && <span className="mt-0.5 block text-[13px] text-text-2">“{r.details.note}”</span>}
        </span>
      ),
    },
    { key: "area", label: "Area", sort: (r) => auditArea(r.action).label, card: "badge", render: (r) => <Badge tone={auditArea(r.action).tone}>{auditArea(r.action).label}</Badge> },
  ];
  return (
    <>
      <AdminTitle title="Activity" intro="Who did what, and when. The latest 200 actions." />
      <DataTable
        id="audit"
        rows={rows}
        rowKey={(r) => String(r.id)}
        columns={columns}
        initialSort={{ key: "at", dir: "desc" }}
        search={(r) => `${r.actor_email} ${describe(r)} ${typeof r.details?.note === "string" ? r.details.note : ""}`}
        views={[{ id: "all", label: "All", test: () => true }, ...AREAS.map((a) => ({ id: a.id, label: a.label, test: (r: AuditRow) => auditArea(r.action).id === a.id }))]}
        empty={<p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">Nothing recorded here yet.</p>}
      />
    </>
  );
}
