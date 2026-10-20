import type { Plan, PlanItem } from "@/lib/engine/types";
import { fmtDate } from "@/lib/engine/dates";
import { CameraIcon } from "@/components/icons";
import { revealDelay } from "@/components/motion/reveal";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type Kind = "reel" | "post" | "story" | "other";

const kindOf = (i: PlanItem): Kind =>
  i.format === "reel" || i.format === "short" ? "reel" : i.format === "post" ? "post" : i.format === "story" || i.format === "status" ? "story" : "other";

const mark: Record<Kind, string> = {
  reel: "bg-gold-500",
  post: "bg-ink",
  story: "bg-ink/25",
  other: "border border-ink/30",
};
/** Same marks, readable on the dark shoot-day cells. */
const markOnInk: Record<Kind, string> = {
  reel: "bg-gold-300",
  post: "bg-paper",
  story: "bg-paper/40",
  other: "border border-paper/50",
};

/** A pinned date is a real calendar reason (admissions, events, festivals) — shoot days have their own mark. */
const keyDateReason = (d: Plan["days"][number]) => d.items.find((i) => i.pinnedReason && !/shoot/i.test(i.pinnedReason))?.pinnedReason;

/**
 * The 30-day plan at a glance: a calendar grid (Mon–Sun) built from a generated plan, showing how many
 * reels, posts and stories each day carries, which days are shoot days and which are pinned to a key date.
 */
export function PlanTimeline({ plan, caption }: { plan: Plan; caption?: string }) {
  const days = plan.days;
  const lead = Math.max(0, WEEKDAYS.indexOf(days[0]?.weekday.slice(0, 3) ?? "Mon"));
  const pinned = days.flatMap((d) => {
    const reason = keyDateReason(d);
    return reason ? [{ day: d.day, date: d.date, reason }] : [];
  });
  const counts = days.reduce(
    (acc, d) => {
      for (const i of d.items) acc[kindOf(i)]++;
      return acc;
    },
    { reel: 0, post: 0, story: 0, other: 0 } as Record<Kind, number>,
  );

  return (
    <figure data-reveal="draw">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="presentation">
        {WEEKDAYS.map((w) => (
          <p key={w} aria-hidden className="pb-1 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            {w}
          </p>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} aria-hidden />)}
        {days.map((d, i) => {
          const isPinned = Boolean(keyDateReason(d));
          const kinds = d.items.map(kindOf).sort();
          return (
            <div
              key={d.day}
              aria-hidden
              className={`pop relative flex min-h-[64px] flex-col rounded-lg border p-1.5 sm:min-h-[84px] sm:p-2 ${
                d.shoot ? "border-ink bg-ink text-paper" : isPinned ? "border-gold-500 bg-gold-100/50" : "border-line bg-paper"
              }`}
              style={revealDelay(i, 18, 30)}
            >
              <span className="flex items-center justify-between text-[11px] font-semibold sm:text-xs">
                {d.day}
                {d.shoot && <CameraIcon size={14} className="text-gold-300" />}
              </span>
              <span className="mt-auto flex flex-wrap gap-[3px]">
                {kinds.slice(0, 8).map((k, j) => (
                  <span key={j} className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${(d.shoot ? markOnInk : mark)[k]}`} />
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold-500" />Reel</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink" />Post</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink/25" />Story or status</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-ink/30" />Other platform update</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-ink" />Shoot day</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-gold-500 bg-gold-100/50" />Pinned to a key date</span>
      </div>

      <figcaption className="mt-5 text-[14px] text-muted">
        {caption && <span className="block">{caption}</span>}
        <span className="block">
          {days.length} days · {counts.reel} reels · {counts.post} posts · {counts.story} stories and statuses · {plan.shootDays.length} shoot{" "}
          {plan.shootDays.length === 1 ? "day" : "days"}.
        </span>
        {pinned.length > 0 && (
          <span className="mt-1 block">
            Key dates:{" "}
            {pinned.slice(0, 6).map((p, i) => (
              <span key={p.day}>
                {i > 0 && " · "}Day {p.day} ({fmtDate(p.date)}) {p.reason}
              </span>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
