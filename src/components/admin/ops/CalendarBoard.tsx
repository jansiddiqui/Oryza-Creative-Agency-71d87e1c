"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moveItemAction } from "@/app/admin/(panel)/calendar/actions";
import { platforms } from "@/data/platforms";
import type { TeamMember } from "@/lib/admin/ops-data";
import { addDays } from "@/lib/engine/dates";
import { filterItems, isOverdue, mondayOf, monthGrid, shift, weekDays, type CalendarFilters, type CalendarView } from "@/lib/ops/calendar";
import { ITEM_STAGES, type ClientLite, type ItemRow, type ShootRow, type TaskRow } from "@/lib/ops/types";
import { Dialog, Drawer } from "../shell/Drawer";
import { Board } from "./Board";
import { Icon } from "../shell/Icon";
import { useToast } from "../shell/Toasts";
import { btn, btnGhost, btnSmall, btnText, catLabel, ClientDot, field, fmtDay, formatLabel, label, PlatformGlyph, stageLabel, STAGE_TONE, StageBadge } from "./ui";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STAGE_DOT: Record<string, string> = { neutral: "bg-neutral", info: "bg-info", warn: "bg-warn", ok: "bg-ok", violet: "bg-violet", ink: "bg-ink", bad: "bg-bad", gold: "bg-gold-500" };

export type CalendarMode = CalendarView | "list" | "board";

export interface CalendarProps {
  view: CalendarMode;
  anchor: string;
  today: string;
  items: ItemRow[];
  tasks: TaskRow[];
  shoots: ShootRow[];
  clients: ClientLite[];
  team: TeamMember[];
  filters: CalendarFilters;
  /** Page the calendar lives on (may already carry a query, e.g. a client's Content tab). */
  basePath?: string;
  /** On a client page the client filter is fixed. */
  lockedClient?: string;
  /** Extra views offered by the page (the master calendar adds List and Board). */
  modes?: CalendarMode[];
}

