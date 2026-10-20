import Link from "next/link";
import type { Category, Fit } from "@/data/categories";
import { platforms, type PlatformId } from "@/data/platforms";
import { industryIcons, platformIcons } from "@/components/icons";
import { revealDelay } from "@/components/motion/reveal";

const shortName = (name: string) => name.replace(" Business Profile", "").replace(" & Google indexing", "").replace(" (Twitter)", "").replace(" Business", "");

const label: Record<Fit, string> = { core: "Core", add: "Add", skip: "Not needed" };

/** Filled gold dot = core, gold ring = add, faint dash = not needed. Always paired with a text label for screen readers. */
export function FitMark({ fit, delay }: { fit: Fit; delay?: number }) {
  return (
    <span className="pop inline-flex h-6 w-6 items-center justify-center" style={delay !== undefined ? revealDelay(delay, 12, 120) : undefined}>
      {fit === "core" && <span className="h-3.5 w-3.5 rounded-full bg-gold-500" />}
      {fit === "add" && <span className="h-3.5 w-3.5 rounded-full border-2 border-gold-500" />}
      {fit === "skip" && <span className="h-px w-3 bg-ink/25" />}
      <span className="sr-only">{label[fit]}</span>
    </span>
  );
}

export function FitLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted ${className}`}>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gold-500" /><strong className="text-ink">Core</strong> always in the plan</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-gold-500" /><strong className="text-ink">Add</strong> when the goal or budget allows</span>
      <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-ink/40" />Not needed</span>
    </p>
  );
}

/** Industry × platform matrix as an accessible table. Scrolls sideways on phones with the industry column pinned. */
export function FitMatrix({ categories }: { categories: Category[] }) {
  return (
    <figure data-reveal="draw">
      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Platform fit by industry: Core, Add or Not needed</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="sticky left-0 z-10 bg-paper p-3 pl-4 font-semibold">Industry</th>
              {platforms.map((p) => {
                const Icon = platformIcons[p.id];
                return (
                  <th key={p.id} scope="col" className="p-2 text-center align-bottom text-[12px] font-semibold">
                    <span className="flex flex-col items-center gap-1.5">
                      <Icon size={20} accent />
                      {shortName(p.name)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, row) => {
              const Icon = industryIcons[c.slug];
              return (
                <tr key={c.slug} className="border-b border-line/60 last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-paper p-3 pl-4 font-semibold">
                    <span className="flex items-center gap-2.5">
                      {Icon && <Icon size={18} className="text-gold-700" />}
                      {c.plannerLive ? <Link href={`/industries/${c.slug}`} className="underline-offset-4 hover:underline">{c.name}</Link> : c.name}
                    </span>
                  </th>
                  {platforms.map((p, col) => (
                    <td key={p.id} className="p-2 text-center">
                      <FitMark fit={c.fit[p.id]} delay={row * 3 + col} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <FitLegend className="mt-4" />
    </figure>
  );
}

/** One industry's platform fit as a compact list, for industry pages. */
export function FitStrip({ category }: { category: Category }) {
  const order: Fit[] = ["core", "add", "skip"];
  const ids = (Object.keys(category.fit) as PlatformId[]).sort((a, b) => order.indexOf(category.fit[a]) - order.indexOf(category.fit[b]));
  return (
    <figure data-reveal="draw">
      <figcaption className="sr-only">Platform fit for {category.name}</figcaption>
      <ul className="grid gap-2 sm:grid-cols-3">
        {ids.map((id, i) => {
          const p = platforms.find((x) => x.id === id)!;
          const Icon = platformIcons[id];
          const fit = category.fit[id];
          return (
            <li key={id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${fit === "skip" ? "border-line/60 text-muted" : "border-line bg-paper"}`}>
              <Icon size={20} accent={fit !== "skip"} />
              <span className="flex-1 text-[14px] font-medium">{shortName(p.name)}</span>
              <FitMark fit={fit} delay={i} />
            </li>
          );
        })}
      </ul>
      <FitLegend className="mt-4" />
    </figure>
  );
}
