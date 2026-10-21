"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setOnboardingAction, updateClientAction, updateShootAction } from "@/app/admin/(panel)/clients/actions";
import type { Client, OnboardingRow, TeamMember } from "@/lib/admin/ops-data";
import { packages } from "@/lib/engine/packages";
import { CLIENT_COLOURS, CLIENT_STATUSES, type ShootRow } from "@/lib/ops/types";
import { useToast } from "../shell/Toasts";
import { fmtWhen } from "../AdminShell";
import { Badge, btn, btnGhost, btnSmall, btnText, card, Empty, field, fmtDay, label } from "./ui";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const digits = (s: string) => s.replace(/\D/g, "");
const wa = (phone: string) => {
  const d = digits(phone);
  return d.length >= 10 ? `https://wa.me/${d.length === 10 ? `91${d}` : d}` : null;
};

/** Client details: read first, Edit to change. Inline validation; a local draft survives leaving the page. */
export function ClientDetails({ client }: { client: Client }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [c, setC] = useState(client);
  const [busy, setBusy] = useState(false);
  const draftKey = `oz_client_${client.id}`;
  const set = (k: keyof Client, v: string) =>
    setC((p) => {
      const next = { ...p, [k]: v };
      try {
        localStorage.setItem(draftKey, JSON.stringify(next));
      } catch {
        /* storage blocked */
      }
      return next;
    });
  const problems: Partial<Record<keyof Client, string>> = {};
  if (!c.name.trim()) problems.name = "A name is needed.";
  if (c.email && !EMAIL.test(c.email)) problems.email = "Enter a full email address, e.g. name@clinic.in";
  if (c.phone && digits(c.phone).length < 10) problems.phone = "Enter at least 10 digits.";
  const invalid = Object.keys(problems).length > 0;
  const dirty = JSON.stringify(c) !== JSON.stringify(client);
  const start = () => {
    try {
      const d = localStorage.getItem(draftKey);
      if (d) setC({ ...client, ...JSON.parse(d) });
    } catch {
      /* ignore */
    }
    setEdit(true);
  };
  const cancel = () => {
    setC(client);
    setEdit(false);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  };

  if (!edit) {
    const w = wa(client.phone);
    const row = (k: string, v: React.ReactNode) => (
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-1.5 text-[14px] md:grid-cols-[130px_minmax(0,1fr)]">
        <dt className="text-muted">{k}</dt>
        <dd className="min-w-0 break-words">{v || <span className="text-muted">—</span>}</dd>
      </div>
    );
    return (
      <section className={card} aria-labelledby="details-h">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
          <h2 id="details-h" className="font-display text-[18px]">Details</h2>
          <button type="button" className={btnSmall} onClick={start}>Edit</button>
        </div>
        <dl className="px-4 py-2">
          {row("Contact", client.contactPerson)}
          {row("Phone", client.phone && <><a href={`tel:${client.phone}`} className="underline-offset-4 hover:underline">{client.phone}</a>{w && <> · <a href={w} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">WhatsApp</a></>}</>)}
          {row("Email", client.email && <a href={`mailto:${client.email}`} className="underline-offset-4 hover:underline">{client.email}</a>)}
          {row("City", client.city)}
          {row("Package", packages[client.package]?.name)}
          {row("Status", CLIENT_STATUSES.find((s) => s.id === client.status)?.label)}
          {row("Client since", fmtDay(client.startDate))}
          {row("Renewal", client.renewalDate ? fmtDay(client.renewalDate) : "")}
          {row("Notes", client.notes && <span className="whitespace-pre-wrap">{client.notes}</span>)}
        </dl>
      </section>
    );
  }

  const input = (k: keyof Client, l: string, type = "text") => (
    <label className={label}>
      {l}
      <input type={type} value={(c[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} aria-invalid={problems[k] ? true : undefined} className={`mt-1 w-full ${field}`} />
      {problems[k] && <span className="mt-1 block text-[12px] font-normal text-bad">{problems[k]}</span>}
    </label>
  );
  return (
    <form
      className={`${card} grid gap-3 p-4 sm:grid-cols-2`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (invalid) return;
        setBusy(true);
        const before = client;
        const res = await updateClientAction(client.id, { name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, city: c.city, package: c.package, renewalDate: c.renewalDate, status: c.status, notes: c.notes, colour: c.colour });
        setBusy(false);
        if (!res.ok) return toast.show({ message: res.error, tone: "error" });
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
        setEdit(false);
        toast.show({
          message: "Details saved",
          undo: async () => {
            const u = await updateClientAction(client.id, { name: before.name, contactPerson: before.contactPerson, phone: before.phone, email: before.email, city: before.city, package: before.package, renewalDate: before.renewalDate, status: before.status, notes: before.notes, colour: before.colour });
            router.refresh();
            return u.ok ? { ok: true } : { ok: false, error: u.error };
          },
        });
        router.refresh();
      }}
    >
      <h2 className="font-display text-[18px] sm:col-span-2">Edit details</h2>
      {input("name", "Name")}
      {input("contactPerson", "Contact person")}
      {input("phone", "Phone / WhatsApp", "tel")}
      {input("email", "Email", "email")}
      {input("city", "City")}
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
      {input("renewalDate", "Renewal date", "date")}
      <fieldset className="sm:col-span-2">
        <legend className={label}>Calendar colour</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLIENT_COLOURS.map((hex) => (
            <button key={hex} type="button" role="radio" aria-checked={c.colour === hex} aria-label={hex} onClick={() => set("colour", hex)} className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-surface ${c.colour === hex ? "ring-2 ring-ink" : ""}`} style={{ background: hex }} />
          ))}
        </div>
      </fieldset>
      <label className={`${label} sm:col-span-2`}>Notes<textarea rows={3} value={c.notes} onChange={(e) => set("notes", e.target.value)} className={`mt-1 w-full ${field}`} /></label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button disabled={!dirty || invalid || busy} className={btn}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className={btnText} onClick={cancel}>Cancel</button>
        {dirty && <span className="text-[12px] text-muted">Draft kept if you leave this page</span>}
      </div>
    </form>
  );
}

const KIND_LABEL: Record<string, string> = { access: "Platform access", consent: "Consent forms", assets: "Brand assets", optimization: "Profile optimization" };

/** Onboarding: progress, what's left first; ticking is instant with Undo. */
export function OnboardingChecklist({ items }: { items: OnboardingRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, i.done])));
  const [showDone, setShowDone] = useState(false);
  if (!items.length) return <Empty>No onboarding items.</Empty>;
  const n = items.filter((i) => done[i.id]).length;
  const toggle = async (i: OnboardingRow, v: boolean) => {
    setDone((d) => ({ ...d, [i.id]: v }));
    const res = await setOnboardingAction(i.id, v);
    if (!res.ok) {
      setDone((d) => ({ ...d, [i.id]: !v }));
      return toast.show({ message: res.error, tone: "error" });
    }
    toast.show({
      message: v ? `Ticked: ${i.label}` : `Unticked: ${i.label}`,
      undo: async () => {
        setDone((d) => ({ ...d, [i.id]: !v }));
        const u = await setOnboardingAction(i.id, !v);
        router.refresh();
        return u.ok ? { ok: true } : { ok: false, error: u.error };
      },
    });
    router.refresh();
  };
  const shown = items.filter((i) => showDone || !done[i.id]);
  return (
    <section className={`${card} p-4`} aria-labelledby="onb-h">
      <div className="flex items-center gap-2">
        <h2 id="onb-h" className="flex-1 font-display text-[18px]">Onboarding</h2>
        <span className="text-[13px] text-muted tabular-nums">{n} of {items.length}</span>
      </div>
      <div className="my-3 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={n} aria-label="Onboarding progress">
        <div className="h-full rounded-full bg-ok" style={{ width: `${(n / items.length) * 100}%` }} />
      </div>
      {shown.length === 0 && <p className="text-[14px] text-ok">Everything is in place.</p>}
      <ul className="space-y-0.5">
        {shown.map((i) => (
          <li key={i.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px]">
              <input type="checkbox" checked={!!done[i.id]} onChange={(e) => toggle(i, e.target.checked)} />
              <span className="min-w-0 flex-1">
                <span className={done[i.id] ? "text-muted line-through" : ""}>{i.label}</span>
                <span className="block text-[12px] text-muted">{KIND_LABEL[i.kind] ?? i.kind}{done[i.id] && i.doneBy ? ` · ${i.doneBy} · ${fmtWhen(i.doneAt)}` : ""}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {n > 0 && <button type="button" className={`${btnText} mt-1`} onClick={() => setShowDone(!showDone)}>{showDone ? "Hide done" : `Show ${n} done`}</button>}
    </section>
  );
}

export function ShootList({ shoots, clientId, team }: { shoots: ShootRow[]; clientId: string; team: TeamMember[] }) {
  const router = useRouter();
  const toast = useToast();
  if (!shoots.length) return <Empty title="No shoot days yet">They are created when a plan is approved.</Empty>;
  const save = async (id: string, patch: { status?: string; shooter?: string | null }) => {
    const res = await updateShootAction(id, clientId, patch);
    toast.show(res.ok ? "Shoot updated" : { message: res.error, tone: "error" });
    router.refresh();
  };
  return (
    <ul className={`${card} divide-y divide-edge`}>
      {shoots.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Link href={`/admin/shoots/${s.id}`} className="min-w-0 flex-1 basis-56 hover:underline">
            <span className="block font-semibold">{fmtDay(s.date)}{s.startTime && ` · ${s.startTime}${s.endTime ? `–${s.endTime}` : ""}`} · {s.label}</span>
            <span className="text-[13px] text-muted">{s.location || "Location to confirm"} · {s.shots.length} planned shots</span>
          </Link>
          <Badge tone={s.status === "done" ? "ok" : s.status === "cancelled" ? "neutral" : "info"}>{s.status === "done" ? "Done" : s.status === "cancelled" ? "Cancelled" : "Planned"}</Badge>
          <select aria-label={`Shooter for ${fmtDay(s.date)}`} defaultValue={s.shooter ?? ""} onChange={(e) => save(s.id, { shooter: e.target.value || null })} className={`w-full sm:w-44 ${field}`}>
            <option value="">No shooter</option>
            {team.filter((m) => m.active).map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
          </select>
          <Link href={`/admin/shoots/${s.id}`} className={btnGhost}>Open</Link>
        </li>
      ))}
    </ul>
  );
}
