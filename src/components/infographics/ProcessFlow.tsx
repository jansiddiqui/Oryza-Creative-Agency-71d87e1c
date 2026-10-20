import { processSteps } from "@/data/process";
import { processIcons } from "@/components/icons";
import { revealDelay } from "@/components/motion/reveal";

/**
 * "From questions to content": the seven steps as a connected flow.
 * Horizontal on wide screens (the connector draws in), a vertical list on phones.
 */
export function ProcessFlow({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const ring = light ? "border-paper/25 bg-ink text-paper" : "border-line bg-paper text-ink";
  const line = light ? "text-paper/25" : "text-line";
  return (
    <figure className={className} data-reveal="draw">
      <figcaption className="sr-only">From questions to content: the seven steps of working with Oryza</figcaption>
      <div className="relative">
        {/* Connector behind the step circles (wide screens). */}
        <svg aria-hidden className={`pointer-events-none absolute left-[7%] right-[7%] top-7 hidden h-px w-[86%] md:block ${line}`} viewBox="0 0 100 1" preserveAspectRatio="none">
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="draw-line" pathLength={1} />
        </svg>
        {/* Vertical connector (phones). */}
        <span aria-hidden className={`absolute bottom-7 left-7 top-7 w-px md:hidden ${light ? "bg-paper/25" : "bg-line"} grow-y`} />
        <ol className="relative grid gap-6 md:grid-cols-7 md:gap-3">
          {processSteps.map((s, i) => {
            const Icon = processIcons[s.id];
            return (
              <li key={s.id} className="flex items-center gap-4 md:flex-col md:gap-3 md:text-center" >
                <span className={`pop relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${ring}`} style={revealDelay(i, 90)}>
                  <Icon size={24} accent />
                </span>
                <span>
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${light ? "text-gold-300" : "text-gold-700"}`}>
                    Step {i + 1}
                  </span>
                  <span className="block text-[15px] font-semibold">{s.label}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
