import Link from "next/link";
import type { OpsWarning, WarningKind } from "@/lib/ops/team";
import { Badge, btnSmall } from "./ui";

const KIND: Record<WarningKind, string> = {
  shoot_clash: "Shoot clash",
  shoot_off_day: "Shoot on a day off",
  over_capacity: "Over capacity",
  leave_assignee: "Work during leave",
  inactive_assignee: "Inactive person",
};

function Row({ w }: { w: OpsWarning }) {
  const href = w.kind.startsWith("shoot") && w.refs[0] ? `/admin/shoots/${w.refs[0]}` : `/admin/team?week=${w.date}`;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1">
        <Badge tone={w.kind === "over_capacity" ? "warn" : "bad"}>{KIND[w.kind]}</Badge>
        <span className="mt-1 block text-[14px]">{w.message}</span>
      </span>
      <Link href={href} className={`${btnSmall} shrink-0`} aria-label={`Fix: ${w.message}`}>Fix</Link>
    </li>
  );
}

/** Clash and capacity warnings, each with a link to where it can be fixed. The first three show; the rest fold away. Renders nothing when all is clear. */
export function WarningsPanel({ warnings, limit = 8, title = "Warnings" }: { warnings: OpsWarning[]; limit?: number; title?: string }) {
  if (!warnings.length) return null;
  const shown = warnings.slice(0, limit);
  const first = shown.slice(0, 3);
  const rest = shown.slice(3);
  return (
    <section aria-labelledby="warn-h" className="mb-6 rounded-xl border border-bad/30 bg-bad-bg/60 px-4 py-3">
      <h2 id="warn-h" className="flex items-baseline gap-2 text-[15px] font-semibold text-bad">
        {title} <span className="text-[13px] font-normal">{warnings.length}</span>
      </h2>
      <ul className="divide-y divide-bad/15">{first.map((w, i) => <Row key={`${w.kind}-${w.email}-${w.date}-${i}`} w={w} />)}</ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-bad underline-offset-4 hover:underline">
            <span className="group-open:hidden">Show {rest.length} more</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className="divide-y divide-bad/15">{rest.map((w, i) => <Row key={`${w.kind}-${w.email}-${w.date}-r${i}`} w={w} />)}</ul>
        </details>
      )}
      {warnings.length > limit && <p className="mt-2 text-[13px]"><Link href="/admin/team" className="font-semibold underline underline-offset-4">See all {warnings.length} on the Team page</Link></p>}
    </section>
  );
}
