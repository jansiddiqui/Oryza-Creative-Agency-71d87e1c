import { processSteps, WHO_LABEL, type ProcessWho } from "@/data/process";
import { processIcons } from "@/components/icons";
import { revealDelay } from "@/components/motion/reveal";

/** Spacing of the step-by-step "light up", matched to the ~800 ms the line takes to draw across. */
const STEP_MS = 130;

/**
 * "From questions to content": the seven steps as one connected flow.
 * Wide screens: a row of circles on one continuous gold line that draws left to right as the section scrolls into
 * view, the steps lighting up in turn. Phones: a vertical timeline with the line down the left.
 * Solid gold circle = the client's part; gold outline = Oryza does it. No motion with prefers-reduced-motion.
 * Plain server markup (an ordered list). RevealObserver marks it revealed; CSS keyframes (globals.css) do the rest,
 * so the animation also plays when the section was rendered lazily (content-visibility).
 */
export function ProcessFlow({ light = false, className = "" }: { light?: boolean; className?: string }) {
  // Outline circles take the section's own background so the line never shows through them.
  const sectionFill = light ? "bg-ink" : "bg-paper";
  const tone = {
    step: light ? "text-gold-300" : "text-gold-700",
    title: light ? "text-paper" : "text-ink",
    text: light ? "text-paper/75" : "text-muted",
    outline: light ? "border-gold-500 text-gold-300" : "border-gold-700 text-gold-700",
    badgeOutline: light ? "border-gold-500/70 text-gold-300" : "border-gold-700/60 text-gold-700",
  };
  const circle = (who: ProcessWho) => (who === "you" ? "border-gold-500 bg-gold-500 text-ink" : `${sectionFill} ${tone.outline}`);
  const badge = (who: ProcessWho) => (who === "you" ? "border-gold-500 bg-gold-500 text-ink" : tone.badgeOutline);
  const last = processSteps.length - 1;

  return (
    <figure className={className} data-reveal="draw">
      <figcaption className="sr-only">From questions to content: the seven steps of working with Oryza</figcaption>
      <div className="relative">
        {/* One continuous line from the first circle's centre to the last one's (wide screens), fading towards the end. */}
        <span
          aria-hidden="true"
          className="flow-line pointer-events-none absolute left-[calc(100%/14)] top-[27px] hidden h-[2px] w-[calc(100%*6/7)] rounded-full md:block"
        />

        <ol className="relative md:grid md:grid-cols-7">
          {processSteps.map((s, i) => {
            const Icon = processIcons[s.id];
            return (
              <li key={s.id} className={`relative flex items-start gap-4 md:flex-col md:items-center md:gap-0 md:px-1.5 md:pb-0 md:text-center ${i === last ? "" : "pb-7"}`}>
                {/* Phones: the line runs down the left, from this circle's centre to the next one's. */}
                {i < last && (
                  <span
                    aria-hidden="true"
                    className="flow-seg absolute left-[27px] top-7 h-full w-[2px] bg-gold-500 md:hidden"
                    style={{ ...revealDelay(i, STEP_MS), opacity: 1 - (i / last) * 0.6 }}
                  />
                )}
                <span className={`flow-step relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${circle(s.who)}`} style={revealDelay(i, STEP_MS)}>
                  <Icon size={24} />
                </span>
                <div className="min-w-0 pt-1 md:mt-3 md:pt-0">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${tone.step}`}>Step {i + 1}</p>
                  <p className={`text-[15px] font-semibold leading-snug ${tone.title}`}>{s.label}</p>
                  <p className={`mt-1 text-[13px] leading-[1.45] ${tone.text}`}>{s.short}</p>
                  <p className={`mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] md:justify-center ${tone.text}`}>
                    <span className={`inline-flex items-center rounded-full border px-2 py-px font-semibold ${badge(s.who)}`}>
                      <span className="sr-only">Done by: </span>
                      {WHO_LABEL[s.who]}
                    </span>
                    {s.when && (
                      <span>
                        <span className="sr-only">When: </span>
                        {s.when}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <p className={`mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] md:justify-center ${tone.text}`}>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-gold-500 bg-gold-500" />
          Gold = your part
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={`h-3.5 w-3.5 rounded-full border-2 ${light ? "border-gold-500" : "border-gold-700"}`} />
          Outline = Oryza does it
        </span>
      </p>
    </figure>
  );
}
