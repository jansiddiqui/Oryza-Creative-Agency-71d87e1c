"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/app/admin/(panel)/clients/actions";
import { QuestionField, rows } from "./QuestionFields";
import type { Answers, PlannerConfig } from "@/components/planner/questions";
import { packages, type PackageId } from "@/lib/engine/packages";
import { CATEGORY_LABELS as plannerLabels, opsPlannerLoaders as plannerLoaders } from "@/lib/ops/categories";
import { defaultRenewal } from "@/lib/ops/dates";
import { CLIENT_COLOURS } from "@/lib/ops/types";
import { Notice } from "../AdminShell";
import { btn, btnGhost, field } from "./ui";

export interface NewClientPrefill {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  leadId: string | null;
  leadName?: string;
}

const label = "block text-[13px] font-semibold";

/** Planner configs already loaded in this browser tab (switching back to a category is instant). */
const loadedConfigs = new Map<string, PlannerConfig>();
export async function preloadPlanner(slug: string): Promise<PlannerConfig> {
  const cached = loadedConfigs.get(slug);
  if (cached) return cached;
  const cfg = await plannerLoaders[slug]();
  loadedConfigs.set(slug, cfg);
  return cfg;
}

/**
 * Lead → client. Plan-builder leads bring their answers; otherwise the category's planner questions are asked
 * here. The plan is generated with the same planner code as the public site.
 */
export function NewClientForm({ prefill, answers: leadAnswers, start, colour }: { prefill: NewClientPrefill; answers: Answers | null; start: string; colour: string }) {
  const router = useRouter();
  const [c, setC] = useState({ ...prefill, package: (String(leadAnswers?.pkg ?? "growth") as PackageId), startDate: start, renewalDate: defaultRenewal(start), colour });
  const startAnswers = (cfg: PlannerConfig, prev: Answers, slug: string): Answers => ({
    ...cfg.initial,
    ...(leadAnswers && prefill.category === slug ? leadAnswers : prev),
    [cfg.nameKey]: (leadAnswers?.[cfg.nameKey] as string) || (prev[cfg.nameKey] as string) || c.name,
  });
  const [loaded, setConfig] = useState<PlannerConfig | null>(() => loadedConfigs.get(prefill.category) ?? null);
  const config = loaded?.slug === c.category ? loaded : null;
  const [answers, setAnswers] = useState<Answers>(() => (loaded ? startAnswers(loaded, leadAnswers ?? {}, prefill.category) : (leadAnswers ?? {})));
  const [editAnswers, setEditAnswers] = useState(!leadAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    if (loaded?.slug === c.category || !plannerLoaders[c.category]) return;
    preloadPlanner(c.category).then((cfg) => {
      if (!live) return;
      setConfig(cfg);
      setAnswers((prev) => startAnswers(cfg, prev, c.category));
    });
    return () => {
      live = false;
    };
    // Only reload when the category changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.category]);

  const set = (k: keyof typeof c, v: string) => setC((p) => ({ ...p, [k]: v, ...(k === "startDate" && /^\d{4}-\d{2}-\d{2}$/.test(v) && { renewalDate: defaultRenewal(v) }) }));
  const setAnswer = (k: string, v: unknown) => setAnswers((p) => ({ ...p, [k]: v }));
  const answered = Object.keys(leadAnswers ?? {}).length;

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!config) return setError("Choose the client's category first.");
        setBusy(true);
        setError("");
        const res = await createClientAction(
          { name: c.name, category: c.category, contactPerson: c.contactPerson, phone: c.phone, email: c.email, city: c.city, package: c.package, startDate: c.startDate, renewalDate: c.renewalDate || null, colour: c.colour, notes: c.notes, leadId: c.leadId },
          { ...answers, pkg: c.package },
        );
        if (res.ok) router.push(`/admin/clients/${res.data.clientId}/plans/${res.data.planId}?new=1`);
        else {
          setBusy(false);
          setError(res.error === "Something went wrong. Please try again." ? "Could not create the client — check the details (name, category, dates) and try again." : res.error);
        }
      }}
    >
      {prefill.leadId && <Notice>Converting the lead from {prefill.leadName || prefill.name}. {answered ? `Their ${answered} plan-builder answers are filled in below.` : "They did not use the plan builder, so answer the category questions below."}</Notice>}

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2">
        <legend className="px-1 font-display text-xl">Client</legend>
        <label className={label}>Business name<input required value={c.name} onChange={(e) => set("name", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>
          Category
          <select required value={c.category} onChange={(e) => set("category", e.target.value)} className={`mt-1 w-full ${field}`}>
            <option value="">Choose…</option>
            {Object.entries(plannerLabels).map(([slug, l]) => <option key={slug} value={slug}>{l}</option>)}
          </select>
        </label>
        <label className={label}>Contact person<input value={c.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Phone / WhatsApp<input type="tel" value={c.phone} onChange={(e) => set("phone", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Email<input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>City<input value={c.city} onChange={(e) => set("city", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={`${label} sm:col-span-2`}>Notes<textarea rows={2} value={c.notes} onChange={(e) => set("notes", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <div className="sm:col-span-2">
          <p className={label}>Calendar colour</p>
          <div role="radiogroup" aria-label="Calendar colour" className="mt-2 flex flex-wrap gap-2">
            {CLIENT_COLOURS.map((hex) => (
              <button key={hex} type="button" role="radio" aria-checked={c.colour === hex} aria-label={hex} onClick={() => set("colour", hex)}
                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-paper ${c.colour === hex ? "ring-2 ring-ink" : ""}`} style={{ background: hex }} />
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-3">
        <legend className="px-1 font-display text-xl">Package and dates</legend>
        <label className={label}>
          Package
          <select value={c.package} onChange={(e) => set("package", e.target.value)} className={`mt-1 w-full ${field}`}>
            {Object.entries(packages).map(([id, p]) => <option key={id} value={id}>{p.name} — {p.reels} reels · {p.posts} posts</option>)}
          </select>
        </label>
        <label className={label}>Plan start date<input type="date" required value={c.startDate} onChange={(e) => set("startDate", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Renewal date<input type="date" value={c.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      </fieldset>

      {c.category && (
        <fieldset className="rounded-2xl border border-line bg-paper p-5">
          <legend className="px-1 font-display text-xl">Category questions</legend>
          {!config ? (
            <p className="text-[14px] text-muted">Loading the {plannerLabels[c.category]} questions…</p>
          ) : !editAnswers ? (
            <div className="flex flex-wrap items-center gap-3 text-[14px]">
              <p>Using the answers from the plan builder.</p>
              <button type="button" className={btnGhost} onClick={() => setEditAnswers(true)}>Review or edit answers</button>
            </div>
          ) : (
            <div className="space-y-8">
              {config.steps.map((s) => {
                const visible = s.questions.filter((q) => q.kind !== "package" && (!q.when || q.when(answers)));
                if (!visible.length) return null;
                return (
                  <div key={s.id} className="space-y-5">
                    <h3 className="text-[15px] font-semibold">{s.title}</h3>
                    {rows(visible).map((row) => (
                      <div key={row.map((q) => q.key).join("+")} className={row.length > 1 ? "grid gap-5 sm:grid-cols-2" : ""}>
                        {row.map((q) => <QuestionField key={q.key} q={q} a={answers} set={setAnswer} />)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy || !config} className={btn}>{busy ? "Creating client and plan…" : "Create client and generate plan"}</button>
        <p className="text-[13px] text-muted">The plan opens as a draft you can edit before approving.</p>
      </div>
    </form>
  );
}
