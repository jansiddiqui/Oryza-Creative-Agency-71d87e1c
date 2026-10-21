"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOfflineApprovalAction, saveRulesAction, saveTeamMemberAction, saveWorkingDaysAction, saveWorkloadSettingsAction } from "@/app/admin/(panel)/settings/actions";
import type { TeamMember } from "@/lib/admin/ops-data";
import { TEAM_ROLES, type DeadlineRule, type TeamRole } from "@/lib/ops/types";
import { Notice } from "../AdminShell";
import { useToast } from "../shell/Toasts";
import { btn, btnSmall, card, field, formatLabel } from "./ui";

const DAYS = [
  { n: 1, l: "Mon" },
  { n: 2, l: "Tue" },
  { n: 3, l: "Wed" },
  { n: 4, l: "Thu" },
  { n: 5, l: "Fri" },
  { n: 6, l: "Sat" },
  { n: 0, l: "Sun" },
];
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const offsetLabel = (n: number) => (n === 0 ? "D" : n < 0 ? `D${n}` : `D+${n}`);

function DayPicker({ value, onChange, name }: { value: number[]; onChange: (v: number[]) => void; name: string }) {
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-1.5">
      {DAYS.map((d) => (
        <button key={d.n} type="button" aria-pressed={value.includes(d.n)} onClick={() => onChange(toggle(value, d.n))} className={`min-h-11 min-w-11 rounded-full border px-3 text-[13px] font-semibold md:min-h-9 md:min-w-0 ${value.includes(d.n) ? "border-ink bg-ink text-paper" : "border-edge-strong bg-surface"}`}>{d.l}</button>
      ))}
    </div>
  );
}

export const SETTINGS_TABS = [
  { id: "workload", label: "Workload & working days" },
  { id: "deadlines", label: "Deadlines" },
  { id: "team", label: "Team" },
  { id: "approvals", label: "Approvals" },
] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

