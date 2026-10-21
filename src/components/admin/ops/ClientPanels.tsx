"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setOnboardingAction, updateClientAction, updateShootAction } from "@/app/admin/(panel)/clients/actions";
import type { Client, OnboardingRow, TeamMember } from "@/lib/admin/ops-data";
import { packages } from "@/lib/engine/packages";
import { CLIENT_COLOURS, CLIENT_STATUSES, type ShootRow } from "@/lib/ops/types";
import { fmtWhen } from "../AdminShell";
import { btn, btnSmall, Empty, field, fmtDay } from "./ui";

const label = "block text-[12px] font-semibold";

/** Client overview: details, package, renewal, status, notes — editable. */
export function ClientDetails({ client }: { client: Client }) {
  const router = useRouter();
  const [c, setC] = useState(client);
  const [msg, setMsg] = useState("");
  const set = (k: keyof Client, v: string) => setC((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(c) !== JSON.stringify(client);
  return (
    <form
      className="grid gap-3 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await updateClientAction(client.id, { name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, city: c.city, package: c.package, renewalDate: c.renewalDate, status: c.status, notes: c.notes, colour: c.colour });
        setMsg(res.ok ? "Saved." : res.error);
        if (res.ok) router.refresh();
      }}
    >
      <label className={label}>Name<input value={c.name} onChange={(e) => set("name", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>Contact person<input value={c.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>Phone / WhatsApp<input value={c.phone} onChange={(e) => set("phone", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>Email<input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>City<input value={c.city} onChange={(e) => set("city", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <label className={label}>
        Status
        <select value={c.status} onChange={(e) => set("status", e.target.value)} className={`mt-1 w-full ${field}`}>
          {CLIENT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <label className={label}>
        Package
        <select value={c.package} onChange={(e) => set("package", e.target.value)} className={`mt-1 w-full ${field}`}>
          {Object.entries(packages).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
        </select>
      </label>
      <label className={label}>Started<input disabled value={fmtDay(c.startDate)} className={`mt-1 w-full ${field} text-muted`} /></label>
      <label className={label}>Renewal date<input type="date" value={c.renewalDate ?? ""} onChange={(e) => set("renewalDate", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <div className="sm:col-span-2 lg:col-span-3">
        <p className={label}>Calendar colour</p>
        <div role="radiogroup" aria-label="Calendar colour" className="mt-2 flex flex-wrap gap-2">
          {CLIENT_COLOURS.map((hex) => (
            <button key={hex} type="button" role="radio" aria-checked={c.colour === hex} aria-label={hex} onClick={() => set("colour", hex)} className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-paper ${c.colour === hex ? "ring-2 ring-ink" : ""}`} style={{ background: hex }} />
          ))}
        </div>
      </div>
      <label className={`${label} sm:col-span-2 lg:col-span-3`}>Notes<textarea rows={3} value={c.notes} onChange={(e) => set("notes", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button disabled={!dirty} className={btn}>Save details</button>
        <p aria-live="polite" className="text-[13px] text-muted">{msg}</p>
      </div>
    </form>
  );
}

const KIND_LABEL: Record<string, string> = { access: "Platform access", consent: "Consent forms", assets: "Brand assets", optimization: "Profile optimization" };

export function OnboardingChecklist({ items }: { items: OnboardingRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  if (!items.length) return <Empty>No onboarding items.</Empty>;
  const kinds = [...new Set(items.map((i) => i.kind))];
  const done = items.filter((i) => i.done).length;
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="mb-3 text-[14px] text-muted">{done} of {items.length} done</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {kinds.map((k) => (
          <fieldset key={k}>
            <legend className="mb-2 text-[13px] font-semibold">{KIND_LABEL[k] ?? k}</legend>
            <ul className="space-y-1.5">
              {items.filter((i) => i.kind === k).map((i) => (
                <li key={i.id}>
                  <label className="flex items-start gap-2 text-[14px]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--color-ink)]"
                      checked={i.done}
                      disabled={busy === i.id}
                      onChange={async (e) => {
                        setBusy(i.id);
                        await setOnboardingAction(i.id, e.target.checked);
                        setBusy("");
                        router.refresh();
                      }}
                    />
                    <span>
                      <span className={i.done ? "text-muted line-through" : ""}>{i.label}</span>
                      {i.done && i.doneBy && <span className="block text-[12px] text-muted">{i.doneBy} · {fmtWhen(i.doneAt)}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

export function ShootList({ shoots, clientId, team }: { shoots: ShootRow[]; clientId: string; team: TeamMember[] }) {
  const router = useRouter();
  if (!shoots.length) return <Empty>No shoot days yet — they are created when a plan is approved.</Empty>;
  const save = async (id: string, patch: { status?: string; location?: string; shooter?: string | null }) => {
    await updateShootAction(id, clientId, patch);
    router.refresh();
  };
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {shoots.map((s) => (
        <li key={s.id} className={`rounded-2xl border border-dashed bg-paper p-4 text-[14px] ${s.status === "cancelled" ? "border-line text-muted" : "border-ink/40"}`}>
          <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">{fmtDay(s.date)} · {s.label}<Link href={`/admin/shoots/${s.id}`} className={btnSmall}>Open shoot page</Link></p>
          {s.shots.length > 0 && <ul className="mt-2 list-disc pl-5 text-[13px] text-ink-soft">{s.shots.map((t) => <li key={t}>{t}</li>)}</ul>}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className={label}>
              Status
              <select defaultValue={s.status} onChange={(e) => save(s.id, { status: e.target.value })} className={`mt-1 w-full ${field}`}>
                <option value="planned">Planned</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className={label}>
              Shooter
              <select defaultValue={s.shooter ?? ""} onChange={(e) => save(s.id, { shooter: e.target.value || null })} className={`mt-1 w-full ${field}`}>
                <option value="">Not assigned</option>
                {team.filter((m) => m.active).map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
              </select>
            </label>
            <form
              className={label}
              onSubmit={(e) => {
                e.preventDefault();
                void save(s.id, { location: String(new FormData(e.currentTarget).get("location") ?? "") });
              }}
            >
              <label htmlFor={`loc-${s.id}`}>Location</label>
              <span className="mt-1 flex gap-1">
                <input id={`loc-${s.id}`} name="location" defaultValue={s.location} className={`min-w-0 flex-1 ${field}`} />
                <button className={btnSmall}>Save</button>
              </span>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
