import { packages } from "@/lib/engine/school-engine";
import { revealDelay } from "@/components/motion/reveal";

type Pkg = (typeof packages)[keyof typeof packages];

const metrics: { label: string; unit: string; value: (p: Pkg) => number }[] = [
  { label: "Reels", unit: "a month", value: (p) => p.reels },
  { label: "Posts", unit: "a month", value: (p) => p.posts },
  { label: "Story days", unit: "a week", value: (p) => p.storyDaysPerWeek },
  { label: "Shoot days", unit: "a month", value: (p) => p.shoots },
];

/**
 * Monthly volumes per package (Instagram base), drawn as bars from the same numbers the planner uses.
 * Volumes only — pricing is discussed on a call.
 */
export function PackageCompare() {
  const ids = Object.keys(packages) as (keyof typeof packages)[];
  return (
    <figure data-reveal="draw" className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <figcaption className="sr-only">Monthly volumes by package</figcaption>
      <div className="grid gap-8 md:grid-cols-2">
        {metrics.map((m, mi) => {
          const max = Math.max(...ids.map((id) => m.value(packages[id])));
          return (
            <div key={m.label}>
              <p className="mb-3 flex items-baseline justify-between">
                <span className="font-display text-xl">{m.label}</span>
                <span className="text-[13px] text-muted">{m.unit}</span>
              </p>
              <dl className="space-y-2.5">
                {ids.map((id, i) => {
                  const v = m.value(packages[id]);
                  return (
                    <div key={id} className="grid grid-cols-[76px_1fr_32px] items-center gap-3 text-[14px]">
                      <dt className={id === "growth" ? "font-semibold" : "text-muted"}>{packages[id].name}</dt>
                      <dd className="h-2.5 overflow-hidden rounded-full bg-cream" aria-hidden>
                        <span
                          className={`grow-x block h-full rounded-full ${id === "growth" ? "bg-gold-500" : "bg-ink/70"}`}
                          style={{ width: `${(v / max) * 100}%`, ...revealDelay(mi * 3 + i, 60) }}
                        />
                      </dd>
                      <dd className="text-right font-semibold tabular-nums">{v}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[13px] text-muted">
        Instagram volumes, the base of most plans. Stories per story day:{" "}
        {ids.map((id) => `${packages[id].name} ${packages[id].storiesPerDay}`).join(" · ")}.
      </p>
    </figure>
  );
}
