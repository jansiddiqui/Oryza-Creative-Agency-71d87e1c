import { categories } from "@/data/categories";
import { IndustryIcon } from "@/components/icons";

/**
 * First planner step: choose a category. Rendered by the planner and, identically, as its server-rendered
 * loading state — so nothing moves when the interactive planner takes over.
 */
export function CategoryStep({ onPick, className = "" }: { onPick?: (slug: string, live: boolean) => void; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-3xl tracking-tight">What kind of business or brand are you?</h2>
      <p className="mt-2 text-muted">Pick the closest one. The questions change with your answer.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={onPick && (() => onPick(c.slug, c.plannerLive))}
            className="card-lift flex items-start gap-3.5 rounded-2xl border border-line bg-paper p-5 text-left"
          >
            <IndustryIcon slug={c.slug} size={24} accent className="mt-0.5 text-ink" />
            <span>
              <span className="block font-semibold">{c.name}</span>
              <span className="mt-1 block text-[13px] text-muted">{c.audience}</span>
              {c.plannerLive && <span className="mt-2 block text-[12px] font-bold uppercase tracking-wider text-gold-700">Instant detailed plan</span>}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onPick && (() => onPick("", false))}
          className="card-lift rounded-2xl border border-dashed border-line p-5 text-left"
        >
          <span className="block font-semibold">Something else</span>
          <span className="mt-1 block text-[13px] text-muted">Tell us about it and a strategist will plan it with you.</span>
        </button>
      </div>
    </div>
  );
}
