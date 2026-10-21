"use client";

/*
 * The planner's question fields for the admin "new client" form. A copy of the field renderer in
 * components/planner/PlanBuilder.tsx, kept separate on purpose so the public plan-builder bundle stays byte-identical.
 * If a question kind is added there, add it here too (the admin-ops test checks every kind renders).
 */
import { platforms, platformById, type PlatformId } from "@/data/platforms";
import { packages, type PackageId } from "@/lib/engine/packages";
import type { Answers, Opt, Options, Question } from "@/components/planner/questions";

// Same classes as the public form (not imported, so no public chunk is shared with the admin).
const inputCls = "w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-muted/70 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300/40";
const labelCls = "mb-1.5 block text-sm font-semibold";

const resolveOptions = (o: Options, a: Answers) => (typeof o === "function" ? o(a) : o);

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

const toggle = <T,>(arr: T[], v: T, max = 99) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.length >= max ? arr : [...arr, v]);
type EventRow = { kind: string; date: string; label?: string };

/** One question, rendered from its definition in the category's planner config. */
export function QuestionField({ q, a, set }: { q: Question; a: Answers; set: (k: string, v: unknown) => void }) {
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
export function rows(qs: Question[]): Question[][] {
  const out: Question[][] = [];
  for (const q of qs) {
    const last = out[out.length - 1];
    if (q.half && last?.[0].half && last.length < 2) last.push(q);
    else out.push([q]);
  }
  return out;
}