/** Owner settings in tabs: workload and working days, deadline rules (D-n offsets), team roles, approvals. */
export function SettingsView({ rules: initialRules, workingDays: initialDays, team: initialTeam, estimates: initialEst, capacity: initialCap, allowOffline: initialOffline, tab: initialTab = "workload" }: { rules: DeadlineRule[]; workingDays: number[]; team: TeamMember[]; estimates: Record<string, number>; capacity: number; allowOffline: boolean; tab?: SettingsTab }) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [offline, setOffline] = useState(initialOffline);
  const toast = useToast();
  const [est, setEst] = useState(initialEst);
  const [cap, setCap] = useState(String(initialCap));
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [days, setDays] = useState(initialDays);
  const [team, setTeam] = useState(initialTeam);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const done = (res: { ok: boolean; error?: string }, ok: string) => {
    setMsg(res.ok ? { tone: "ok", text: ok } : { tone: "error", text: res.error ?? "Could not save." });
    if (res.ok) router.refresh();
  };
  const formats = [...new Set(rules.map((r) => r.format))];
  const setRule = (r: DeadlineRule, patch: Partial<DeadlineRule>) => setRules((all) => all.map((x) => (x.format === r.format && x.step === r.step ? { ...x, ...patch } : x)));

  const pick = (t: SettingsTab) => {
    setTab(t);
    setMsg(null);
    try {
      window.history.replaceState(null, "", `?tab=${t}`);
    } catch {}
  };
  const setOfflineApproval = async (v: boolean) => {
    setOffline(v);
    const res = await saveOfflineApprovalAction(v);
    if (!res.ok) {
      setOffline(!v);
      return toast.show({ message: res.error ?? "Could not save.", tone: "error" });
    }
    toast.show({
      message: v ? "Offline approval switched on" : "Offline approval switched off",
      undo: async () => {
        const u = await saveOfflineApprovalAction(!v);
        if (u.ok) setOffline(!v);
        return u;
      },
    });
  };

  return (
    <div>
      <div role="tablist" aria-label="Settings" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-edge px-4 md:mx-0 md:px-0">
        {SETTINGS_TABS.map((t) => (
          <button key={t.id} id={`tab-${t.id}`} role="tab" type="button" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => pick(t.id)} className={`min-h-11 shrink-0 border-b-2 px-3 text-[14px] font-semibold ${tab === t.id ? "border-ink text-ink" : "border-transparent text-text-2 hover:text-ink"}`}>{t.label}</button>
        ))}
      </div>
      {msg && <div className="mb-6"><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-8">
      {tab === "workload" && (<>
      <section aria-labelledby="h-wd">
        <h2 id="h-wd" className="mb-3 font-display text-[18px] font-semibold">Working days</h2>
        <div className={`flex flex-wrap items-center gap-4 p-5 ${card}`}>
          <DayPicker name="Working days" value={days} onChange={setDays} />
          <button type="button" className={btn} onClick={async () => done(await saveWorkingDaysAction(days), "Working days saved. New and moved tasks use them.")}>Save</button>
          <p className="w-full text-[13px] text-muted">A task due on a non-working day moves to the working day before. Publishing dates never move.</p>
        </div>
      </section>

      <section aria-labelledby="h-workload">
        <h2 id="h-workload" className="mb-3 font-display text-[18px] font-semibold">Workload</h2>
        <div className={`space-y-4 p-5 ${card}`}>
          <p className="max-w-2xl text-[14px] text-muted">Estimated hours per task step feed the workload view and the over-capacity warnings. A person can have their own hours per day below; otherwise the default applies.</p>
          <label className="block max-w-[220px] text-[12px] font-semibold">
            Default hours per person per day
            <input type="number" min={1} max={16} step={0.5} value={cap} onChange={(e) => setCap(e.target.value)} className={`mt-1 w-full ${field}`} />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Object.keys(est).sort((a, b) => (a === "default" ? 1 : b === "default" ? -1 : a.localeCompare(b))).map((step) => (
              <label key={step} className="text-[12px] font-semibold">
                {step === "default" ? "Any other step" : step.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())} (h)
                <input type="number" min={0} max={24} step={0.25} value={est[step]} onChange={(e) => setEst({ ...est, [step]: Number(e.target.value) })} className={`mt-1 w-full ${field}`} />
              </label>
            ))}
          </div>
          <button type="button" className={btn} onClick={async () => done(await saveWorkloadSettingsAction(est, Number(cap)), "Workload settings saved.")}>Save workload settings</button>
        </div>
      </section>
      </>)}

      {tab === "deadlines" && (
      <section aria-labelledby="h-rules">
        <h2 id="h-rules" className="mb-3 font-display text-[18px] font-semibold">Deadline rules</h2>
        <p className="mb-3 max-w-2xl text-[14px] text-muted">Each step is worked back from the publish date (D). The reel “shoot” step uses the nearest shoot day on or before its offset; without one it becomes “Client sends footage” a day earlier.</p>
        <div className="space-y-4">
          {formats.map((f) => (
            <fieldset key={f} className={`min-w-0 p-4 ${card}`}>
              <legend className="px-1 font-semibold">{f === "default" ? "Other formats" : formatLabel(f)}</legend>
              <div className="space-y-2">
                {rules.filter((r) => r.format === f).sort((a, b) => a.sort - b.sort).map((r) => (
                  <div key={r.step} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1.4fr_90px_100px_1fr]">
                    <label className="col-span-2 text-[12px] font-semibold sm:col-span-1">Step<input value={r.label} onChange={(e) => setRule(r, { label: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
                    <label className="text-[12px] font-semibold">
                      Offset ({offsetLabel(r.offset)})
                      <input type="number" min={-30} max={7} value={r.offset} onChange={(e) => setRule(r, { offset: Number(e.target.value) })} className={`mt-1 w-full ${field}`} />
                    </label>
                    <label className="text-[12px] font-semibold">Due by<input placeholder="6:00 pm" value={r.time} onChange={(e) => setRule(r, { time: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
                    <label className="col-span-2 text-[12px] font-semibold sm:col-span-1">
                      Role
                      <select value={r.role} onChange={(e) => setRule(r, { role: e.target.value as TeamRole })} className={`mt-1 w-full ${field}`}>
                        {TEAM_ROLES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <button type="button" className={`${btn} mt-4`} onClick={async () => done(await saveRulesAction(rules), "Deadline rules saved. They apply to plans approved and items moved from now on.")}>Save deadline rules</button>
      </section>
      )}

      {tab === "team" && (
      <section aria-labelledby="h-team">
        <h2 id="h-team" className="mb-3 font-display text-[18px] font-semibold">Team</h2>
        <p className="mb-3 max-w-2xl text-[14px] text-muted">Everyone on the Users list can be given roles. New tasks go to the first active person with the matching role (or to the item&apos;s assignee).</p>
        <ul className="space-y-3">
          {team.map((m, i) => {
            const set = (patch: Partial<TeamMember>) => setTeam((all) => all.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <li key={m.email} className={`grid min-w-0 gap-3 p-4 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-end ${card}`}>
                <label className="text-[12px] font-semibold">
                  Name <span className="font-normal text-muted">({m.email})</span>
                  <input value={m.name} onChange={(e) => set({ name: e.target.value })} className={`mt-1 w-full ${field}`} />
                </label>
                <div>
                  <p className="mb-1 text-[12px] font-semibold">Roles</p>
                  <div role="group" aria-label={`Roles for ${m.email}`} className="flex flex-wrap gap-1.5">
                    {TEAM_ROLES.map((r) => (
                      <button key={r.id} type="button" aria-pressed={m.roles.includes(r.id)} onClick={() => set({ roles: toggle(m.roles, r.id) })} className={`min-h-11 rounded-full border px-3 text-[12px] font-semibold md:min-h-8 ${m.roles.includes(r.id) ? "border-ink bg-ink text-paper" : "border-edge-strong bg-surface"}`}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[12px] font-semibold">Working days</p>
                  <DayPicker name={`Working days for ${m.email}`} value={m.workingDays} onChange={(v) => set({ workingDays: v })} />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
                  <label className="text-[12px] font-semibold">
                    Hours per day
                    <input type="number" min={1} max={16} step={0.5} placeholder="Default" value={m.capacityHours ?? ""} onChange={(e) => set({ capacityHours: e.target.value === "" ? null : Number(e.target.value) })} className={`ml-2 w-24 ${field}`} />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-[13px] md:min-h-0"><input type="checkbox" className="size-5 md:size-4" checked={!m.digestOptOut} onChange={(e) => set({ digestOptOut: !e.target.checked })} /> Morning digest email</label>
                  <label className="flex min-h-11 items-center gap-2 text-[13px] md:min-h-0"><input type="checkbox" className="size-5 md:size-4" checked={m.active} onChange={(e) => set({ active: e.target.checked })} /> Gets tasks</label>
                  <button type="button" className={btnSmall} onClick={async () => done(await saveTeamMemberAction(m), `${m.name} saved.`)}>Save</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      )}

      {tab === "approvals" && (
      <section aria-labelledby="h-approvals">
        <h2 id="h-approvals" className="mb-3 font-display text-[18px] font-semibold">Approvals</h2>
        <div className={`p-5 ${card}`}>
          <label className="flex items-start gap-3">
            <input type="checkbox" role="switch" aria-checked={offline} checked={offline} onChange={(e) => setOfflineApproval(e.target.checked)} className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="block text-[15px] font-semibold">Allow “Approved by client via WhatsApp or call”</span>
              <span className="mt-1 block max-w-2xl text-[14px] text-text-2">When this is on, a team member can mark a post as approved by the client outside the approval link. They must confirm and write a short note. It is recorded in the activity log and shown on the post as “Approved offline by &lt;name&gt;”. When it is off, only the client&apos;s approval link can approve posts.</span>
            </span>
          </label>
        </div>
      </section>
      )}
      </div>
    </div>
  );
}
