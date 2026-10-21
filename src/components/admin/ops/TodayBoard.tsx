"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTaskAction } from "@/app/admin/(panel)/today/actions";
import type { TeamMember } from "@/lib/admin/ops-data";
import { groupToday } from "@/lib/ops/today";
import type { ClientLite, ItemRow, ShootRow, TaskRow } from "@/lib/ops/types";
import { Notice } from "../AdminShell";
import { btnSmall, ClientDot, Empty, field, fmtDay, formatLabel, PlatformGlyph, Section, StageBadge, TaskBadge } from "./ui";

/** One task with its quick actions: Start, Done, Blocked (with reason), Add note, open the item. */
export function TaskCard({ task, item, client, team, today }: { task: TaskRow; item?: Pick<ItemRow, "title" | "platform" | "format" | "date">; client?: ClientLite; team: TeamMember[]; today: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"" | "blocked" | "note">("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const overdue = task.status !== "done" && task.due < today;

  async function run(patch: { status?: string; blockedReason?: string; note?: string }) {
    setBusy(true);
    setError("");
    const res = await updateTaskAction(task.id, patch);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setMode("");
    setText("");
    router.refresh();
  }

  return (
    <li className={`rounded-xl border bg-paper p-3 ${overdue ? "border-red-800/40" : "border-line"}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="flex min-w-0 flex-1 items-start gap-2">
          <span className="mt-1"><ClientDot colour={client?.colour ?? "#000"} /></span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">{task.label}{item && <span className="font-normal"> — {item.title}</span>}</span>
            <span className={`block text-[12px] ${overdue ? "font-semibold text-red-900" : "text-muted"}`}>
              {client?.name} · due {fmtDay(task.due)} {task.time}
              {item && <> · <PlatformGlyph platform={item.platform} size={12} /> {formatLabel(item.format)} publishes {fmtDay(item.date)}</>}
              {task.assignee && ` · ${team.find((m) => m.email === task.assignee)?.name ?? task.assignee}`}
              {task.late && " · flagged late"}
            </span>
          </span>
        </span>
        <TaskBadge status={task.status} />
      </div>
      {task.status === "blocked" && task.blockedReason && <p className="mt-2 text-[13px] text-red-900">Blocked: {task.blockedReason}</p>}
      {task.note && <p className="mt-1 text-[13px] text-ink-soft">Note: {task.note}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {task.status !== "in_progress" && task.status !== "done" && <button type="button" disabled={busy} className={btnSmall} onClick={() => run({ status: "in_progress" })}>Start</button>}
        {task.status !== "done" && <button type="button" disabled={busy} className={`${btnSmall} bg-ink text-paper`} onClick={() => run({ status: "done" })}>Done</button>}
        {task.status !== "blocked" && task.status !== "done" && <button type="button" disabled={busy} className={btnSmall} onClick={() => setMode(mode === "blocked" ? "" : "blocked")}>Blocked</button>}
        <button type="button" disabled={busy} className={btnSmall} onClick={() => { setMode(mode === "note" ? "" : "note"); setText(task.note); }}>Add note</button>
        <Link href={`/admin/items/${task.itemId}`} className={btnSmall}>Open</Link>
      </div>
      {mode && (
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(mode === "blocked" ? { status: "blocked", blockedReason: text } : { note: text });
          }}
        >
          <input autoFocus required={mode === "blocked"} aria-label={mode === "blocked" ? "Why is it blocked?" : "Note"} placeholder={mode === "blocked" ? "Why is it blocked?" : "Note"} value={text} onChange={(e) => setText(e.target.value)} className={`min-w-0 flex-1 ${field}`} />
          <button disabled={busy} className={btnSmall}>Save</button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-red-900">{error}</p>}
    </li>
  );
}

/** Today: Overdue · Due today · Next 3 days · Publishing today · Shoots today, for me or everyone. */
export function TodayBoard({ tasks, items, shoots, clients, team, me, today, initialMine }: { tasks: TaskRow[]; items: ItemRow[]; shoots: ShootRow[]; clients: ClientLite[]; team: TeamMember[]; me: string; today: string; initialMine: boolean }) {
  const [mine, setMine] = useState(initialMine);
  const g = useMemo(() => groupToday(tasks, items, shoots, { today, me, mine }), [tasks, items, shoots, today, me, mine]);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const itemById = new Map(items.map((x) => [x.id, x]));
  const list = (ts: TaskRow[], empty: string) =>
    ts.length ? <ul className="space-y-2">{ts.map((t) => <TaskCard key={t.id} task={t} item={itemById.get(t.itemId)} client={clientById.get(t.clientId)} team={team} today={today} />)}</ul> : <Empty>{empty}</Empty>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Whose tasks" className="flex rounded-full border border-line p-0.5">
          {[{ v: true, l: "My tasks" }, { v: false, l: "Everyone" }].map((o) => (
            <button key={o.l} type="button" role="radio" aria-checked={mine === o.v} onClick={() => setMine(o.v)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${mine === o.v ? "bg-ink text-paper" : ""}`}>{o.l}</button>
          ))}
        </div>
        <p className="text-[14px] text-muted">{fmtDay(today)} · {g.overdue.length} overdue · {g.dueToday.length} due today</p>
      </div>

      {g.perClient.length > 0 && (
        <ul aria-label="Counts per client" className="mb-8 flex flex-wrap gap-2">
          {g.perClient.map((c) => {
            const cl = clientById.get(c.clientId);
            return (
              <li key={c.clientId}>
                <Link href={`/admin/clients/${c.clientId}`} className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] hover:border-ink">
                  <ClientDot colour={cl?.colour ?? "#000"} /> <span className="font-semibold">{cl?.name}</span>
                  {c.overdue > 0 && <span className="font-semibold text-red-900">{c.overdue} overdue</span>}
                  {c.today > 0 && <span className="text-muted">{c.today} today</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {g.overdue.length > 0 && <div className="mb-4"><Notice tone="error">{g.overdue.length} task{g.overdue.length > 1 ? "s are" : " is"} overdue.</Notice></div>}
      <div className="grid gap-x-8 xl:grid-cols-2">
        <div>
          <Section title="Overdue" count={g.overdue.length} id="overdue">{list(g.overdue, "Nothing overdue.")}</Section>
          <Section title="Due today" count={g.dueToday.length} id="due-today">{list(g.dueToday, "Nothing due today.")}</Section>
          <Section title="Next 3 days" count={g.next3.length} id="next3">{list(g.next3, "Nothing due in the next 3 days.")}</Section>
        </div>
        <div>
          <Section title="Publishing today" count={g.publishing.length} id="publishing">
            {g.publishing.length ? (
              <ul className="space-y-2">
                {g.publishing.map((x) => (
                  <li key={x.id} className="flex items-start gap-2 rounded-xl border border-gold-500/50 bg-gold-100/30 p-3 text-[14px]">
                    <span className="mt-1"><ClientDot colour={clientById.get(x.clientId)?.colour ?? "#000"} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{x.time} · <PlatformGlyph platform={x.platform} size={12} /> {formatLabel(x.format)} — {x.title}</span>
                      <span className="block text-[12px] text-muted">{clientById.get(x.clientId)?.name}</span>
                    </span>
                    <StageBadge stage={x.stage} />
                  </li>
                ))}
              </ul>
            ) : <Empty>Nothing publishing today.</Empty>}
          </Section>
          <Section title="Shoots today" count={g.shoots.length} id="shoots">
            {g.shoots.length ? (
              <ul className="space-y-2">
                {g.shoots.map((s) => (
                  <li key={s.id} className="rounded-xl border border-dashed border-ink/40 bg-paper p-3 text-[14px]">
                    <p className="flex items-center gap-2 font-semibold"><ClientDot colour={clientById.get(s.clientId)?.colour ?? "#000"} /> <Link href={`/admin/shoots/${s.id}`} className="underline-offset-4 hover:underline">{clientById.get(s.clientId)?.name} · {s.label}{s.startTime && ` · ${s.startTime}`}</Link></p>
                    <p className="text-[12px] text-muted">{s.location || "Location to confirm"}{s.shooter && ` · ${team.find((m) => m.email === s.shooter)?.name ?? s.shooter}`}</p>
                    {s.shots.length > 0 && <ul className="mt-1 list-disc pl-5 text-[13px] text-ink-soft">{s.shots.map((t) => <li key={t}>{t}</li>)}</ul>}
                  </li>
                ))}
              </ul>
            ) : <Empty>No shoots today.</Empty>}
          </Section>
        </div>
      </div>
    </div>
  );
}
