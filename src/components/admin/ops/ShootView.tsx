"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moveShootAction, previewShootMoveAction, setShotAction, updateShootDetailsAction } from "@/app/admin/(panel)/shoots/actions";
import type { TeamMember } from "@/lib/admin/ops-data";
import type { ShotRow } from "@/lib/admin/shoots-data";
import type { ItemRow, ShootRow } from "@/lib/ops/types";
import { Notice } from "../AdminShell";
import { btn, btnGhost, field, fmtDay, formatLabel, PlatformGlyph, StageBadge } from "./ui";

const label = "block text-[12px] font-semibold";

/** The shot list with checkboxes: ticking every shot of a content item completes its shoot task. */
export function ShotList({ shots, fed }: { shots: ShotRow[]; fed: Pick<ItemRow, "id" | "title">[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const general = shots.filter((s) => !s.itemId);
  const groups = fed.map((x) => ({ item: x, shots: shots.filter((s) => s.itemId === x.id) })).filter((g) => g.shots.length);
  const box = (s: ShotRow) => (
    <li key={s.id}>
      <label className="flex items-start gap-3 py-1.5 text-[15px]">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
          checked={s.done}
          disabled={busy === s.id}
          onChange={async (e) => {
            setBusy(s.id);
            await setShotAction(s.id, e.target.checked);
            setBusy("");
            router.refresh();
          }}
        />
        <span className={s.done ? "text-muted line-through" : ""}>{s.label}</span>
      </label>
    </li>
  );
  return (
    <div className="space-y-4">
      {general.length > 0 && (
        <div>
          <p className="mb-1 text-[13px] font-semibold text-muted">General shots</p>
          <ul>{general.map(box)}</ul>
        </div>
      )}
      {groups.map((g) => (
        <div key={g.item.id}>
          <p className="mb-1 text-[13px] font-semibold text-muted">For: {g.item.title}</p>
          <ul>{g.shots.map(box)}</ul>
        </div>
      ))}
      {!shots.length && <p className="text-[14px] text-muted">No shots listed yet.</p>}
    </div>
  );
}

/** The shoot-day planner: details, time slot, shooter, merged shot list, people/props, consent, and moving the day. */
export function ShootView({ shoot, clientName, clientId, shots, fed, consent, team }: { shoot: ShootRow; clientName: string; clientId: string; shots: ShotRow[]; fed: ItemRow[]; consent: string[]; team: TeamMember[] }) {
  const router = useRouter();
  const [d, setD] = useState({ location: shoot.location, startTime: shoot.startTime, endTime: shoot.endTime, shooter: shoot.shooter ?? "", props: shoot.props, people: shoot.people, notes: shoot.notes, status: shoot.status as string });
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [moveTo, setMoveTo] = useState(shoot.date);
  const [preview, setPreview] = useState<{ itemTitle: string; label: string; from: string; to: string; late: boolean }[] | null>(null);
  const done = shots.filter((s) => s.done).length;

  return (
    <div className="space-y-8">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/shoots/${shoot.id}/print`} className={btnGhost}>Print / share with shooter</Link>
        <Link href={`/admin/clients/${clientId}#shoots`} className={btnGhost}>Back to {clientName}</Link>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await updateShootDetailsAction(shoot.id, { ...d, shooter: d.shooter || null });
          setMsg(res.ok ? { tone: "ok", text: "Shoot details saved." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        }}
      >
        <label className={`${label} sm:col-span-2`}>Location<input value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Starts<input type="time" value={d.startTime} onChange={(e) => setD({ ...d, startTime: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>Ends<input type="time" value={d.endTime} onChange={(e) => setD({ ...d, endTime: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <label className={label}>
          Shooter
          <select value={d.shooter} onChange={(e) => setD({ ...d, shooter: e.target.value })} className={`mt-1 w-full ${field}`}>
            <option value="">Not assigned</option>
            {team.map((m) => <option key={m.email} value={m.email}>{m.name}{m.active ? "" : " (inactive)"}</option>)}
          </select>
        </label>
        <label className={label}>
          Status
          <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })} className={`mt-1 w-full ${field}`}>
            <option value="planned">Planned</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className={`${label} sm:col-span-2 lg:col-span-2`}>People needed<textarea rows={2} value={d.people} onChange={(e) => setD({ ...d, people: e.target.value })} placeholder="e.g. Dr Sharma 10–11 am, two staff for the reception scene" className={`mt-1 w-full ${field}`} /></label>
        <label className={`${label} sm:col-span-2 lg:col-span-2`}>Props needed<textarea rows={2} value={d.props} onChange={(e) => setD({ ...d, props: e.target.value })} placeholder="e.g. Branded backdrop, product samples" className={`mt-1 w-full ${field}`} /></label>
        <label className={`${label} sm:col-span-2 lg:col-span-2`}>Notes<textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        <div className="flex items-end sm:col-span-2 lg:col-span-4"><button className={btn}>Save details</button></div>
      </form>

      {consent.length > 0 && (
        <section aria-labelledby="consent-h" className="rounded-2xl border border-gold-500/40 bg-gold-100/40 p-5">
          <h2 id="consent-h" className="mb-2 font-display text-xl">Consent and people reminders</h2>
          <ul className="list-disc space-y-1 pl-5 text-[14px]">{consent.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      )}

      <section aria-labelledby="shots-h" className="rounded-2xl border border-line bg-paper p-5">
        <h2 id="shots-h" className="mb-1 font-display text-xl">Shot list <span className="font-sans text-[14px] font-semibold text-muted">{done} of {shots.length} done</span></h2>
        <p className="mb-3 text-[13px] text-muted">The plan&apos;s shots plus one line for every post this shoot feeds. Ticking all of a post&apos;s shots marks its shoot task done.</p>
        <ShotList shots={shots} fed={fed} />
      </section>

      <section aria-labelledby="fed-h">
        <h2 id="fed-h" className="mb-3 font-display text-xl">Content this shoot feeds</h2>
        {fed.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {fed.map((x) => (
              <li key={x.id} className="flex items-center gap-2 rounded-xl border border-line bg-paper p-3 text-[14px]">
                <PlatformGlyph platform={x.platform} />
                <Link href={`/admin/items/${x.id}`} className="min-w-0 flex-1 underline-offset-4 hover:underline"><span className="font-semibold">{formatLabel(x.format)}</span> · {x.title} <span className="text-muted">· {fmtDay(x.date)}</span></Link>
                <StageBadge stage={x.stage} />
              </li>
            ))}
          </ul>
        ) : <p className="text-[14px] text-muted">No posts are planned from this shoot yet.</p>}
      </section>

      <section aria-labelledby="move-h" className="rounded-2xl border border-line bg-paper p-5">
        <h2 id="move-h" className="mb-3 font-display text-xl">Move this shoot</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className={label}>New date<input type="date" value={moveTo} onChange={(e) => { setMoveTo(e.target.value); setPreview(null); }} className={`mt-1 block ${field}`} /></label>
          <button
            type="button"
            className={btnGhost}
            disabled={!moveTo || moveTo === shoot.date}
            onClick={async () => {
              const res = await previewShootMoveAction(shoot.id, moveTo);
              if (res.ok) setPreview(res.data);
              else setMsg({ tone: "error", text: res.error });
            }}
          >
            Check what changes
          </button>
        </div>
        {preview && (
          <div className="mt-4 space-y-3">
            {preview.length ? (
              <ul className="space-y-1 text-[14px]">
                {preview.map((c, i) => <li key={i}><span className="font-semibold">{c.itemTitle}</span>: {c.label} {fmtDay(c.from)} → {fmtDay(c.to)}{c.late && <span className="ml-1 font-semibold text-red-900">(already late)</span>}</li>)}
              </ul>
            ) : <p className="text-[14px] text-muted">No open tasks change.</p>}
            <button
              type="button"
              className={btn}
              onClick={async () => {
                if (!window.confirm(`Move the shoot to ${fmtDay(moveTo)}${preview.length ? ` and reschedule ${preview.length} task(s)` : ""}?`)) return;
                const res = await moveShootAction(shoot.id, moveTo);
                if (!res.ok) return setMsg({ tone: "error", text: res.error });
                setMsg({ tone: "ok", text: `Shoot moved to ${fmtDay(moveTo)}. ${res.data.changed} task(s) rescheduled.` });
                setPreview(null);
                router.refresh();
              }}
            >
              Confirm move
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
