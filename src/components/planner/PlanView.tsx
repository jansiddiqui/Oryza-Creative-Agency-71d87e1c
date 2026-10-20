"use client";

import type { Plan } from "@/lib/engine/types";
import { fmtDate } from "@/lib/engine/dates";
import { DayCard } from "@/components/PlanBits";
import { FitChip } from "@/components/ui";

function Section({ n, title, children, className = "" }: { n: number; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-line py-10 ${className}`}>
      <h2 className="mb-6 flex items-baseline gap-4 font-display text-3xl tracking-tight">
        <span className="text-lg text-gold-500">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PlanView({ plan, unlocked, lockSlot }: { plan: Plan; unlocked: boolean; lockSlot?: React.ReactNode }) {
  const weeks = [0, 7, 14, 21, 28].map((s) => plan.days.slice(s, s + 7)).filter((w) => w.length);
  const visibleWeeks = unlocked ? weeks : weeks.slice(0, 1);
  return (
    <div>
      <Section n={1} title="Your brand snapshot" className="border-t-0 pt-0">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plan.snapshot.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-paper p-5">
              <dt className="text-xs font-bold uppercase tracking-[0.15em] text-gold-700">{s.label}</dt>
              <dd className="mt-1.5 text-[15px] font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section n={2} title="Who we are talking to">
        <ul className="grid gap-4 sm:grid-cols-2">
          {plan.audiences.map((a) => (
            <li key={a.name} className="rounded-2xl border border-line p-5">
              <p className="flex justify-between font-semibold">{a.name}<span className="font-display text-xl text-gold-500">{a.share}%</span></p>
              <p className="mt-1 text-[14px] text-muted">{a.needs}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section n={3} title="Your platforms">
        <ul className="grid gap-3 sm:grid-cols-2">
          {plan.platforms.filter((p) => p.fit !== "skip" || p.selected).map((p) => (
            <li key={p.id} className={`flex items-start gap-3 rounded-xl border p-4 ${p.selected ? "border-ink" : "border-line opacity-70"}`}>
              <FitChip fit={p.fit} label={p.fit === "core" ? "Core" : p.fit === "add" ? "Add" : "Extra"} />
              <div>
                <p className="font-semibold">{p.name} {p.selected ? "" : <span className="text-[13px] font-normal text-muted">(not selected)</span>}</p>
                <p className="text-[14px] text-muted">{p.job}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {!unlocked && (
        <>
          <Section n={6} title="Your first week">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleWeeks[0].map((d) => <DayCard key={d.day} day={d} />)}
            </div>
          </Section>
          <div className="no-print">{lockSlot}</div>
        </>
      )}

      {unlocked && (
        <>
          {plan.optimization.length > 0 && (
            <Section n={4} title="Profile optimization (one-time, extra)">
              <p className="mb-5 text-muted">Done in your first 7–10 days and billed separately from the monthly package.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {plan.optimization.map((o) => (
                  <div key={o.platform} className="rounded-2xl border border-line p-5">
                    <p className="font-display text-xl">{o.name}</p>
                    <ul className="mt-2 space-y-1 text-[14px] text-muted">{o.items.map((i) => <li key={i}>☐ {i}</li>)}</ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section n={5} title="Content pillars">
            <ul className="space-y-3">
              {plan.pillars.map((p) => (
                <li key={p.name}>
                  <div className="flex justify-between text-[15px]"><span className="font-semibold">{p.name}</span><span className="text-muted">{p.pct}%</span></div>
                  <div className="mt-1.5 h-2 rounded-full bg-cream"><div className="h-2 rounded-full bg-gold-500" style={{ width: `${Math.min(100, p.pct * 2.5)}%` }} /></div>
                </li>
              ))}
            </ul>
          </Section>

          <Section n={6} title="Your 30-day calendar">
            {visibleWeeks.map((w, i) => (
              <div key={i} className={i ? "print-break mt-10" : ""}>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-gold-700">
                  Week {i + 1} · {fmtDate(w[0].date)} – {fmtDate(w[w.length - 1].date)}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {w.map((d) => <DayCard key={d.day} day={d} />)}
                </div>
              </div>
            ))}
          </Section>

          <Section n={7} title="Monthly deliverables by platform">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plan.deliverables.map((d) => (
                <div key={d.platform} className="rounded-2xl border border-line p-5">
                  <p className="font-display text-xl">{d.name}</p>
                  <ul className="mt-2 space-y-1 text-[14px] text-muted">{d.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              ))}
            </div>
          </Section>

          <Section n={8} title="Shoot days">
            {plan.shootDays.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {plan.shootDays.map((s) => (
                  <div key={s.day} className="rounded-2xl bg-ink p-6 text-paper">
                    <p className="text-sm text-gold-300">Day {s.day} · {fmtDate(s.date)}</p>
                    <p className="mt-1 font-display text-xl">{s.label}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-paper/80">{s.shots.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No shoot days — we edit your photos and videos into finished content.</p>
            )}
          </Section>

          <Section n={9} title="Your part and our part">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-line p-6">
                <p className="font-display text-xl">What we need from you</p>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">{plan.clientPart.map((c) => <li key={c}>— {c}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-ink p-6">
                <p className="font-display text-xl">What Oryza does</p>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">{plan.oryzaPart.map((c) => <li key={c}>— {c}</li>)}</ul>
              </div>
            </div>
          </Section>

          <Section n={10} title="Months 2 and 3">
            <div className="grid gap-4 md:grid-cols-2">
              {plan.nextMonths.map((m) => (
                <div key={m.month} className="rounded-2xl border border-line p-5">
                  <p className="font-display text-xl">{m.month}</p>
                  <ul className="mt-2 space-y-1 text-[14px] text-muted">{m.themes.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              ))}
            </div>
          </Section>

          <Section n={11} title="Recommended package">
            <div className="rounded-2xl border border-ink p-6">
              <p className="font-display text-2xl">{plan.pkg.name}</p>
              <p className="mt-1 text-muted">{plan.pkg.summary}</p>
              {plan.optimization.length > 0 && (
                <p className="mt-3 text-[15px]">+ One-time profile optimization for {plan.optimization.map((o) => o.name).join(", ")}</p>
              )}
            </div>
            <p className="mt-6 text-[13px] text-muted">Content rules for your category: {plan.rules.join(" ")}</p>
          </Section>
        </>
      )}
    </div>
  );
}
