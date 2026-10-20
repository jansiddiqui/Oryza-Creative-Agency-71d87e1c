import { AdminTitle, fmtWhen } from "./AdminShell";

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
};

export function AuditView({ rows }: { rows: AuditRow[] }) {
  return (
    <>
      <AdminTitle title="Activity" intro="Who did what, and when. The latest 200 actions." />
      {rows.length === 0 ? (
        <p className="text-muted">Nothing yet.</p>
      ) : (
        <ol className="divide-y divide-line rounded-2xl border border-line bg-paper text-[14px]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
              <time className="shrink-0 text-muted sm:w-44" dateTime={r.at}>{fmtWhen(r.at)}</time>
              <p>
                <strong>{r.actor_email}</strong> {verb[r.action] ?? r.action} <span className="font-mono text-[13px]">{r.target}</span>
                {typeof r.details.version === "number" && <span className="text-muted"> (version {r.details.version})</span>}
                {typeof r.details.status === "string" && <span className="text-muted"> → {r.details.status}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
