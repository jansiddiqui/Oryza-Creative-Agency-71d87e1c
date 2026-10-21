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
import { Badge, btn, btnGhost, catLabel, ClientDot, field, fmtDay, formatLabel, PlatformGlyph } from "./ui";
import { useConfirm } from "../shell/Confirm";
import { useToast } from "../shell/Toasts";

const FORMATS = ["reel", "post", "carousel", "story", "short", "video", "blog", "gpost", "broadcast", "status", "event", "pin"];
const label = "block text-[12px] font-semibold text-ink-soft";

function ItemEditor({ item, warnings, team, onChange, onRemove, readOnly }: { item: DraftItem; warnings: string[]; team: TeamMember[]; onChange: (p: ItemPatch) => void; onRemove: () => void; readOnly: boolean }) {
  // Items whose wording breaks a rule start open, so the warning is seen.
  const [open, setOpen] = useState(warnings.length > 0);
  return (
    <li className={`min-w-0 rounded-xl border bg-surface ${warnings.length ? "border-bad/50" : "border-edge"}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-left">
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
        {warnings.length > 0 && <Badge tone="bad" dot>Check wording</Badge>}
      </button>
      {open && (
        <div className="space-y-3 border-t border-edge px-3 py-3">
          {warnings.map((w) => <p key={w} role="alert" className="rounded-lg bg-bad-bg px-3 py-2 text-[13px] text-bad">{w}</p>)}
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
            <button type="button" onClick={onRemove} className="min-h-11 text-[13px] font-semibold text-bad underline-offset-4 hover:underline md:min-h-0">Remove this item</button>
          )}
        </div>
      )}
    </li>
  );
}

/** Items grouped by week (Monday start), then by day. */
export function planWeeks(items: DraftItem[]): { start: string; count: number; days: [string, DraftItem[]][] }[] {
  const weeks = new Map<string, Map<string, DraftItem[]>>();
  for (const x of [...items].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))) {
    const dow = new Date(`${x.date}T00:00:00Z`).getUTCDay();
    const start = addDays(x.date, -((dow + 6) % 7));
    const days = weeks.get(start) ?? new Map<string, DraftItem[]>();
    days.set(x.date, [...(days.get(x.date) ?? []), x]);
    weeks.set(start, days);
  }
  return [...weeks.entries()].map(([start, days]) => ({ start, count: [...days.values()].reduce((n, d) => n + d.length, 0), days: [...days.entries()] }));
}

function AddItem({ start, selected, onAdd }: { start: string; selected: PlatformId[]; onAdd: (x: { date: string; platform: PlatformId; format: string; title: string; hook: string; cta: string; time: string }) => void }) {
  const [x, setX] = useState({ date: start, platform: selected[0] ?? "instagram", format: "post", title: "", hook: "", cta: "", time: "1:30 pm" });
  return (
    <form
      className="grid gap-3 rounded-xl border border-dashed border-edge-strong p-4 sm:grid-cols-4"
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
  const confirm = useConfirm();
  const toast = useToast();
  const [draft, setDraft] = useState<PlanDraft>(plan.draft);
  const [saved, setSaved] = useState(JSON.stringify(plan.draft));
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(created ? { tone: "ok", text: "Client created and plan generated. Review it, then approve." } : null);
  const [busy, setBusy] = useState("");
  const [nextStart, setNextStart] = useState(nextMonthStart(plan.monthStart));
  const readOnly = plan.status !== "draft";
  const dirty = JSON.stringify(draft) !== saved;
  const selected = (Array.isArray(plan.answers.platforms) ? plan.answers.platforms : ["instagram"]) as PlatformId[];

  // Wording checks run on the server (the category rules stay out of the browser bundle), shortly after typing stops.
  const [warnings, setWarnings] = useState(initialWarnings);
  const [platform, setPlatform] = useState<"all" | PlatformId>("all");
  const [onlyWarnings, setOnlyWarnings] = useState(false);
  const usedPlatforms = useMemo(() => [...new Set(draft.items.map((x) => x.platform))], [draft.items]);
  const weeks = useMemo(() => planWeeks(draft.items.filter((x) => (platform === "all" || x.platform === platform) && (!onlyWarnings || warnings[x.id]?.length))), [draft.items, platform, onlyWarnings, warnings]);
  const shootDates = new Set(draft.shoots.map((s) => s.date));
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

      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-edge bg-canvas/95 px-4 py-3 backdrop-blur md:top-[60px] md:-mx-6 md:px-6">
        {!readOnly ? (
          <>
            <button type="button" disabled={!dirty || !!busy} onClick={save} className={btnGhost}>{busy === "save" ? "Saving…" : dirty ? "Save draft" : "Saved"}</button>
            <button
              type="button"
              disabled={!!busy}
              className={btn}
              onClick={async () => {
                if (!(await confirm({ title: "Approve this plan?", body: <>This creates {draft.items.length} content items, their tasks and {draft.shoots.length} shoot days. It cannot be undone from here.{flagged ? <span className="mt-2 block font-semibold text-bad">{flagged} item(s) still break the category&apos;s wording rules.</span> : null}</>, action: flagged ? "Approve anyway" : "Approve plan" }))) return;
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
        <span className="flex min-w-0 flex-wrap items-center gap-2 md:ml-auto">
          <label className="text-[13px] font-semibold" htmlFor="next-start">Next month from</label>
          <input id="next-start" type="date" value={nextStart} onChange={(e) => setNextStart(e.target.value)} className={`min-w-0 ${field}`} />
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

      <div role="group" aria-label="Filter the plan" className="mb-5 flex flex-wrap items-center gap-2">
        {(["all", ...usedPlatforms] as const).map((id) => (
          <button key={id} type="button" aria-pressed={platform === id} onClick={() => setPlatform(id)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold md:min-h-8 ${platform === id ? "border-ink bg-ink text-paper" : "border-edge-strong bg-surface"}`}>
            {id !== "all" && <PlatformGlyph platform={id} />}
            {id === "all" ? `All platforms (${draft.items.length})` : platformById[id]?.name ?? id}
          </button>
        ))}
        <label className="ml-auto flex min-h-11 items-center gap-2 text-[13px] font-semibold md:min-h-8">
          <input type="checkbox" className="size-5 md:size-4" checked={onlyWarnings} onChange={(e) => setOnlyWarnings(e.target.checked)} />
          Only items to check ({flagged})
        </label>
      </div>

      {weeks.length === 0 && <p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">{onlyWarnings ? "No wording to check. Every item follows the category's rules." : "No items for this platform."}</p>}
      <ol className="space-y-8">
        {weeks.map((w) => (
          <li key={w.start}>
            <h2 className="mb-3 flex items-baseline gap-2 border-b border-edge pb-2 font-display text-[18px] font-semibold">
              Week of {fmtDay(w.start)}
              <span className="font-sans text-[13px] font-normal text-muted">{w.count} item{w.count === 1 ? "" : "s"}</span>
            </h2>
            <ol className="space-y-5">
            {w.days.map(([date, items]) => (
          <li key={date}>
            <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
              {fmtDay(date)}
              {shootDates.has(date) && <Badge tone="violet">Shoot day</Badge>}
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
                  onRemove={() => {
                    const before = draft;
                    setDraft((d) => removeItem(d, x.id));
                    toast.show({ message: `Removed “${x.title}” from the draft`, undo: () => { setDraft(before); } });
                  }}
                />
              ))}
            </ul>
          </li>
            ))}
            </ol>
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
              <li key={s.date} className="rounded-xl border border-edge bg-surface p-4 text-[14px]">
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
