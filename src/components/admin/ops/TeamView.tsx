"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addLeaveAction, reassignAction, removeLeaveAction } from "@/app/admin/(panel)/team/actions";
import type { TeamMember } from "@/lib/admin/ops-data";
import type { DayLoad, Leave } from "@/lib/ops/team";
import { Notice } from "../AdminShell";
import { btn, btnGhost, btnSmall, field, fmtDay, Section } from "./ui";

export interface WorkloadRow {
  email: string;
  name: string;
  active: boolean;
  days: DayLoad[];
  tasks: number;
  hours: number;
}

const label = "block text-[12px] font-semibold";

/** Workload per person per day (tasks and estimated hours), leave dates and bulk reassignment. */
export function TeamView({ week, prev, next, today, rows, team, leave }: { week: string[]; prev: string; next: string; today: string; rows: WorkloadRow[]; team: TeamMember[]; leave: Leave[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [lv, setLv] = useState({ email: team[0]?.email ?? "", start: today, end: today, note: "", to: "" });
  const [ra, setRa] = useState({ from: team[0]?.email ?? "", to: "", start: "", end: "" });
  const name = (e: string) => team.find((m) => m.email === e)?.name ?? e;
  const done = (res: { ok: boolean; error?: string }, text: string) => {
    setMsg(res.ok ? { tone: "ok", text } : { tone: "error", text: res.error ?? "Could not save." });
    if (res.ok) router.refresh();
  };
  const people = team.filter((m) => m.active);

  return (
    <div>
      {msg && <div className="mb-6"><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      <Section title="Workload" id="load">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link href={`/admin/team?week=${prev}`} className={btnGhost} aria-label="Previous week">←</Link>
          <Link href="/admin/team" className={btnGhost}>This week</Link>
          <Link href={`/admin/team?week=${next}`} className={btnGhost} aria-label="Next week">→</Link>
          <p className="ml-2 text-[14px] text-muted">Week of {fmtDay(week[0])} · open tasks and estimated hours per day</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="w-full min-w-[760px] text-[13px]">
            <caption className="sr-only">Open tasks and estimated hours per person per day</caption>
            <thead className="bg-cream/60 text-left">
              <tr>
                <th scope="col" className="px-3 py-2">Person</th>
                {week.map((d) => <th key={d} scope="col" className={`px-2 py-2 ${d === today ? "text-gold-700" : ""}`}>{fmtDay(d)}</th>)}
                <th scope="col" className="px-3 py-2 text-right">Week</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} className="border-t border-line">
                  <th scope="row" className="px-3 py-2 text-left font-semibold">{r.name}{!r.active && <span className="ml-1 font-normal text-muted">(inactive)</span>}</th>
                  {r.days.map((d) => (
                    <td key={d.date} className="px-1.5 py-1.5">
                      <span
                        title={d.leave ? "On leave" : d.off ? "Day off" : `Capacity ${d.capacity} h`}
                        className={`block rounded-lg px-2 py-1.5 ${d.over ? "bg-red-50 font-semibold text-red-900 ring-1 ring-red-800/40" : d.off ? "bg-cream/60 text-muted" : d.tasks ? "bg-gold-100/50" : "text-muted"}`}
                      >
                        {d.leave ? "Leave" : d.off && !d.tasks ? "Off" : d.tasks ? `${d.tasks} · ${d.hours} h` : "—"}
                        {d.over && <span className="block text-[11px] font-normal">{d.leave ? `${d.tasks} task${d.tasks > 1 ? "s" : ""} to reassign` : d.off ? "work on a day off" : `over ${d.capacity} h`}</span>}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums">{r.tasks} · {r.hours} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-x-8 lg:grid-cols-2">
        <Section title="Leave" id="leave">
          <form
            className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await addLeaveAction(lv.email, lv.start, lv.end, lv.note);
              if (!res.ok || !lv.to) return done(res, `Leave added for ${name(lv.email)}.`);
              const moved = await reassignAction(lv.email, lv.to, lv.start, lv.end);
              done(moved, moved.ok ? `Leave added. ${moved.data.tasks} task(s) and ${moved.data.shoots} shoot(s) moved to ${name(lv.to)}.` : "");
            }}
          >
            <label className={label}>
              Person
              <select value={lv.email} onChange={(e) => setLv({ ...lv, email: e.target.value })} className={`mt-1 w-full ${field}`}>
                {team.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
              </select>
            </label>
            <label className={label}>Note<input value={lv.note} onChange={(e) => setLv({ ...lv, note: e.target.value })} placeholder="e.g. Family wedding" className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>From<input type="date" required value={lv.start} onChange={(e) => setLv({ ...lv, start: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>To<input type="date" required value={lv.end} onChange={(e) => setLv({ ...lv, end: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={`${label} sm:col-span-2`}>
              Hand their open tasks in these dates to
              <select value={lv.to} onChange={(e) => setLv({ ...lv, to: e.target.value })} className={`mt-1 w-full ${field}`}>
                <option value="">Don&apos;t reassign now</option>
                {people.filter((m) => m.email !== lv.email).map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
              </select>
            </label>
            <button className={`${btn} sm:col-span-2 sm:justify-self-start`}>Add leave</button>
          </form>
          <ul className="mt-3 space-y-2">
            {leave.length ? leave.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-[14px]">
                <span className="font-semibold">{name(l.email)}</span>
                <span className="text-muted">{fmtDay(l.start)}{l.end !== l.start && ` – ${fmtDay(l.end)}`}{l.note && ` · ${l.note}`}</span>
                <button type="button" className={`${btnSmall} ml-auto`} onClick={async () => window.confirm("Remove this leave?") && done(await removeLeaveAction(l.id!, l.email), "Leave removed.")}>Remove</button>
              </li>
            )) : <li className="text-[14px] text-muted">No upcoming leave.</li>}
          </ul>
        </Section>

        <Section title="Bulk reassign" id="reassign">
          <form
            className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!window.confirm(`Move ${ra.start && ra.end ? "open tasks due in those dates" : "all open tasks"} from ${name(ra.from)} to ${name(ra.to)}?`)) return;
              const res = await reassignAction(ra.from, ra.to, ra.start || undefined, ra.end || undefined);
              done(res, res.ok ? `${res.data.tasks} task(s) and ${res.data.shoots} planned shoot(s) moved to ${name(ra.to)}.` : "");
            }}
          >
            <label className={label}>
              From
              <select value={ra.from} onChange={(e) => setRa({ ...ra, from: e.target.value })} className={`mt-1 w-full ${field}`}>
                {team.map((m) => <option key={m.email} value={m.email}>{m.name}{m.active ? "" : " (inactive)"}</option>)}
              </select>
            </label>
            <label className={label}>
              To
              <select required value={ra.to} onChange={(e) => setRa({ ...ra, to: e.target.value })} className={`mt-1 w-full ${field}`}>
                <option value="">Choose…</option>
                {people.filter((m) => m.email !== ra.from).map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
              </select>
            </label>
            <label className={label}>Only tasks due from (optional)<input type="date" value={ra.start} onChange={(e) => setRa({ ...ra, start: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <label className={label}>to (optional)<input type="date" value={ra.end} onChange={(e) => setRa({ ...ra, end: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
            <p className="text-[13px] text-muted sm:col-span-2">Only open tasks move; finished work keeps its name. Planned shoots in the same dates move too.</p>
            <button className={`${btn} sm:col-span-2 sm:justify-self-start`}>Reassign</button>
          </form>
        </Section>
      </div>
    </div>
  );
}
