"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moveItemAction } from "@/app/admin/(panel)/calendar/actions";
import { platforms } from "@/data/platforms";
import type { TeamMember } from "@/lib/admin/ops-data";
import { filterItems, isOverdue, monthGrid, shift, weekDays, type CalendarFilters, type CalendarView } from "@/lib/ops/calendar";
import { ITEM_STAGES, type ClientLite, type ItemRow, type ShootRow, type TaskRow } from "@/lib/ops/types";
import { Notice } from "../AdminShell";
import { btnGhost, btnSmall, catLabel, ClientDot, field, fmtDay, formatLabel, PlatformGlyph, StageBadge } from "./ui";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface CalendarProps {
  view: CalendarView;
  anchor: string;
  today: string;
  items: ItemRow[];
  tasks: TaskRow[];
  shoots: ShootRow[];
  clients: ClientLite[];
  team: TeamMember[];
  filters: CalendarFilters;
  /** Page the calendar lives on (the master calendar or a client page). */
  basePath?: string;
  /** On a client page the client filter is fixed. */
  lockedClient?: string;
}

/** Master calendar: month / week / day, filters, overdue in red, publish-today highlighted, drag or Move to reschedule. */
export function CalendarBoard(p: CalendarProps) {
  const router = useRouter();
  const base = p.basePath ?? "/admin/calendar";
  const [selected, setSelected] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const clientById = useMemo(() => new Map(p.clients.map((c) => [c.id, c])), [p.clients]);
  const items = useMemo(() => filterItems(p.items, p.clients, p.filters), [p.items, p.clients, p.filters]);
  const byDate = useMemo(() => {
    const m = new Map<string, ItemRow[]>();
    for (const x of items) m.set(x.date, [...(m.get(x.date) ?? []), x]);
    return m;
  }, [items]);
  const shootsByDate = useMemo(() => {
    const m = new Map<string, ShootRow[]>();
    for (const s of p.shoots.filter((s) => (!p.filters.client || s.clientId === p.filters.client) && s.status !== "cancelled")) m.set(s.date, [...(m.get(s.date) ?? []), s]);
    return m;
  }, [p.shoots, p.filters.client]);
  const sel = selected ? p.items.find((x) => x.id === selected) : undefined;

  const href = (patch: Partial<{ view: string; date: string } & CalendarFilters>) => {
    const q = new URLSearchParams();
    const all = { view: p.view, date: p.anchor, ...p.filters, ...patch };
    for (const [k, v] of Object.entries(all)) if (v && !(p.lockedClient && k === "client")) q.set(k, String(v));
    return `${base}?${q.toString()}`;
  };

  async function move(id: string, date: string) {
    const item = p.items.find((x) => x.id === id);
    if (!item || item.date === date) return;
    let res = await moveItemAction(id, date);
    if (res.ok && res.data.needsConfirm) {
      if (!window.confirm(`The client already approved “${item.title}” for ${fmtDay(item.date)}. Move it to ${fmtDay(date)} anyway? Let the client know.`)) return;
      res = await moveItemAction(id, date, true);
    }
    if (!res.ok) return setMsg({ tone: "error", text: res.error });
    setMsg({ tone: "ok", text: `Moved “${item.title}” to ${fmtDay(date)}. ${res.data.changed} open task${res.data.changed === 1 ? "" : "s"} rescheduled.` });
    setSelected(null);
    router.refresh();
  }

  const Chip = ({ x, compact }: { x: ItemRow; compact?: boolean }) => {
    const c = clientById.get(x.clientId);
    const late = isOverdue(x, p.tasks, p.today);
    return (
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", x.id);
          setDragging(x.id);
        }}
        onDragEnd={() => setDragging(null)}
        onClick={() => {
          setSelected(x.id);
          setMoveTo(x.date);
        }}
        aria-label={`${c?.name ?? ""}: ${x.title}, ${formatLabel(x.format)}${late ? ", overdue" : ""}`}
        className={`block w-full rounded-md border-l-4 px-1.5 py-1 text-left text-[12px] leading-tight ${late ? "bg-red-50 text-red-900 ring-1 ring-red-800/40" : "bg-cream/70 hover:bg-cream"} ${dragging === x.id ? "opacity-50" : ""}`}
        style={{ borderLeftColor: c?.colour }}
      >
        <span className="flex items-center gap-1">
          <PlatformGlyph platform={x.platform} size={12} />
          <span className="whitespace-nowrap font-semibold">{formatLabel(x.format)}</span>
          {!compact && <span className="truncate text-muted">· {c?.name}</span>}
        </span>
        <span className="mt-0.5 block truncate">{x.title}</span>
        {!compact && <span className="mt-1 block"><StageBadge stage={x.stage} /></span>}
      </button>
    );
  };

  const ShootMarker = ({ s }: { s: ShootRow }) => (
    <p className="flex items-center gap-1 rounded-md border border-dashed border-ink/40 px-1.5 py-0.5 text-[11px] font-semibold">
      <ClientDot colour={clientById.get(s.clientId)?.colour ?? "#000"} size={8} /> Shoot · {clientById.get(s.clientId)?.name}
    </p>
  );

  const DayCell = ({ date, inMonth = true, tall }: { date: string; inMonth?: boolean; tall?: boolean }) => {
    const list = byDate.get(date) ?? [];
    const isToday = date === p.today;
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          setDragging(null);
          if (id) void move(id, date);
        }}
        className={`min-h-28 space-y-1 border-b border-r border-line p-1.5 ${inMonth ? "bg-paper" : "bg-cream/40"} ${isToday ? "ring-2 ring-inset ring-gold-500" : ""} ${tall ? "min-h-64" : ""}`}
      >
        <Link href={href({ view: "day", date })} className={`block text-[12px] font-semibold ${isToday ? "text-gold-700" : inMonth ? "" : "text-muted"}`}>
          {Number(date.slice(8))}{isToday && " · Today"}
        </Link>
        {shootsByDate.get(date)?.map((s) => <ShootMarker key={s.id} s={s} />)}
        {list.slice(0, tall ? 50 : 4).map((x) => <Chip key={x.id} x={x} compact={!tall} />)}
        {!tall && list.length > 4 && <Link href={href({ view: "day", date })} className="block text-[11px] font-semibold text-muted">+{list.length - 4} more</Link>}
      </div>
    );
  };

  const title = p.view === "month" ? `${MONTHS[Number(p.anchor.slice(5, 7)) - 1]} ${p.anchor.slice(0, 4)}` : p.view === "week" ? `Week of ${fmtDay(weekDays(p.anchor)[0])}` : fmtDay(p.anchor);
  const days = p.view === "month" ? monthGrid(p.anchor).flat() : p.view === "week" ? weekDays(p.anchor) : [p.anchor];
  const assignees = p.team.filter((m) => m.active);
  const activeFilters = Object.entries(p.filters).filter(([k, v]) => v && !(p.lockedClient && k === "client")).length;
  const filterSelect = (key: keyof CalendarFilters, labelText: string, options: { id: string; label: string }[]) => (
    <label className="text-[12px] font-semibold">
      {labelText}
      <select value={p.filters[key] ?? ""} onChange={(e) => router.push(href({ [key]: e.target.value }))} className={`mt-1 block w-full ${field}`}>
        <option value="">All</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={href({ date: shift(p.view, p.anchor, -1) })} className={btnGhost} aria-label="Previous">←</Link>
        <Link href={href({ date: p.today })} className={btnGhost}>Today</Link>
        <Link href={href({ date: shift(p.view, p.anchor, 1) })} className={btnGhost} aria-label="Next">→</Link>
        <h2 className="mx-2 font-display text-2xl">{title}</h2>
        <nav aria-label="Calendar view" className="ml-auto flex rounded-full border border-line p-0.5">
          {(["month", "week", "day"] as const).map((v) => (
            <Link key={v} href={href({ view: v })} aria-current={p.view === v ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold capitalize ${p.view === v ? "bg-ink text-paper" : ""}`}>{v}</Link>
          ))}
        </nav>
      </div>

      <details className="mb-4 rounded-2xl border border-line bg-paper p-4 md:open:block" open>
        <summary className="cursor-pointer text-[14px] font-semibold">Filters{activeFilters ? ` (${activeFilters} on)` : ""}</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {!p.lockedClient && filterSelect("client", "Client", p.clients.map((c) => ({ id: c.id, label: c.name })))}
          {filterSelect("platform", "Platform", platforms.map((x) => ({ id: x.id, label: x.name })))}
          {filterSelect("format", "Format", [...new Set(p.items.map((x) => x.format))].sort().map((f) => ({ id: f, label: formatLabel(f) })))}
          {filterSelect("stage", "Stage", ITEM_STAGES)}
          {filterSelect("assignee", "Assignee", assignees.map((m) => ({ id: m.email, label: m.name })))}
          {!p.lockedClient && filterSelect("category", "Category", [...new Set(p.clients.map((c) => c.category))].map((c) => ({ id: c, label: catLabel(c) })))}
        </div>
      </details>

      {msg && <div className="mb-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
        <span><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-red-50 ring-1 ring-red-800/40 align-middle" />Overdue</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded-sm ring-2 ring-gold-500 align-middle" />Today</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded-sm border border-dashed border-ink/40 align-middle" />Shoot day</span>
        <span className="hidden md:inline">Drag an item to another day to reschedule.</span>
      </p>

      {p.view !== "day" && (
        <div className="hidden overflow-hidden rounded-2xl border-l border-t border-line md:block">
          <div className="grid grid-cols-7 border-b border-line bg-cream/60 text-[12px] font-semibold">
            {WEEK.map((d) => <div key={d} className="border-r border-line px-2 py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => <DayCell key={d} date={d} inMonth={p.view !== "month" || d.slice(0, 7) === p.anchor.slice(0, 7)} tall={p.view === "week"} />)}
          </div>
        </div>
      )}

      {/* Phones (and the day view): an agenda list. */}
      <ol className={`space-y-4 ${p.view === "day" ? "" : "md:hidden"}`}>
        {days
          .filter((d) => p.view === "day" || ((byDate.get(d)?.length || shootsByDate.get(d)?.length) && (p.view !== "month" || d.slice(0, 7) === p.anchor.slice(0, 7))))
          .map((d) => (
            <li key={d} className={`rounded-2xl border bg-paper p-3 ${d === p.today ? "border-gold-500 ring-1 ring-gold-500" : "border-line"}`}>
              <h3 className="mb-2 text-[14px] font-semibold">{fmtDay(d)}{d === p.today && " · Today"}</h3>
              <div className="space-y-1.5">
                {shootsByDate.get(d)?.map((s) => <ShootMarker key={s.id} s={s} />)}
                {(byDate.get(d) ?? []).map((x) => <Chip key={x.id} x={x} />)}
                {!byDate.get(d)?.length && !shootsByDate.get(d)?.length && <p className="text-[13px] text-muted">Nothing scheduled.</p>}
              </div>
            </li>
          ))}
      </ol>

      {sel && (
        <div role="dialog" aria-modal="true" aria-labelledby="item-h" className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <ClientDot colour={clientById.get(sel.clientId)?.colour ?? "#000"} />
              <Link href={`/admin/clients/${sel.clientId}`} className="font-semibold text-ink underline-offset-4 hover:underline">{clientById.get(sel.clientId)?.name}</Link>
              · <PlatformGlyph platform={sel.platform} /> {formatLabel(sel.format)} · {fmtDay(sel.date)} {sel.time}
            </p>
            <h3 id="item-h" className="mt-2 text-[18px] font-semibold">{sel.title}</h3>
            {sel.hook && <p className="mt-1 text-[14px] text-ink-soft">{sel.hook}</p>}
            <p className="mt-2"><StageBadge stage={sel.stage} />{sel.clientApproved && <span className="ml-2 text-[12px] font-semibold text-gold-700">Client approved</span>}</p>
            {sel.complianceNote && <p className="mt-3 rounded-lg border border-gold-500/40 bg-gold-100/50 px-3 py-2 text-[13px]"><span className="font-semibold">Compliance:</span> {sel.complianceNote}</p>}
            <ul className="mt-3 space-y-1 text-[13px]">
              {p.tasks.filter((t) => t.itemId === sel.id).map((t) => (
                <li key={t.id} className={t.status !== "done" && t.due < p.today ? "text-red-900" : ""}>{fmtDay(t.due)} · {t.label} · {t.status.replace("_", " ")}{t.late ? " · late" : ""}</li>
              ))}
            </ul>
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (moveTo) void move(sel.id, moveTo);
              }}
            >
              <label className="text-[12px] font-semibold">Move to<input type="date" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`mt-1 block ${field}`} /></label>
              <button className={btnGhost} disabled={!moveTo || moveTo === sel.date}>Move</button>
              <button type="button" className={`${btnSmall} ml-auto`} onClick={() => setSelected(null)}>Close</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
