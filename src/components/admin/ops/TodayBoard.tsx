"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TeamMember } from "@/lib/admin/ops-data";
import type { OpsWarning } from "@/lib/ops/team";
import { groupByItem, groupToday, tasksForFilter, type TodayFilter } from "@/lib/ops/today";
import type { ClientLite, ItemRow, ShootRow, TaskRow as Task } from "@/lib/ops/types";
import { TaskRow } from "./TaskRow";
import { Badge, btnText, card, ClientDot, Empty, fmtDay, formatLabel, PlatformGlyph, StageBadge } from "./ui";

export interface TodayLead {
  id: string;
  name: string;
  business: string;
  source: string;
  createdAt: string;
}

const CARDS: { f: TodayFilter; label: string }[] = [
  { f: "overdue", label: "Overdue" },
  { f: "today", label: "Due today" },
  { f: "client", label: "Awaiting client" },
  { f: "shoots", label: "Shoots today" },
  { f: "leads", label: "New leads" },
];

const ago = (iso: string) => {
  const h = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

/** Today (the admin home): counts that filter the list, tasks grouped by post, one-tap actions. */
export function TodayBoard({ tasks, items, shoots, clients, team, me, today, initialMine, leads = [], awaiting = [], warnings = [], initialFilter }: {
  tasks: Task[];
  items: ItemRow[];
  shoots: ShootRow[];
  clients: ClientLite[];
  team: TeamMember[];
  me: string;
  today: string;
  initialMine: boolean;
  leads?: TodayLead[];
  /** Posts waiting for the client, with their approval task. */
  awaiting?: { item: ItemRow; task: Task | null }[];
  warnings?: OpsWarning[];
  initialFilter?: TodayFilter;
}) {
  const [mine, setMine] = useState(initialMine);
  const g = useMemo(() => groupToday(tasks, items, shoots, { today, me, mine }), [tasks, items, shoots, today, me, mine]);
  const counts: Record<TodayFilter, number> = { overdue: g.overdue.length, today: g.dueToday.length, next: g.next3.length, client: awaiting.length, shoots: g.shoots.length, leads: leads.length };
  const [filter, setFilter] = useState<TodayFilter>(initialFilter ?? (g.overdue.length ? "overdue" : "today"));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const itemById = new Map(items.map((x) => [x.id, x]));
  const shown = filter === "client" ? awaiting.map((a) => a.task).filter((t): t is Task => !!t) : tasksForFilter(g, filter);
  const groups = groupByItem(shown, items);
  const choose = (f: TodayFilter) => {
    setFilter(f);
    try {
      history.replaceState(null, "", `?f=${f}${mine ? "&who=me" : ""}`);
    } catch {
      /* ignore */
    }
  };

  const itemHead = (it: ItemRow | undefined, n: number) => {
    const c = it && clientById.get(it.clientId);
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-edge bg-surface-2/70 px-4 py-2 text-[13px] first:border-t-0">
        <ClientDot colour={c?.colour ?? "#999"} />
        <span className="font-semibold">{c?.name ?? "Client"}</span>
        {it && (
          <Link href={`/admin/items/${it.id}`} scroll={false} className="min-w-0 max-w-full truncate text-text-2 hover:underline">
            · {formatLabel(it.format)} · {it.title} · publishes {it.date === today ? "today" : fmtDay(it.date)}
          </Link>
        )}
        {n > 1 && <span className="ml-auto text-muted">{n} tasks</span>}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Whose work" className="inline-flex rounded-[10px] bg-surface-2 p-[3px]">
          {[{ v: true, l: "My work" }, { v: false, l: "Everyone" }].map((o) => (
            <button key={o.l} type="button" aria-pressed={mine === o.v} onClick={() => setMine(o.v)} className={`min-h-10 rounded-lg px-3 text-[13px] font-semibold md:min-h-8 ${mine === o.v ? "bg-surface shadow-sm" : "text-text-2"}`}>{o.l}</button>
          ))}
        </div>
        <p className="text-[13px] text-muted">{fmtDay(today)}</p>
      </div>

      <div role="group" aria-label="Filter the list" className="-mx-4 mb-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0">
        {CARDS.map(({ f, label }) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => choose(f)}
            className={`min-h-[72px] w-[132px] shrink-0 snap-start rounded-xl border bg-surface px-4 py-3 text-left transition-colors md:w-auto ${filter === f ? "border-ink shadow-[inset_0_-3px_0_var(--color-gold-500)]" : "border-edge hover:border-edge-strong"}`}
          >
            <span className="block text-[13px] font-semibold text-muted">{label}</span>
            <span className={`mt-0.5 block text-[26px] font-bold leading-[30px] tabular-nums ${f === "overdue" && counts[f] ? "text-bad" : ""}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-bad/25 bg-bad-bg/50 px-4 py-2.5 text-[14px]">
          <Badge tone="bad" dot={false}>{warnings.length} warning{warnings.length > 1 ? "s" : ""}</Badge>
          <span className="min-w-0 flex-1 basis-60">{warnings[0].message}{warnings.length > 1 ? ` · and ${warnings.length - 1} more` : ""}</span>
          <Link href="/admin/team" className={btnText}>Review</Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label={CARDS.find((c) => c.f === filter)?.label ?? "Next 3 days"} className="min-w-0">
          {filter === "shoots" ? (
            g.shoots.length ? (
              <ul className="space-y-2">
                {g.shoots.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/shoots/${s.id}`} className={`${card} block p-4 hover:border-edge-strong`}>
                      <p className="flex items-center gap-2 font-semibold"><ClientDot colour={clientById.get(s.clientId)?.colour ?? "#999"} />{clientById.get(s.clientId)?.name} · {s.label}{s.startTime && ` · ${s.startTime}${s.endTime ? `–${s.endTime}` : ""}`}</p>
                      <p className="text-[13px] text-muted">{s.location || "Location to confirm"} · {s.shots.length} planned shots</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty title="No shoots today">Upcoming shoots are on the <Link href="/admin/shoots" className="underline">Shoots page</Link>.</Empty>
          ) : filter === "leads" ? (
            leads.length ? (
              <ul className={`${card} divide-y divide-edge`}>
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/leads?lead=${l.id}`} className="flex min-h-14 items-center gap-3 px-4 hover:bg-surface-2/60">
                      <span className="min-w-0 flex-1"><span className="block font-semibold">{l.name}{l.business && <span className="font-normal text-text-2"> · {l.business}</span>}</span><span className="text-[13px] text-muted">{l.source === "plan-builder" ? "Plan builder" : "Contact form"} · {ago(l.createdAt)}</span></span>
                      <Badge tone="info">New</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty title="No new leads">New enquiries from the website appear here.</Empty>
          ) : groups.length ? (
            <div className={`${card} overflow-hidden`}>
              {groups.map((grp) => (
                <div key={grp.itemId}>
                  {itemHead(itemById.get(grp.itemId) ?? awaiting.find((a) => a.item.id === grp.itemId)?.item, grp.tasks.length)}
                  <ul>{grp.tasks.map((t) => <TaskRow key={`${t.id}-${t.status}`} task={t} today={today} team={team} />)}</ul>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={filter === "overdue" ? "Nothing overdue" : filter === "client" ? "Nothing waiting for clients" : filter === "next" ? "Nothing in the next 3 days" : "Nothing due today"}
              action={filter === "today" ? <button type="button" className={btnText} onClick={() => choose("next")}>See the next 3 days ({counts.next})</button> : <button type="button" className={btnText} onClick={() => choose("today")}>See what&apos;s due today</button>}
            >
              {mine ? "Switch to Everyone to see the whole team's work." : filter === "client" ? "Send posts for approval from a client page." : "All clear."}
            </Empty>
          )}
          {(filter === "today" || filter === "overdue") && counts.next > 0 && groups.length > 0 && (
            <button type="button" className={`${btnText} mt-2`} onClick={() => choose("next")}>Next 3 days ({counts.next}) →</button>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <section className={card} aria-labelledby="pub-h">
            <div className="flex items-center justify-between border-b border-edge px-4 py-3">
              <h2 id="pub-h" className="font-display text-[18px]">Publishing today</h2>
              <span className="text-[13px] text-muted tabular-nums">{g.publishing.length}</span>
            </div>
            {g.publishing.length ? (
              <ul className="divide-y divide-edge">
                {g.publishing.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/items/${x.id}`} scroll={false} className="flex min-h-12 items-center gap-2 px-4 py-2 text-[14px] hover:bg-surface-2/60">
                      <ClientDot colour={clientById.get(x.clientId)?.colour ?? "#999"} />
                      <PlatformGlyph platform={x.platform} />
                      <span className="min-w-0 flex-1 truncate">{x.time} · {x.title}</span>
                      <StageBadge stage={x.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-3 text-[14px] text-muted">Nothing publishing today.</p>}
          </section>
          {g.shoots.length > 0 && (
            <section className={`${card} p-4`} aria-label="Shoots today">
              <h2 className="mb-2 font-display text-[18px]">Shoot today</h2>
              {g.shoots.map((s) => (
                <Link key={s.id} href={`/admin/shoots/${s.id}`} className="block min-h-11 py-1 text-[14px] hover:underline">
                  <span className="font-semibold">{clientById.get(s.clientId)?.name}</span>{s.startTime && ` · ${s.startTime}`}{s.location && ` · ${s.location}`}
                </Link>
              ))}
            </section>
          )}
          {leads.length > 0 && filter !== "leads" && (
            <section className={`${card} p-4`} aria-label="New leads">
              <div className="mb-1 flex items-center justify-between"><h2 className="font-display text-[18px]">New leads</h2><Link href="/admin/leads" className={btnText}>All</Link></div>
              {leads.slice(0, 3).map((l) => (
                <Link key={l.id} href={`/admin/leads?lead=${l.id}`} className="block min-h-11 py-1 text-[14px] hover:underline"><span className="font-semibold">{l.name}</span>{l.business && ` · ${l.business}`}<span className="block text-[12px] text-muted">{ago(l.createdAt)}</span></Link>
              ))}
            </section>
          )}
          {g.perClient.length > 0 && (
            <section className={`${card} p-4`} aria-label="Counts per client">
              <h2 className="mb-2 font-display text-[18px]">By client</h2>
              <ul className="space-y-1">
                {g.perClient.map((c) => (
                  <li key={c.clientId}>
                    <Link href={`/admin/clients/${c.clientId}`} className="flex min-h-10 flex-wrap items-center gap-2 text-[14px] hover:underline">
                      <ClientDot colour={clientById.get(c.clientId)?.colour ?? "#999"} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{clientById.get(c.clientId)?.name}</span>
                      {c.overdue > 0 && <Badge tone="bad" dot={false}>{c.overdue} overdue</Badge>}
                      {c.today > 0 && <Badge tone="warn" dot={false}>{c.today} today</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
