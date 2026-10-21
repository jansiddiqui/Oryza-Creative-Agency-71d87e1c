import Link from "next/link";
import type { OpsWarning, WarningKind } from "@/lib/ops/team";

const KIND: Record<WarningKind, string> = {
  shoot_clash: "Shoot clash",
  shoot_off_day: "Shoot on a day off",
  over_capacity: "Over capacity",
  leave_assignee: "Work during leave",
  inactive_assignee: "Inactive person",
};

/** Clash and capacity warnings, each with a link to where it can be fixed. Renders nothing when all is clear. */
export function WarningsPanel({ warnings, limit = 8, title = "Warnings" }: { warnings: OpsWarning[]; limit?: number; title?: string }) {
  if (!warnings.length) return null;
  const shown = warnings.slice(0, limit);
  return (
    <section aria-labelledby="warn-h" className="mb-6 rounded-2xl border border-red-800/30 bg-red-50/60 p-4">
      <h2 id="warn-h" className="mb-2 flex items-baseline gap-2 text-[15px] font-semibold text-red-900">
        {title} <span className="text-[13px] font-normal">{warnings.length}</span>
      </h2>
      <ul className="space-y-1.5 text-[14px]">
        {shown.map((w, i) => {
          const href = w.kind.startsWith("shoot") && w.refs[0] ? `/admin/shoots/${w.refs[0]}` : `/admin/team?week=${w.date}`;
          return (
            <li key={`${w.kind}-${w.email}-${w.date}-${i}`} className="flex flex-wrap items-baseline gap-x-2">
              <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-red-900 ring-1 ring-red-800/30">{KIND[w.kind]}</span>
              <span>{w.message}</span>
              <Link href={href} className="text-[13px] font-semibold underline underline-offset-4">Fix</Link>
            </li>
          );
        })}
      </ul>
      {warnings.length > limit && <p className="mt-2 text-[13px]"><Link href="/admin/team" className="font-semibold underline underline-offset-4">See all {warnings.length} on the Team page</Link></p>}
    </section>
  );
}