/** Builds a link that keeps the base page's own query (e.g. ?tab=content) and the calendar state. */
export function calendarHref(base: string, state: Record<string, string | undefined>, lockedClient?: string) {
  const [path, query = ""] = base.split("?");
  const q = new URLSearchParams(query);
  for (const [k, v] of Object.entries(state)) {
    if (lockedClient && k === "client") continue;
    if (v) q.set(k, v);
    else q.delete(k);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Master calendar: month / week / day on desktop; a week strip with an agenda on phones. */
export function CalendarBoard(p: CalendarProps) {
  const router = useRouter();
  const toast = useToast();
  const base = p.basePath ?? "/admin/calendar";
  const [dragging, setDragging] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState<ItemRow | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [confirm, setConfirm] = useState<{ item: ItemRow; date: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [day, setDay] = useState(p.anchor);
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

  const href = (patch: Partial<{ view: string; date: string } & CalendarFilters>) => calendarHref(base, { view: p.view, date: p.anchor, ...p.filters, ...patch } as Record<string, string | undefined>, p.lockedClient);

  async function move(item: ItemRow, date: string, confirmed = false) {
    if (item.date === date) return;
    const res = await moveItemAction(item.id, date, confirmed);
    if (!res.ok) return toast.show({ message: res.error, tone: "error" });
    if (res.data.needsConfirm) return setConfirm({ item, date });
    setMoveFor(null);
    const from = item.date;
    toast.show({
      message: `Moved “${item.title}” to ${fmtDay(date)} · ${res.data.changed} task${res.data.changed === 1 ? "" : "s"} rescheduled`,
      undo: async () => {
        const u = await moveItemAction(item.id, from, true);
        router.refresh();
        return u.ok ? { ok: true } : { ok: false, error: u.error };
      },
    });
    router.refresh();
  }

  const chip = (x: ItemRow, rich = false) => {
    const c = clientById.get(x.clientId);
    const late = isOverdue(x, p.tasks, p.today);
    return (
      <Link
        key={x.id}
        href={`/admin/items/${x.id}`}
        scroll={false}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", x.id);
          setDragging(x.id);
        }}
        onDragEnd={() => setDragging(null)}
        aria-label={`${c?.name ?? ""}: ${x.title}, ${formatLabel(x.format)}, ${stageLabel(x.stage)}${late ? ", overdue" : ""}`}
        className={`flex min-w-0 items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-[12px] leading-4 ${late ? "bg-bad-bg text-bad" : "bg-surface-2 hover:bg-[#e6e3da]"} ${dragging === x.id ? "opacity-50" : ""}`}
        style={{ borderLeftColor: c?.colour }}
      >
        <span aria-hidden="true" className={`h-[7px] w-[7px] shrink-0 rounded-full ${STAGE_DOT[STAGE_TONE[x.stage]]}`} />
        <span className="shrink-0 font-semibold">{formatLabel(x.format)}</span>
        <span className="min-w-0 truncate">{x.title}</span>
        {rich && <span className="ml-auto shrink-0 text-muted">{x.time}</span>}
      </Link>
    );
  };

  const shootChip = (s: ShootRow) => (
    <Link key={s.id} href={`/admin/shoots/${s.id}`} className="flex min-w-0 items-center gap-1 rounded-md border border-dashed border-edge-strong px-1.5 py-0.5 text-[11px] font-semibold hover:border-ink">
      <ClientDot colour={clientById.get(s.clientId)?.colour ?? "#999"} size={7} /><span className="truncate">Shoot{s.startTime && ` ${s.startTime}`} · {clientById.get(s.clientId)?.name}</span>
    </Link>
  );

  const cell = (date: string, inMonth: boolean, tall: boolean) => {
    const list = byDate.get(date) ?? [];
    const isToday = date === p.today;
    const max = tall ? 50 : 3;
    return (
      <div
        key={date}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          setDragging(null);
          const x = p.items.find((i) => i.id === id);
          if (x) void move(x, date);
        }}
        className={`flex min-w-0 flex-col gap-[3px] border-b border-r border-edge p-1.5 [&:nth-child(7n)]:border-r-0 ${tall ? "min-h-[420px]" : "min-h-[124px]"} ${inMonth ? "bg-surface" : "bg-[#faf9f6]"}`}
      >
        <Link href={href({ view: "day", date })} className="flex items-center justify-between text-[12px] font-semibold text-text-2">
          <span className={isToday ? "rounded-full bg-ink px-1.5 text-paper" : inMonth ? "" : "text-muted"}>{Number(date.slice(8))}{isToday && <span className="sr-only"> · Today</span>}</span>
          {list.length > max && <span className="text-muted">{list.length}</span>}
        </Link>
        {shootsByDate.get(date)?.map(shootChip)}
        {list.slice(0, max).map((x) => chip(x))}
        {list.length > max && <Link href={href({ view: "day", date })} className="px-1.5 text-[12px] text-muted hover:underline">+{list.length - max} more</Link>}
      </div>
    );
  };

  const grid: CalendarView = p.view === "list" || p.view === "board" ? "week" : p.view;
  const title = p.view === "month" ? `${MONTHS[Number(p.anchor.slice(5, 7)) - 1]} ${p.anchor.slice(0, 4)}` : p.view === "day" ? fmtDay(p.anchor) : `Week of ${fmtDay(weekDays(p.anchor)[0])}`;
  const days = grid === "month" ? monthGrid(p.anchor).flat() : grid === "week" ? weekDays(p.anchor) : [p.anchor];
  const assignees = p.team.filter((m) => m.active);
  const options: Record<keyof CalendarFilters, { label: string; options: { id: string; label: string }[] }> = {
    client: { label: "Client", options: p.clients.map((c) => ({ id: c.id, label: c.name })) },
    platform: { label: "Platform", options: platforms.map((x) => ({ id: x.id, label: x.name })) },
    format: { label: "Format", options: [...new Set(p.items.map((x) => x.format))].sort().map((f) => ({ id: f, label: formatLabel(f) })) },
    stage: { label: "Stage", options: ITEM_STAGES },
    assignee: { label: "Assignee", options: assignees.map((m) => ({ id: m.email, label: m.name })) },
    category: { label: "Category", options: [...new Set(p.clients.map((c) => c.category))].map((c) => ({ id: c, label: catLabel(c) })) },
  };
  const keys = (Object.keys(options) as (keyof CalendarFilters)[]).filter((k) => !(p.lockedClient && (k === "client" || k === "category")));
  const active = keys.filter((k) => p.filters[k]);
  const select = (k: keyof CalendarFilters, block = false) => (
    <label key={k} className={block ? label : "contents"}>
      {block && options[k].label}
      <select aria-label={options[k].label} value={p.filters[k] ?? ""} onChange={(e) => router.push(href({ [k]: e.target.value }))} className={`${block ? "mt-1 w-full" : "w-auto"} ${field} md:min-h-9 md:py-1 md:text-[13px]`}>
        <option value="">{block ? "All" : `${options[k].label}: all`}</option>
        {options[k].options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
  const modes: CalendarMode[] = p.modes ?? ["month", "week", "day"];
  const modeLabel: Record<CalendarMode, string> = { month: "Month", week: "Week", day: "Day", list: "List", board: "Board" };

  // Phones: the week around the chosen day.
  const strip = weekDays(day);
  const agendaDays = [day, ...strip.filter((d) => d > day && (byDate.get(d)?.length || shootsByDate.get(d)?.length))];

  return (
    <div>
      <div className="mb-3 hidden flex-wrap items-center gap-2 md:flex">
        <Link href={href({ date: shift(grid, p.anchor, -1) })} className={btnSmall} aria-label="Previous"><Icon name="left" size={16} /></Link>
        <Link href={href({ date: p.today })} className={btnSmall}>Today</Link>
        <Link href={href({ date: shift(grid, p.anchor, 1) })} className={btnSmall} aria-label="Next"><Icon name="chevron" size={16} /></Link>
        <h2 className="mx-2 font-display text-[22px]">{title}</h2>
        <nav aria-label="Calendar view" className="ml-auto inline-flex rounded-[10px] bg-surface-2 p-[3px]">
          {modes.map((v) => (
            <Link key={v} href={href({ view: v })} aria-current={p.view === v ? "page" : undefined} className={`flex min-h-8 items-center rounded-lg px-3 text-[13px] font-semibold ${p.view === v ? "bg-surface shadow-sm" : "text-text-2"}`}>{modeLabel[v]}</Link>
          ))}
        </nav>
      </div>
      <div className="mb-3 hidden flex-wrap items-center gap-2 md:flex">
        {keys.map((k) => select(k))}
        {active.length > 0 && <Link href={href(Object.fromEntries(keys.map((k) => [k, ""])))} className={btnText}>Clear filters</Link>}
      </div>

      {(p.view === "list" || p.view === "board") && (
        <>
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <Link href={href({ date: shift(grid, p.anchor, -1) })} className={btnSmall} aria-label="Previous week"><Icon name="left" size={16} /></Link>
            <p className="flex-1 text-center font-display text-[18px]">{title}</p>
            <Link href={href({ date: shift(grid, p.anchor, 1) })} className={btnSmall} aria-label="Next week"><Icon name="chevron" size={16} /></Link>
            <button type="button" className={btnSmall} onClick={() => setFiltersOpen(true)}>Filter{active.length ? ` (${active.length})` : ""}</button>
          </div>
          {p.view === "board" ? (
            <Board items={items} clients={p.clients} today={p.today} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-edge bg-surface">
              {days.filter((d) => byDate.get(d)?.length).map((d) => (
                <div key={d}>
                  <p className={`border-t border-edge bg-surface-2/70 px-4 py-1.5 text-[13px] font-semibold first:border-t-0 ${d === p.today ? "text-gold-700" : ""}`}>{fmtDay(d)}{d === p.today && " · Today"}</p>
                  <ul className="divide-y divide-edge">
                    {(byDate.get(d) ?? []).map((x) => (
                      <li key={x.id}>
                        <Link href={`/admin/items/${x.id}`} scroll={false} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 hover:bg-surface-2/60">
                          <ClientDot colour={clientById.get(x.clientId)?.colour ?? "#999"} />
                          <PlatformGlyph platform={x.platform} />
                          <span className="min-w-0 flex-1 basis-48"><span className="block truncate text-[14px] font-semibold">{x.title}</span><span className="text-[12px] text-muted">{clientById.get(x.clientId)?.name} · {formatLabel(x.format)} · {x.time}</span></span>
                          <StageBadge stage={x.stage} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {!items.some((x) => days.includes(x.date)) && <p className="px-4 py-6 text-center text-[14px] text-muted">Nothing planned this week.</p>}
            </div>
          )}
        </>
      )}

      {/* Phones: month name, filters, week strip, agenda. */}
      <div className={p.view === "list" || p.view === "board" ? "hidden" : "md:hidden"}>
        <div className="mb-2 flex items-center gap-2">
          <p className="flex-1 font-display text-[20px]">{MONTHS[Number(day.slice(5, 7)) - 1]} {day.slice(0, 4)}</p>
          <button type="button" className={btnSmall} onClick={() => setDay(p.today)}>Today</button>
          <button type="button" className={btnSmall} onClick={() => setFiltersOpen(true)}>Filter{active.length ? ` (${active.length})` : ""}</button>
        </div>
        <div className="mb-3 flex items-center gap-1">
          <button type="button" aria-label="Previous week" onClick={() => setDay(addDays(mondayOf(day), -7))} className="grid h-11 w-8 shrink-0 place-items-center rounded-lg text-muted"><Icon name="left" size={16} /></button>
          <div role="group" aria-label="Choose a day" className="grid flex-1 grid-cols-7 gap-0.5">
            {strip.map((d, i) => (
              <button key={d} type="button" onClick={() => setDay(d)} aria-pressed={d === day} aria-current={d === p.today ? "date" : undefined} className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl ${d === day ? "bg-ink text-paper" : d === p.today ? "ring-1 ring-inset ring-ink" : ""}`}>
                <span className={`text-[11px] font-semibold ${d === day ? "text-paper/80" : "text-muted"}`}>{WEEK[i]}</span>
                <span className="text-[16px] font-semibold tabular-nums">{Number(d.slice(8))}</span>
                <span aria-hidden="true" className={`mt-0.5 h-1 w-1 rounded-full ${byDate.get(d)?.length ? (d === day ? "bg-gold-300" : "bg-gold-500") : "bg-transparent"}`} />
              </button>
            ))}
          </div>
          <button type="button" aria-label="Next week" onClick={() => setDay(addDays(mondayOf(day), 7))} className="grid h-11 w-8 shrink-0 place-items-center rounded-lg text-muted"><Icon name="chevron" size={16} /></button>
        </div>
        {!p.items.some((x) => x.date >= strip[0] && x.date <= strip[6]) && (strip[0] < days[0] || strip[6] > days[days.length - 1]) && (
          <Link href={href({ date: day, view: "week" })} className={`${btnGhost} mb-3 w-full`}>Load this week</Link>
        )}
        <ol className="space-y-3">
          {agendaDays.map((d) => (
            <li key={d} className="overflow-hidden rounded-xl border border-edge bg-surface">
              <p className={`border-b border-edge bg-surface-2/70 px-4 py-2 text-[13px] font-semibold ${d === p.today ? "text-gold-700" : ""}`}>{fmtDay(d)}{d === p.today && " · Today"}</p>
              <ul className="divide-y divide-edge">
                {shootsByDate.get(d)?.map((s) => (
                  <li key={s.id}><Link href={`/admin/shoots/${s.id}`} className="flex min-h-12 items-center gap-2 px-4 text-[14px]"><span className="rounded border border-dashed border-edge-strong px-1.5 text-[11px] font-bold">Shoot</span>{s.startTime} · {clientById.get(s.clientId)?.name}</Link></li>
                ))}
                {(byDate.get(d) ?? []).map((x) => {
                  const late = isOverdue(x, p.tasks, p.today);
                  return (
                    <li key={x.id} className="flex items-center">
                      <Link href={`/admin/items/${x.id}`} scroll={false} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4">
                        <ClientDot colour={clientById.get(x.clientId)?.colour ?? "#999"} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold">{x.title}</span>
                          <span className={`text-[12px] ${late ? "font-semibold text-bad" : "text-muted"}`}>{formatLabel(x.format)} · {x.time}{late ? " · Overdue" : ""} · {stageLabel(x.stage)}</span>
                        </span>
                      </Link>
                      <button type="button" onClick={() => { setMoveFor(x); setMoveTo(x.date); }} aria-label={`Move “${x.title}”`} className="grid h-11 w-11 shrink-0 place-items-center text-muted"><Icon name="more" /></button>
                    </li>
                  );
                })}
                {!byDate.get(d)?.length && !shootsByDate.get(d)?.length && <li className="px-4 py-3 text-[14px] text-muted">Nothing planned.</li>}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {/* Desktop grids. */}
      {p.view === "list" || p.view === "board" ? null : p.view === "day" ? (
        <ul className="hidden overflow-hidden rounded-xl border border-edge bg-surface md:block">
          {shootsByDate.get(p.anchor)?.map((s) => <li key={s.id} className="border-b border-edge px-4 py-2">{shootChip(s)}</li>)}
          {(byDate.get(p.anchor) ?? []).map((x) => (
            <li key={x.id} className="flex items-center gap-3 border-b border-edge px-4 py-2 last:border-b-0">
              <span className="w-16 text-[13px] text-muted">{x.time}</span>
              <PlatformGlyph platform={x.platform} />
              <Link href={`/admin/items/${x.id}`} scroll={false} className="min-w-0 flex-1 truncate font-semibold hover:underline">{x.title}</Link>
              <span className="text-[13px] text-muted">{clientById.get(x.clientId)?.name}</span>
              <StageBadge stage={x.stage} />
              <button type="button" className={btnText} onClick={() => { setMoveFor(x); setMoveTo(x.date); }}>Move…</button>
            </li>
          ))}
          {!byDate.get(p.anchor)?.length && <li className="px-4 py-6 text-center text-[14px] text-muted">Nothing planned on this day.</li>}
        </ul>
      ) : (
        <div className="hidden overflow-hidden rounded-xl border border-edge md:block">
          <div className="grid grid-cols-7 border-b border-edge bg-surface text-[12px] font-bold text-muted">
            {(p.view === "week" ? weekDays(p.anchor).map((d, i) => `${WEEK[i]} ${Number(d.slice(8))}`) : WEEK).map((d) => <div key={d} className="px-2.5 py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">{days.map((d) => cell(d, p.view !== "month" || d.slice(0, 7) === p.anchor.slice(0, 7), p.view === "week"))}</div>
        </div>
      )}
      <p className={`mt-2 flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted ${p.view === "list" || p.view === "board" ? "hidden" : "hidden md:flex"}`}>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-bad-bg ring-1 ring-bad/40" />Overdue</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-dashed border-edge-strong" />Shoot</span>
        <span>Dot = stage · left bar = client · drag a post to another day to move it</span>
      </p>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter the calendar" width={420} footer={<><Link href={href(Object.fromEntries(keys.map((k) => [k, ""])))} onClick={() => setFiltersOpen(false)} className={btnGhost}>Clear</Link><button type="button" className={btn} onClick={() => setFiltersOpen(false)}>Done</button></>}>
        <div className="space-y-3">{keys.map((k) => select(k, true))}</div>
      </Drawer>
      <Drawer open={!!moveFor} onClose={() => setMoveFor(null)} title="Move to another day" subtitle={moveFor?.title} width={420} footer={<button type="button" className={btn} disabled={!moveTo || moveTo === moveFor?.date} onClick={() => moveFor && move(moveFor, moveTo)}>Move</button>}>
        <label className={label}>New date<input type="date" data-autofocus value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`mt-1 w-full ${field}`} /></label>
        <p className="mt-2 text-[13px] text-muted">Its open tasks are rescheduled to match. You can undo the move.</p>
      </Drawer>
      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="The client already approved this post"
        footer={<><button type="button" className={btnGhost} onClick={() => setConfirm(null)}>Keep the date</button><button type="button" className={btn} onClick={() => { const c = confirm!; setConfirm(null); void move(c.item, c.date, true); }}>Move anyway</button></>}
      >
        “{confirm?.item.title}” was approved for {confirm && fmtDay(confirm.item.date)}. Move it to {confirm && fmtDay(confirm.date)}? Let the client know about the new date.
      </Dialog>
    </div>
  );
}
