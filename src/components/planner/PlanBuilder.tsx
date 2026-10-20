"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { categoryBySlug } from "@/data/categories";
import { platforms, platformById, type PlatformId } from "@/data/platforms";
import { schoolOptions } from "@/data/playbooks/school";
import { generateSchoolPlan, packages, type EventKind, type Goal, type SchoolAnswers } from "@/lib/engine/school-engine";
import { fmtDate, nextMonday } from "@/lib/engine/dates";
import type { Plan } from "@/lib/engine/types";
import { inputCls, labelCls, LeadForm, LeadStatus, sendLead, type LeadResult } from "@/components/LeadForm";
import { FitChip } from "@/components/ui";
import { PlanView } from "./PlanView";
import { CategoryStep } from "./CategoryStep";
import { whatsappLink } from "@/lib/site";

type Step = "category" | "basics" | "goals" | "details" | "presence" | "package" | "plan" | "other";
const SCHOOL_STEPS: Step[] = ["basics", "goals", "details", "presence", "package"];

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${
    on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40"
  }`;

function Choice<T extends string>({ options, value, onChange, name }: { options: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void; name: string }) {
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

const schoolCore = (Object.keys(categoryBySlug.schools.fit) as PlatformId[]).filter((p) => categoryBySlug.schools.fit[p] === "core");

function planSummary(plan: Plan): string {
  const lines = plan.snapshot.map((s) => `${s.label}: ${s.value}`);
  lines.push(`Package: ${plan.pkg.name} (${plan.pkg.summary})`);
  lines.push(`Platforms: ${plan.platforms.filter((p) => p.selected).map((p) => p.name).join(", ")}`);
  if (plan.optimization.length) lines.push(`Optimization: ${plan.optimization.map((o) => o.name).join(", ")}`);
  const pinned = plan.days.flatMap((d) => d.items.filter((i) => i.pinnedReason && i.platform === "instagram").map((i) => `Day ${d.day} (${fmtDate(d.date)}): ${i.title}`));
  if (pinned.length) lines.push("Key dates:", ...pinned.slice(0, 8));
  return lines.join("\n");
}

export function PlanBuilder() {
  const params = useSearchParams();
  const initialCat = params.get("category") ?? "";
  const [category, setCategory] = useState(initialCat);
  const [step, setStep] = useState<Step>(initialCat === "schools" ? "basics" : initialCat ? "other" : "category");
  const [a, setA] = useState<Omit<SchoolAnswers, "startDate">>({
    name: "", city: "Kanpur", board: "cbse", level: "12", goals: ["admissions"],
    admissionOpen: "", admissionClose: "", events: [], usps: [], achievements: ["", "", ""],
    stage: "revive", consent: "some", shoot: "2", pkg: "growth", platforms: schoolCore, optimize: [],
  });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [lead, setLead] = useState<LeadResult>("idle");
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) => setA((p) => ({ ...p, [k]: v }));
  const toggle = <T,>(arr: T[], v: T, max = 99) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.length >= max ? arr : [...arr, v]);

  const idx = SCHOOL_STEPS.indexOf(step);
  // Step transitions animate only after the visitor has moved, never on first render.
  const [moved, setMoved] = useState(false);
  const go = (s: Step) => { setMoved(true); setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => {
    if (idx < SCHOOL_STEPS.length - 1) return go(SCHOOL_STEPS[idx + 1]);
    const p = generateSchoolPlan({
      ...a,
      admissionOpen: a.admissionOpen || undefined,
      admissionClose: a.admissionClose || undefined,
      events: a.events.filter((e) => e.date),
      startDate: nextMonday(),
    });
    setPlan(p);
    go("plan");
  };
  const back = () => (idx > 0 ? go(SCHOOL_STEPS[idx - 1]) : go("category"));
  const canNext = step !== "basics" || a.name.trim().length > 1;

  const waPlan = useMemo(() => (plan ? whatsappLink(`Hi Oryza, here is the plan I built on your website:\n\n${planSummary(plan)}`) : null), [plan]);

  // ---------- Step: category ----------
  if (step === "category")
    return (
      <CategoryStep
        key="category"
        className={moved ? "step-enter" : ""}
        onPick={(slug, live) => { setCategory(slug); go(slug && live ? "basics" : "other"); }}
      />
    );

  // ---------- Step: other categories ----------
  if (step === "other") {
    const c = categoryBySlug[category];
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
            Our instant planner is live for schools first. For {c ? c.name.toLowerCase() : "your business"}, a strategist builds the same detailed plan with you — share your details below.
          </p>
          <LeadForm defaultCategory={c?.name ?? ""} context={c ? `Plan builder request: ${c.name}` : "Plan builder request"} waHref={whatsappLink(`Hi Oryza, I'd like a social media plan for my ${c?.name ?? "business"}.`)} />
        </div>
      </div>
    );
  }

  // ---------- Step: plan ----------
  if (step === "plan" && plan) {
    const lockSlot = (
      <form
        className="mt-6 rounded-3xl bg-ink p-7 text-paper sm:p-10"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setLead("sending");
          setUnlocked(true);
          setLead(await sendLead({
            name: String(fd.get("name")), phone: String(fd.get("phone")), business: a.name, city: a.city,
            category: "Schools", message: "Unlocked the full plan on the website.", plan: planSummary(plan), website: String(fd.get("website") ?? ""),
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
          <button type="button" onClick={() => go("package")} className="text-sm font-semibold text-gold-700">← Edit answers</button>
          {unlocked && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.print()} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:border-ink">Save as PDF</button>
              {waPlan && <a href={waPlan} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">Send this plan to Oryza on WhatsApp</a>}
            </div>
          )}
        </div>
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Social media plan for {a.name}</h2>
        <p className="mt-2 mb-10 text-muted">Built by the Oryza planner from your answers. Our strategist reviews every plan before work begins.</p>
        {unlocked && lead !== "idle" && lead !== "sending" && <div className="no-print mb-8"><LeadStatus status={lead} waHref={waPlan} /></div>}
        <PlanView plan={plan} unlocked={unlocked} lockSlot={lockSlot} />
        {unlocked && (
          <section className="no-print border-t border-line py-10">
            <h2 className="mb-4 flex items-baseline gap-4 font-display text-3xl"><span className="text-lg text-gold-500">12</span>Next step</h2>
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

  // ---------- School questionnaire ----------
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canNext) next(); }}>
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Questionnaire progress" aria-valuemin={1} aria-valuemax={SCHOOL_STEPS.length} aria-valuenow={idx + 1}>
        <div className="h-full rounded-full bg-gold-500 transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${((idx + 1) / SCHOOL_STEPS.length) * 100}%` }} />
      </div>
      <p className="text-sm font-semibold text-gold-700">Schools · step {idx + 1} of {SCHOOL_STEPS.length}</p>
      <div key={step} className={moved ? "step-enter" : ""}>

      {step === "basics" && (
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">About your school</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="School name" htmlFor="q-name"><input id="q-name" required value={a.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
            <Field label="City" htmlFor="q-city"><input id="q-city" value={a.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Board"><Choice name="Board" options={schoolOptions.boards} value={a.board} onChange={(v) => set("board", v)} /></Field>
          <Field label="Classes offered"><Choice name="Classes" options={schoolOptions.levels} value={a.level} onChange={(v) => set("level", v)} /></Field>
        </div>
      )}

      {step === "goals" && (
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">Goals and admission dates</h2>
          <Field label="What do you want in the next 3 months?" hint="Pick one or more. The first one you pick is your main goal.">
            <div className="flex flex-wrap gap-2">
              {schoolOptions.goals.map((g) => (
                <button key={g.id} type="button" aria-pressed={a.goals.includes(g.id)} className={chip(a.goals.includes(g.id))} onClick={() => set("goals", toggle(a.goals, g.id as Goal))}>
                  {a.goals[0] === g.id && "★ "}{g.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Admissions open on" htmlFor="q-open" hint="Leave empty if not decided."><input id="q-open" type="date" value={a.admissionOpen} onChange={(e) => set("admissionOpen", e.target.value)} className={inputCls} /></Field>
            <Field label="Last date for admission" htmlFor="q-close"><input id="q-close" type="date" value={a.admissionClose} onChange={(e) => set("admissionClose", e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">Events, strengths and achievements</h2>
          <Field label="Events in the next 60 days">
            <div className="space-y-3">
              {a.events.map((ev, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <select aria-label="Event type" value={ev.kind} onChange={(e) => set("events", a.events.map((x, j) => (j === i ? { ...x, kind: e.target.value as EventKind } : x)))} className={inputCls}>
                    {schoolOptions.events.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <input aria-label="Event date" type="date" value={ev.date} onChange={(e) => set("events", a.events.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className={inputCls} />
                  <button type="button" onClick={() => set("events", a.events.filter((_, j) => j !== i))} className="rounded-full px-4 text-sm font-semibold text-muted hover:text-ink">Remove</button>
                </div>
              ))}
              {a.events.length < 6 && (
                <button type="button" onClick={() => set("events", [...a.events, { kind: "sports", date: "" }])} className="rounded-full border border-dashed border-ink/30 px-5 py-2 text-sm font-semibold hover:border-ink">+ Add an event</button>
              )}
            </div>
          </Field>
          <Field label="What makes you different?" hint="Pick up to 3.">
            <div className="flex flex-wrap gap-2">
              {schoolOptions.usps.map((u) => (
                <button key={u.id} type="button" aria-pressed={a.usps.includes(u.id)} className={chip(a.usps.includes(u.id))} onClick={() => set("usps", toggle(a.usps, u.id, 3))}>{u.label}</button>
              ))}
            </div>
          </Field>
          <Field label="Recent achievements" hint="Toppers, competitions, awards — only real ones. Each becomes a post.">
            <div className="space-y-2">
              {a.achievements.map((v, i) => (
                <input key={i} aria-label={`Achievement ${i + 1}`} value={v} onChange={(e) => set("achievements", a.achievements.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} placeholder={i === 0 ? "e.g. District science fair winner" : ""} />
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === "presence" && (
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">Your profiles and access</h2>
          <Field label="Your social media today"><Choice name="Stage" options={[{ id: "new", label: "Not started" }, { id: "revive", label: "Page exists, rarely posts" }, { id: "active", label: "Posting regularly" }] as const} value={a.stage} onChange={(v) => set("stage", v)} /></Field>
          <Field label="Written parent consent for student photos?"><Choice name="Consent" options={[{ id: "yes", label: "Yes, written" }, { id: "some", label: "Some" }, { id: "no", label: "No" }] as const} value={a.consent} onChange={(v) => set("consent", v)} /></Field>
          <Field label="How much time can the school give for shoots?"><Choice name="Shoot" options={[{ id: "1", label: "1 shoot day a month" }, { id: "2", label: "2 shoot days" }, { id: "weekly", label: "Weekly access" }, { id: "own", label: "We'll send our own photos" }] as const} value={a.shoot} onChange={(v) => set("shoot", v)} /></Field>
          <Field label="Which platforms should we manage?" hint="Core platforms for schools are pre-selected.">
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button key={p.id} type="button" aria-pressed={a.platforms.includes(p.id)} className={chip(a.platforms.includes(p.id))} onClick={() => set("platforms", toggle(a.platforms, p.id))}>{p.name}</button>
              ))}
            </div>
          </Field>
          <Field label="Optimize these profiles first? (one-time, extra cost)">
            <div className="flex flex-wrap gap-2">
              {a.platforms.map((p) => (
                <button key={p} type="button" aria-pressed={a.optimize.includes(p)} className={chip(a.optimize.includes(p))} onClick={() => set("optimize", toggle(a.optimize, p))}>{platformById[p].name}</button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === "package" && (
        <div className="mt-3 space-y-7">
          <h2 className="font-display text-3xl tracking-tight">How much content each month?</h2>
          <div role="radiogroup" aria-label="Package" className="grid gap-4 md:grid-cols-3">
            {Object.entries(packages).map(([id, p]) => (
              <button key={id} type="button" role="radio" aria-checked={a.pkg === id} onClick={() => set("pkg", id as SchoolAnswers["pkg"])}
                className={`rounded-2xl border p-6 text-left ${a.pkg === id ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40"}`}>
                <p className="font-display text-2xl">{p.name}</p>
                <p className={`mt-2 text-[14px] ${a.pkg === id ? "text-paper/80" : "text-muted"}`}>{p.reels} reels · {p.posts} posts · stories {p.storyDaysPerWeek >= 7 ? "daily" : `${p.storyDaysPerWeek}×/week`} · {p.shoots} shoot day{p.shoots > 1 ? "s" : ""}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      </div>
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        <button type="button" onClick={back} className="text-sm font-semibold text-muted hover:text-ink">← Back</button>
        <button type="submit" disabled={!canNext} className="rounded-full bg-ink px-7 py-3 font-semibold text-paper hover:bg-ink-soft disabled:opacity-50">
          {step === "package" ? "Build my plan" : "Next"}
        </button>
      </div>
    </form>
  );
}
