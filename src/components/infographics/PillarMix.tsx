import { revealDelay } from "@/components/motion/reveal";

/** Calm brand-only palette for up to eight segments (ink → gold), in order of share. */
const SEGMENT = ["#13201c", "#b9811a", "#e8b84a", "#8f5e0a", "#a8b2ad", "#5b6662", "#c9a35a", "#2b3a35"];

/**
 * Content pillar mix as a donut with a written legend. Values are normalised to 100.
 * The legend carries the real numbers, so the chart is never the only way to read them.
 */
export function PillarMix({ pillars, caption }: { pillars: { name: string; pct: number }[]; caption?: string }) {
  const total = pillars.reduce((s, p) => s + p.pct, 0) || 1;
  const sorted = [...pillars].sort((a, b) => b.pct - a.pct).map((p) => ({ ...p, share: (p.pct / total) * 100 }));
  // Each segment starts where the previous ones end.
  const rows = sorted.map((p, i) => ({ ...p, start: sorted.slice(0, i).reduce((s, q) => s + q.share, 0) }));
  const r = 15.915; // circumference ≈ 100, so dash values are percentages
  return (
    <figure className="grid items-center gap-8 sm:grid-cols-[180px_1fr]" data-reveal="draw">
      <svg viewBox="0 0 42 42" className="mx-auto h-44 w-44 -rotate-90" aria-hidden>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--color-cream)" strokeWidth="6" />
        {rows.map((p, i) => {
          const gap = rows.length > 1 ? 0.6 : 0;
          return (
            <circle
              key={p.name}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={SEGMENT[i % SEGMENT.length]}
              strokeWidth="6"
              pathLength={100}
              strokeDasharray={`${Math.max(p.share - gap, 0.1)} ${100 - Math.max(p.share - gap, 0.1)}`}
              strokeDashoffset={-p.start}
              className="pop"
              style={revealDelay(i, 80)}
            />
          );
        })}
      </svg>
      <figcaption>
        {caption && <span className="mb-3 block text-[14px] text-muted">{caption}</span>}
        <ul className="space-y-2">
          {rows.map((p, i) => (
            <li key={p.name} className="flex items-center justify-between gap-4 text-[15px]">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: SEGMENT[i % SEGMENT.length] }} />
                {p.name}
              </span>
              <span className="font-semibold tabular-nums">{Math.round(p.share)}%</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
