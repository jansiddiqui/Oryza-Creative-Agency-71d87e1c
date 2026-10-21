"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { approvePlanAction, checkWordingAction, nextMonthAction, savePlanAction } from "@/app/admin/(panel)/clients/actions";
import { platformById, platforms, type PlatformId } from "@/data/platforms";
import type { Client, ClientPlanRow, TeamMember } from "@/lib/admin/ops-data";
import { addDays } from "@/lib/engine/dates";
import { nextMonthStart } from "@/lib/ops/dates";
import { addCustomItem, removeItem, updateItem, type ItemPatch } from "@/lib/ops/plan-draft";
import type { DraftItem, PlanDraft } from "@/lib/ops/types";
import { fmtWhen, Notice } from "../AdminShell";
import { btn, btnGhost, catLabel, ClientDot, field, fmtDay, formatLabel, PlatformGlyph } from "./ui";

const FORMATS = ["reel", "post", "carousel", "story", "short", "video", "blog", "gpost", "broadcast", "status", "event", "pin"];
const label = "block text-[12px] font-semibold text-ink-soft";

function ItemEditor({ item, warnings, team, onChange, onRemove, readOnly }: { item: DraftItem; warnings: string[]; team: TeamMember[]; onChange: (p: ItemPatch) => void; onRemove: () => void; readOnly: boolean }) {
  // Items whose wording breaks a rule start open, so the warning is seen.
  const [open, setOpen] = useState(warnings.length > 0);
  return (
    <li className={`rounded-xl border bg-paper ${warnings.length ? "border-red-800/40" : "border-line"}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
        <span className="mt-0.5 w-16 shrink-0 text-[12px] text-muted">{item.time}</span>
        <span className="mt-0.5"><PlatformGlyph platform={item.platform} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">{item.title}</span>
          <span className="block text-[12px] text-muted">
            {platformById[item.platform]?.name} · {formatLabel(item.format)}
            {item.pinnedReason && ` · ${item.pinnedReason}`}
            {item.custom && " · added by hand"}
            {item.assignee && ` · ${team.find((m) => m.email === item.assignee)?.name ?? item.assignee}`}
          </span>
        </span>
        {warnings.length > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-900">Check wording</span>}
      </button>
      {open && (
        <div className="space-y-3 border-t border-line px-3 py-3">
          {warnings.map((w) => <p key={w} role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-900">{w}</p>)}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`${label} sm:col-span-2`}>Title<input disabled={readOnly} value={item.title} onChange={(e) => onChange({ title: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={`${label} sm:col-span-2`}>Hook<textarea disabled={readOnly} rows={2} value={item.hook} onChange={(e) => onChange({ hook: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>Call to action<input disabled={readOnly} value={item.cta} onChange={(e) => onChange({ cta: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>Time<input disabled={readOnly} value={item.time} onChange={(e) => onChange({ time: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>Move to date<input disabled={readOnly} type="date" value={item.date} onChange={(e) => e.target.value && onChange({ date: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>
              Assignee
              <select disabled={readOnly} value={item.assignee ?? ""} onChange={(e) => onChange({ assignee: e.target.value || null })} className={`mt-1 w-full ${field}`}>
                <option value="">By role (default)</option>
                {team.filter((m) => m.active).map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
              </select>
            </label>
          </div>
          {item.complianceNote && (
            <p className="rounded-lg border border-gold-500/40 bg-gold-100/50 px-3 py-2 text-[13px]">
              <span className="font-semibold">Compliance note (locked):</span> {item.complianceNote}
            </p>
          )}
          {!readOnly && (
            <button type="button" onClick={onRemove} className="text-[13px] font-semibold text-red-900 underline-offset-4 hover:underline">Remove this item</button>
          )}
        </div>
      )}
    </li>
  );
}

function AddItem({ start, selected, onAdd }: { start: string; selected: PlatformId[]; onAdd: (x: { date: string; platform: PlatformId; format: string; title: string; hook: string; cta: string; time: string }) => void }) {
  const [x, setX] = useState({ date: start, platform: selected[0] ?? "instagram", format: "post", title: "", hook: "", cta: "", time: "1:30 pm" });
  return (
    <form
      className="grid gap-3 rounded-2xl border border-dashed border-ink/30 p-4 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!x.title.trim()) return;
        onAdd(x);
        setX({ ...x, title: "", hook: "", cta: "" });
      }}
    >
      <p className="font-semibold sm:col-span-4">Add a custom item</p>
      <label className={label}>Date<input type="date" required value={x.date} onChange={(e) => setX({ ...x, date: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>
        Platform
        <select value={x.platform} onChange={(e) => setX({ ...x, platform: e.target.value as PlatformId })} className={`mt-1 w-full ${field}`}>
          {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className={label}>
        Format
        <select value={x.format} onChange={(e) => setX({ ...x, format: e.target.value })} className={`mt-1 w-full ${field}`}>
          {FORMATS.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
        </select>
      </label>
      <label className={label}>Time<input value={x.time} onChange={(e) => setX({ ...x, time: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
      <label className={`${label} sm:col-span-2`}>Title<input required value={x.title} onChange={(e) => setX({ ...x, title: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>Hook<input value={x.hook} onChange={(e) => setX({ ...x, hook: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>Call to action<input value={x.cta} onChange={(e) => setX({ ...x, cta: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
      <button className={`${btnGhost} sm:col-span-4 sm:justify-self-start`}>Add item</button>
    </form>
  );
}

/** Draft plan editor: wording, time, date, remove, add, reassign. Compliance notes are locked; risky wording is flagged. */
export function PlanEditor({ plan, client, team, created, initialWarnings }: { plan: ClientPlanRow; client: Client; team: TeamMember[]; created?: boolean; initialWarnings: Record<string, string[]> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<PlanDraft>(plan.draft);
  const [saved, setSaved] = useState(JSON.stringify(plan.draft));
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(created ? { tone: "ok", text: "Client created and plan generated. Review it, then approve." } : null);
  const [busy, setBusy] = useState("");
  const [nextStart, setNextStart] = useState(nextMonthStart(plan.monthStart));
  const readOnly = plan.status !== "draft";
  const dirty = JSON.stringify(draft) !== saved;
  const selected = (Array.isArray(plan.answers.platforms) ? plan.answers.platforms : ["instagram"]) as PlatformId[];

  const byDate = useMemo(() => {
    const m = new Map<string, DraftItem[]>();
    for (const x of [...draft.items].sort((a, b) => a.date.localeCompare(b.date))) m.set(x.date, [...(m.get(x.date) ?? []), x]);
    return [...m.entries()];
  }, [draft.items]);
  const shootDates = new Set(draft.shoots.map((s) => s.date));
  // Wording checks run on the server (the category rules stay out of the browser bundle), shortly after typing stops.
  const [warnings, setWarnings] = useState(initialWarnings);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const check = (x: DraftItem) => {
    clearTimeout(timers.current.get(x.id));
    timers.current.set(
      x.id,
      setTimeout(async () => {
        const res = await checkWordingAction(plan.id, [x.title, x.hook, x.cta].join(" \n "));
        if (res.ok) setWarnings((w) => ({ ...w, [x.id]: res.data }));
      }, 400),
    );
  };
  const edit = (id: string, p: ItemPatch) => {
    const next = updateItem(draft, id, p);
    setDraft(next);
    if (p.title !== undefined || p.hook !== undefined || p.cta !== undefined) check(next.items.find((x) => x.id === id)!);
  };
  const add = (x: Parameters<typeof addCustomItem>[1]) => {
    const next = addCustomItem(draft, x);
    setDraft(next);
    check(next.items[next.items.length - 1]);
  };
  const flagged = draft.items.filter((x) => warnings[x.id]?.length).length;

  async function save(): Promise<boolean> {
    setBusy("save");
    const res = await savePlanAction(plan.id, draft);
    setBusy("");
    if (!res.ok) {
      setMsg({ tone: "error", text: res.error });
      return false;
    }
    setDraft(res.data);
    setSaved(JSON.stringify(res.data));
    setMsg({ tone: "ok", text: "Draft saved." });
    return true;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
        <span className="flex items-center gap-2 font-semibold"><ClientDot colour={client.colour} /> <Link href={`/admin/clients/${client.id}`} className="underline-offset-4 hover:underline">{client.name}</Link></span>
        <span className="text-muted">{catLabel(client.category)} · starts {fmtDay(plan.monthStart)} · {draft.items.length} items · {draft.shoots.length} shoot days · engine {plan.engineVersion}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${readOnly ? "bg-ink text-paper" : "bg-gold-100 text-gold-700"}`}>{readOnly ? `Approved ${fmtWhen(plan.approvedAt)}` : "Draft"}</span>
      </div>

      {msg && <div className="mb-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {flagged > 0 && !readOnly && <div className="mb-4"><Notice tone="error">{flagged} item{flagged > 1 ? "s use" : " uses"} wording that breaks this category&apos;s rules. Open the items marked “Check wording”.</Notice></div>}

      {draft.compliance.length > 0 && (
        <details className="mb-6 rounded-2xl border border-gold-500/40 bg-gold-100/40 p-4" open>
          <summary className="cursor-pointer font-semibold">Compliance notes for this plan (locked — cannot be removed)</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">{draft.compliance.map((c) => <li key={c}>{c}</li>)}</ul>
        </details>
      )}

      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        {!readOnly ? (
          <>
            <button type="button" disabled={!dirty || !!busy} onClick={save} className={btnGhost}>{busy === "save" ? "Saving…" : dirty ? "Save draft" : "Saved"}</button>
            <button
              type="button"
              disabled={!!busy}
              className={btn}
              onClick={async () => {
                if (flagged && !window.confirm(`${flagged} item(s) still break the category's wording rules. Approve anyway?`)) return;
                if (!window.confirm(`Approve this plan? This creates ${draft.items.length} content items, their tasks and ${draft.shoots.length} shoot days.`)) return;
                if (dirty && !(await save())) return;
                setBusy("approve");
                const res = await approvePlanAction(plan.id);
                setBusy("");
                if (!res.ok) return setMsg({ tone: "error", text: res.error });
                setMsg({ tone: "ok", text: `Approved: ${res.data.items} items, ${res.data.tasks} tasks, ${res.data.shoots} shoot days.${res.data.late ? ` ${res.data.late} task(s) were already past due and are flagged late.` : ""}` });
                router.refresh();
              }}
            >
              {busy === "approve" ? "Approving…" : "Approve plan"}
            </button>
          </>
        ) : (
          <Link href={`/admin/calendar?client=${client.id}&date=${plan.monthStart}`} className={btnGhost}>Open in calendar</Link>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <label className="text-[13px] font-semibold" htmlFor="next-start">Next month from</label>
          <input id="next-start" type="date" value={nextStart} onChange={(e) => setNextStart(e.target.value)} className={field} />
          <button
            type="button"
            disabled={!!busy}
            className={btnGhost}
            onClick={async () => {
              setBusy("next");
              const res = await nextMonthAction(plan.id, nextStart);
              setBusy("");
              if (!res.ok) return setMsg({ tone: "error", text: res.error === "Something went wrong. Please try again." ? "Could not generate — a plan may already exist for that start date." : res.error });
              router.push(`/admin/clients/${client.id}/plans/${res.data.planId}?new=1`);
            }}
          >
            {busy === "next" ? "Generating…" : "Generate next month"}
          </button>
        </span>
      </div>

      <ol className="space-y-5">
        {byDate.map(([date, items]) => (
          <li key={date}>
            <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
              {fmtDay(date)}
              {shootDates.has(date) && <span className="rounded-full border border-dashed border-ink/40 px-2 py-0.5 text-[11px]">Shoot day</span>}
            </h3>
            <ul className="space-y-2">
              {items.map((x) => (
                <ItemEditor
                  key={x.id}
                  item={x}
                  warnings={warnings[x.id] ?? []}
                  team={team}
                  readOnly={readOnly}
                  onChange={(p) => edit(x.id, p)}
                  onRemove={() => window.confirm(`Remove “${x.title}”?`) && setDraft((d) => removeItem(d, x.id))}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {!readOnly && (
        <div className="mt-8">
          <AddItem start={addDays(plan.monthStart, 1)} selected={selected} onAdd={add} />
        </div>
      )}
      {draft.shoots.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl">Shoot days</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {draft.shoots.map((s) => (
              <li key={s.date} className="rounded-xl border border-line bg-paper p-4 text-[14px]">
                <p className="font-semibold">{fmtDay(s.date)} · {s.label}</p>
                <ul className="mt-2 list-disc pl-5 text-ink-soft">{s.shots.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
