"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { categoryBySlug } from "@/data/categories";
import { platforms, platformById, type PlatformId } from "@/data/platforms";
import { packages, type PackageId } from "@/lib/engine/packages";
import { fmtDate, nextMonday } from "@/lib/engine/dates";
import type { Plan } from "@/lib/engine/types";
import { inputCls, labelCls, LeadForm, LeadStatus, sendLead, type LeadResult } from "@/components/LeadForm";
import { FitChip } from "@/components/ui";
import { PlanView } from "./PlanView";
import { CategoryStep } from "./CategoryStep";
import { whatsappLink } from "@/lib/site";
import { plannerLabels, plannerLoaders } from "./configs";
import { resolveOptions, type Answers, type Opt, type PlannerConfig, type Question } from "./questions";

/** "category", "loading", "other", "plan", or the id of a question step from the category's planner config. */
type Step = string;

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${
    on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40"
  }`;

function Choice({ options, value, onChange, name }: { options: readonly Opt[]; value: string; onChange: (v: string) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={chip(value === o.id)} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {htmlFor ? <label htmlFor={htmlFor} className={labelCls}>{label}</label> : <p className={labelCls}>{label}</p>}
      {children}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

function planSummary(plan: Plan): string {
  const lines = plan.snapshot.map((s) => `${s.label}: ${s.value}`);
  lines.push(`Package: ${plan.pkg.name} (${plan.pkg.summary})`);
  lines.push(`Platforms: ${plan.platforms.filter((p) => p.selected).map((p) => p.name).join(", ")}`);
  if (plan.optimization.length) lines.push(`Optimization: ${plan.optimization.map((o) => o.name).join(", ")}`);
  const pinned = plan.days.flatMap((d) => d.items.filter((i) => i.pinnedReason && i.platform === "instagram").map((i) => `Day ${d.day} (${fmtDate(d.date)}): ${i.title}`));
  if (pinned.length) lines.push("Key dates:", ...pinned.slice(0, 8));
  return lines.join("\n");
}

const toggle = <T,>(arr: T[], v: T, max = 99) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.length >= max ? arr : [...arr, v]);
type EventRow = { kind: string; date: string; label?: string };

/** One question, rendered from its definition in the category's planner config. */
function QuestionField({ q, a, set }: { q: Question; a: Answers; set: (k: string, v: unknown) => void }) {
  const id = `q-${q.key}`;
  const str = (k: string) => String(a[k] ?? "");
  const arr = <T,>(k: string) => (a[k] as T[]) ?? [];
  switch (q.kind) {
    case "text":
      return (
        <Field label={q.label} htmlFor={id} hint={q.hint}>
          <input id={id} required={q.required} value={str(q.key)} placeholder={q.placeholder} onChange={(e) => set(q.key, e.target.value)} className={inputCls} />
        </Field>
      );
    case "date":
      return (
        <Field label={q.label} htmlFor={id} hint={q.hint}>
          <input id={id} type="date" value={str(q.key)} onChange={(e) => set(q.key, e.target.value)} className={inputCls} />
        </Field>
      );
    case "choice":
      return (
        <Field label={q.label} hint={q.hint}>
          <Choice name={q.name} options={resolveOptions(q.options, a)} value={str(q.key)} onChange={(v) => set(q.key, v)} />
        </Field>
      );
    case "multi": {
      const picked = arr<string>(q.key);
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="flex flex-wrap gap-2">
            {resolveOptions(q.options, a).map((o) => (
              <button key={o.id} type="button" aria-pressed={picked.includes(o.id)} className={chip(picked.includes(o.id))} onClick={() => set(q.key, toggle(picked, o.id, q.max))}>
                {q.star && picked[0] === o.id && "★ "}{o.label}
              </button>
            ))}
          </div>
        </Field>
      );
    }
    case "events": {
      const events = arr<EventRow>(q.key);
      const update = (i: number, patch: Partial<EventRow>) => set(q.key, events.map((x, j) => (j === i ? { ...x, ...patch } : x)));
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={i} className={`grid gap-3 ${q.withLabel ? "sm:grid-cols-[1fr_1fr_1.2fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
                <select aria-label="Event type" value={ev.kind} onChange={(e) => update(i, { kind: e.target.value })} className={inputCls}>
                  {q.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <input aria-label="Event date" type="date" value={ev.date} onChange={(e) => update(i, { date: e.target.value })} className={inputCls} />
                {q.withLabel && <input aria-label={q.withLabel} placeholder={q.withLabel} value={ev.label ?? ""} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} />}
                <button type="button" onClick={() => set(q.key, events.filter((_, j) => j !== i))} className="rounded-full px-4 text-sm font-semibold text-muted hover:text-ink">Remove</button>
              </div>
            ))}
            {events.length < (q.max ?? 6) && (
              <button type="button" onClick={() => set(q.key, [...events, { kind: q.defaultKind, date: "" }])} className="rounded-full border border-dashed border-ink/30 px-5 py-2 text-sm font-semibold hover:border-ink">+ Add an event</button>
            )}
          </div>
        </Field>
      );
    }
    case "list": {
      const items = arr<string>(q.key);
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="space-y-2">
            {items.map((v, i) => (
              <input key={i} aria-label={`${q.itemLabel} ${i + 1}`} value={v} onChange={(e) => set(q.key, items.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} placeholder={i === 0 ? q.placeholder : ""} />
            ))}
            {q.max && items.length < q.max && (
              <button type="button" onClick={() => set(q.key, [...items, ""])} className="rounded-full border border-dashed border-ink/30 px-5 py-2 text-sm font-semibold hover:border-ink">+ Add another</button>
            )}
          </div>
        </Field>
      );
    }
    case "group": {
      const rows = arr<Record<string, string>>(q.key);
      const update = (i: number, k: string, v: string) => set(q.key, rows.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="space-y-4">
            {rows.map((row, i) => (
              <fieldset key={i} className="rounded-2xl border border-line p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold">{q.itemLabel} {i + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {q.fields.map((f) => {
                    const id = `q-${q.key}-${i}-${f.key}`;
                    return (
                      <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                        <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-ink-soft">{f.label}</label>
                        {f.type === "choice" ? (
                          <select id={id} value={row[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls}>
                            {f.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input id={id} type={f.type === "date" ? "date" : "text"} value={row[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={() => set(q.key, rows.filter((_, j) => j !== i))} className="mt-3 text-sm font-semibold text-muted hover:text-ink">Remove</button>
              </fieldset>
            ))}
            {rows.length < (q.max ?? 4) && (
              <button type="button" onClick={() => set(q.key, [...rows, { ...q.empty }])} className="rounded-full border border-dashed border-ink/30 px-5 py-2 text-sm font-semibold hover:border-ink">+ Add {q.itemLabel.toLowerCase()}</button>
            )}
          </div>
        </Field>
      );
    }
    case "platforms": {
      const picked = arr<PlatformId>(q.key);
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button key={p.id} type="button" aria-pressed={picked.includes(p.id)} className={chip(picked.includes(p.id))} onClick={() => set(q.key, toggle(picked, p.id))}>{p.name}</button>
            ))}
          </div>
        </Field>
      );
    }
    case "optimize": {
      const picked = arr<PlatformId>(q.key);
      return (
        <Field label={q.label} hint={q.hint}>
          <div className="flex flex-wrap gap-2">
            {arr<PlatformId>("platforms").map((p) => (
              <button key={p} type="button" aria-pressed={picked.includes(p)} className={chip(picked.includes(p))} onClick={() => set(q.key, toggle(picked, p))}>{platformById[p].name}</button>
            ))}
          </div>
        </Field>
      );
    }
    case "package":
      return (
        <div role="radiogroup" aria-label={q.label} className="grid gap-4 md:grid-cols-3">
          {Object.entries(packages).map(([pid, p]) => (
            <button key={pid} type="button" role="radio" aria-checked={a[q.key] === pid} onClick={() => set(q.key, pid as PackageId)}
              className={`rounded-2xl border p-6 text-left ${a[q.key] === pid ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40"}`}>
              <p className="font-display text-2xl">{p.name}</p>
              <p className={`mt-2 text-[14px] ${a[q.key] === pid ? "text-paper/80" : "text-muted"}`}>{p.reels} reels · {p.posts} posts · stories {p.storyDaysPerWeek >= 7 ? "daily" : `${p.storyDaysPerWeek}×/week`} · {p.shoots} shoot day{p.shoots > 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>
      );
  }
}

/** Consecutive half-width questions share a two-column row. */
function rows(qs: Question[]): Question[][] {
  const out: Question[][] = [];
  for (const q of qs) {
    const last = out[out.length - 1];
    if (q.half && last?.[0].half && last.length < 2) last.push(q);
    else out.push([q]);
  }
  return out;
}

export function PlanBuilder() {
  const params = useSearchParams();
  const initialCat = params.get("category") ?? "";
  const [category, setCategory] = useState(initialCat);
  // Each category's questions, playbook and engine are loaded only when it is chosen.
  const [configs, setConfigs] = useState<Record<string, PlannerConfig>>({});
  const config: PlannerConfig | undefined = configs[category];
  const [step, setStep] = useState<Step>(plannerLoaders[initialCat] ? "loading" : initialCat ? "other" : "category");
  useEffect(() => {
    const load = plannerLoaders[category];
    if (!load || configs[category]) return;
    let current = true;
    load().then((c) => {
      if (!current) return;
      setConfigs((prev) => ({ ...prev, [category]: c }));
      setStep((s) => (s === "loading" ? c.steps[0].id : s));
    });
    return () => {
      current = false;
    };
  }, [category, configs]);
  const [answers, setAnswers] = useState<Record<string, Answers>>({});
  const a: Answers = config ? (answers[config.slug] ?? config.initial) : {};
  const [plan, setPlan] = useState<Plan | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [lead, setLead] = useState<LeadResult>("idle");
  const set = (k: string, v: unknown) => config && setAnswers((p) => ({ ...p, [config.slug]: { ...(p[config.slug] ?? config.initial), [k]: v } }));

  const steps = config?.steps ?? [];
  const idx = steps.findIndex((s) => s.id === step);
  // Step transitions animate only after the visitor has moved, never on first render.
  const [moved, setMoved] = useState(false);
  const go = (s: Step) => { setMoved(true); setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => {
    if (!config) return;
    if (idx < steps.length - 1) return go(steps[idx + 1].id);
    setPlan(config.generate(a, nextMonday()));
    go("plan");
  };
  const back = () => (idx > 0 ? go(steps[idx - 1].id) : go("category"));
  const name = config ? String(a[config.nameKey] ?? "") : "";
  const canNext = idx !== 0 || name.trim().length > 1;

  const waPlan = useMemo(() => (plan ? whatsappLink(`Hi Oryza, here is the plan I built on your website:\n\n${planSummary(plan)}`) : null), [plan]);

  // ---------- Step: category ----------
  if (step === "category")
    return (
      <CategoryStep
        key="category"
        className={moved ? "step-enter" : ""}
        onPick={(slug, live) => { setCategory(slug); go(slug && live && plannerLoaders[slug] ? (configs[slug]?.steps[0].id ?? "loading") : "other"); }}
      />
    );

  // ---------- Step: loading the chosen category's questions ----------
  if (step === "loading" || (plannerLoaders[category] && !config && step !== "other"))
    return (
      <div key="loading" role="status" aria-live="polite" className="min-h-[60vh]">
        <div className="mb-8 h-1.5 rounded-full bg-line" />
        <p className="text-sm font-semibold text-gold-700">{plannerLabels[category] ?? "Planner"}</p>
        <p className="mt-3 font-display text-3xl tracking-tight text-muted">Loading the questions…</p>
      </div>
    );

  // ---------- Step: other categories ----------
  if (step === "other" || !config) {
    const c = categoryBySlug[category];
    const live = Object.values(plannerLabels).map((l) => l.toLowerCase());
    return (
      <div key="other" className={`space-y-10 ${moved ? "step-enter" : ""}`}>
        <button type="button" onClick={() => go("category")} className="text-sm font-semibold text-gold-700">← Change category</button>
        <div>
          <h2 className="font-display text-3xl tracking-tight">{c ? `${c.name}: where you should be` : "Tell us about your brand"}</h2>
          {c && (
            <>
              <p className="mt-2 max-w-2xl text-muted">Your audience: {c.audience}. The feeling to build: <em>“{c.feeling}”</em></p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {platforms.filter((p) => c.fit[p.id] !== "skip").map((p) => (
                  <li key={p.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <FitChip fit={c.fit[p.id]} label={c.fit[p.id] === "core" ? "Core" : "Add"} />
                    <div><p className="font-semibold">{p.name}</p><p className="text-[13px] text-muted">{p.job}</p></div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-cream/50 p-6 sm:p-8">
          <p className="font-display text-2xl">Get your detailed day-by-day plan</p>
          <p className="mt-2 mb-6 text-muted">
            Our instant planner is live for {live.slice(0, -1).join(", ")} and {live[live.length - 1]} so far. For {c ? c.name.toLowerCase() : "your business"}, a strategist builds the same detailed plan with you — share your details below.
          </p>
          <LeadForm source="plan-builder" defaultCategory={c?.name ?? ""} context={c ? `Plan builder request: ${c.name}` : "Plan builder request"} waHref={whatsappLink(`Hi Oryza, I'd like a social media plan for my ${c?.name ?? "business"}.`)} />
        </div>
      </div>
    );
  }

  // ---------- Step: plan ----------
  if (step === "plan" && plan) {
    const catName = categoryBySlug[config.slug]?.name ?? config.label;
    const lockSlot = (
      <form
        className="mt-6 rounded-3xl bg-ink p-7 text-paper sm:p-10"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setLead("sending");
          setUnlocked(true);
          setLead(await sendLead({
            name: String(fd.get("name")), phone: String(fd.get("phone")), business: name, city: String(a.city ?? ""),
            category: catName, message: "Unlocked the full plan on the website.", plan: planSummary(plan), website: String(fd.get("website") ?? ""),
            source: "plan-builder", answers: JSON.stringify({ category: config.slug, ...a }),
          }));
        }}
      >
        <p className="font-display text-3xl">Unlock the full 30-day plan</p>
        <p className="mt-2 max-w-xl text-paper/70">All four weeks, profile optimization checklist, shoot-day shot lists, deliverables for each platform and your next two months.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div><label htmlFor="ul-name" className="sr-only">Your name</label><input id="ul-name" name="name" required placeholder="Your name" autoComplete="name" className={inputCls} /></div>
          <div><label htmlFor="ul-phone" className="sr-only">WhatsApp number</label><input id="ul-phone" name="phone" required placeholder="WhatsApp number" inputMode="tel" pattern="[0-9+ \-]{10,16}" autoComplete="tel" className={inputCls} /></div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button type="submit" className="rounded-full bg-gold-300 px-7 py-3 font-semibold text-ink hover:bg-gold-100">Show my full plan</button>
        </div>
      </form>
    );
    return (
      <div key="plan" className={moved ? "step-enter" : ""}>
        <div className="no-print mb-10 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => go(steps[steps.length - 1].id)} className="text-sm font-semibold text-gold-700">← Edit answers</button>
          {unlocked && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.print()} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:border-ink">Save as PDF</button>
              {waPlan && <a href={waPlan} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">Send this plan to Oryza on WhatsApp</a>}
            </div>
          )}
        </div>
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Social media plan for {name}</h2>
        <p className="mt-2 mb-10 text-muted">Built by the Oryza planner from your answers. Our strategist reviews every plan before work begins.</p>
        {unlocked && lead !== "idle" && lead !== "sending" && <div className="no-print mb-8"><LeadStatus status={lead} waHref={waPlan} /></div>}
        <PlanView plan={plan} unlocked={unlocked} lockSlot={lockSlot} />
        {unlocked && (
          <section className="no-print border-t border-line py-10">
            <h2 className="mb-4 flex items-baseline gap-4 font-display text-3xl"><span className="text-lg text-gold-500">{plan.compliance ? 13 : 12}</span>Next step</h2>
            <p className="max-w-2xl text-muted">Send this plan to us and book a 20-minute call. We’ll walk you through it and confirm the package that fits.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {waPlan && <a href={waPlan} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-6 py-3 font-semibold text-paper">Send on WhatsApp</a>}
              <a href="/contact" className="rounded-full border border-ink/20 px-6 py-3 font-semibold hover:border-ink">Book a call</a>
            </div>
          </section>
        )}
      </div>
    );
  }

  // ---------- Questionnaire (rendered from the category's planner config) ----------
  const current = steps[Math.max(0, idx)];
  const visible = current.questions.filter((q) => !q.when || q.when(a));
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canNext) next(); }}>
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Questionnaire progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1}>
        <div className="h-full rounded-full bg-gold-500 transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="text-sm font-semibold text-gold-700">{config.label} · step {idx + 1} of {steps.length}</p>
      <div key={step} className={moved ? "step-enter" : ""}>
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">{current.title}</h2>
          {rows(visible).map((row) => (
            <Fragment key={row[0].key}>
              {row[0].half ? (
                <div className="grid gap-5 sm:grid-cols-2">{row.map((q) => <QuestionField key={q.key} q={q} a={a} set={set} />)}</div>
              ) : (
                <QuestionField q={row[0]} a={a} set={set} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        <button type="button" onClick={back} className="text-sm font-semibold text-muted hover:text-ink">← Back</button>
        <button type="submit" disabled={!canNext} className="rounded-full bg-ink px-7 py-3 font-semibold text-paper hover:bg-ink-soft disabled:opacity-50">
          {idx === steps.length - 1 ? "Build my plan" : "Next"}
        </button>
      </div>
    </form>
  );
}
