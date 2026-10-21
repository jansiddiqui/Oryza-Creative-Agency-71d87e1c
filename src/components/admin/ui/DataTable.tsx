"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "../shell/Icon";

/*
 * One table for the admin lists: search, sorting, saved views, bulk actions, density, sticky header, keyboard
 * (J/K/Enter), and cards on phones. Views and density are remembered per browser (they are conveniences only).
 */
export interface Column<T> {
  key: string;
  label: string;
  /** Value used for sorting (no sort when missing). */
  sort?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
  /** How the column appears on a phone card. */
  card?: "title" | "meta" | "badge" | "hide";
}

export interface View<T> {
  id: string;
  label: string;
  test: (row: T) => boolean;
}

export interface BulkAction<T> {
  label: string;
  run: (rows: T[]) => void | Promise<void>;
}

export function sortRows<T>(rows: T[], col: Column<T> | undefined, dir: "asc" | "desc"): T[] {
  if (!col?.sort) return rows;
  const f = col.sort;
  return [...rows].sort((a, b) => {
    const x = f(a);
    const y = f(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "en-IN", { numeric: true, sensitivity: "base" });
    return dir === "asc" ? c : -c;
  });
}

function stored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage blocked */
  }
}

export function DataTable<T>({ id, rows, rowKey, columns, views = [], search, bulk = [], onOpen, initialSort, empty, actions }: {
  /** Storage key for this table's preferences. */
  id: string;
  rows: T[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  views?: View<T>[];
  /** Text to search in. */
  search?: (row: T) => string;
  bulk?: BulkAction<T>[];
  onOpen?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  empty?: ReactNode;
  /** Per-row actions (buttons), shown at the end of the row and on the card. */
  actions?: (row: T) => ReactNode;
}) {
  const [view, setView] = useState(views[0]?.id ?? "all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(initialSort ?? { key: "", dir: "asc" as const });
  const [dense, setDense] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(-1);
  const [saved, setSaved] = useState<{ id: string; label: string; q: string; base: string }[]>([]);

  useEffect(() => {
    setDense(stored(`oz_dense_${id}`, false));
    setSaved(stored(`oz_views_${id}`, []));
    const v = stored<string | null>(`oz_view_${id}`, null);
    if (v) setView(v);
  }, [id]);

  const savedView = saved.find((s) => s.id === view);
  const base = views.find((v) => v.id === (savedView?.base ?? view));
  const query = (savedView?.q ?? q).trim().toLowerCase();
  const shown = useMemo(() => {
    const filtered = rows.filter((r) => (!base || base.test(r)) && (!query || !search || search(r).toLowerCase().includes(query)));
    return sortRows(filtered, columns.find((c) => c.key === sort.key), sort.dir);
  }, [rows, base, query, search, columns, sort]);
  const allPicked = shown.length > 0 && shown.every((r) => picked.has(rowKey(r)));
  const pickedRows = rows.filter((r) => picked.has(rowKey(r)));

  useEffect(() => {
    const h = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name === "next") setCursor((c) => Math.min(shown.length - 1, c + 1));
      if (name === "prev") setCursor((c) => Math.max(0, c - 1));
      if (name === "open" && cursor >= 0 && shown[cursor]) onOpen?.(shown[cursor]);
    };
    window.addEventListener("admin:shortcut", h);
    return () => window.removeEventListener("admin:shortcut", h);
  }, [shown, cursor, onOpen]);

  const choose = (v: string) => {
    setView(v);
    setPicked(new Set());
    store(`oz_view_${id}`, v);
  };
  const count = (v: View<T>) => rows.filter(v.test).length;
  const th = (c: Column<T>) => {
    const on = sort.key === c.key;
    return (
      <th key={c.key} scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : c.sort ? "none" : undefined} className={`sticky top-0 z-[1] whitespace-nowrap border-b border-edge bg-surface px-3 py-2.5 text-left text-[12px] font-bold text-muted ${c.className ?? ""}`}>
        {c.sort ? (
          <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort({ key: c.key, dir: on && sort.dir === "asc" ? "desc" : "asc" })}>
            {c.label}<span aria-hidden="true">{on ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
          </button>
        ) : c.label}
      </th>
    );
  };
  const title = columns.find((c) => c.card === "title") ?? columns[0];

  return (
    <div>
      {(views.length > 0 || saved.length > 0) && (
        <div role="group" aria-label="Views" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {[...views.map((v) => ({ id: v.id, label: v.label, n: count(v) })), ...saved.map((s) => ({ id: s.id, label: s.label, n: null as number | null }))].map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => choose(v.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold md:min-h-8 ${view === v.id ? "border-ink bg-ink text-paper" : "border-edge-strong bg-surface"}`}>
              {v.label}{v.n !== null && <span className="text-[12px] opacity-75 tabular-nums">{v.n}</span>}
            </button>
          ))}
          {search && q.trim() && !savedView && (
            <button type="button" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-dashed border-edge-strong px-3 text-[13px] font-semibold md:min-h-8" onClick={() => {
              const s = { id: `saved-${Date.now()}`, label: `“${q.trim()}”`, q: q.trim(), base: base?.id ?? "" };
              const next = [...saved, s].slice(-6);
              setSaved(next);
              store(`oz_views_${id}`, next);
              choose(s.id);
              setQ("");
            }}>+ Save this search</button>
          )}
          {savedView && (
            <button type="button" className="inline-flex min-h-10 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold text-muted md:min-h-8" onClick={() => {
              const next = saved.filter((s) => s.id !== savedView.id);
              setSaved(next);
              store(`oz_views_${id}`, next);
              choose(views[0]?.id ?? "all");
            }}>Remove view</button>
          )}
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {search && (
          <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-edge-strong bg-surface px-3 md:min-h-10 md:w-80">
            <Icon name="search" className="text-muted" />
            <span className="sr-only">Search</span>
            <input value={savedView ? savedView.q : q} disabled={!!savedView} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none [border-color:transparent!important] md:text-[14px]" />
          </label>
        )}
        <span className="text-[13px] text-muted tabular-nums">{shown.length} of {rows.length}</span>
        <span className="flex-1" />
        <div role="group" aria-label="Row density" className="hidden rounded-[10px] bg-surface-2 p-[3px] md:inline-flex">
          {[["Comfortable", false], ["Compact", true]].map(([l, v]) => (
            <button key={String(l)} type="button" aria-pressed={dense === v} onClick={() => { setDense(Boolean(v)); store(`oz_dense_${id}`, v); }} className={`min-h-8 rounded-lg px-3 text-[13px] font-semibold ${dense === v ? "bg-surface shadow-sm" : "text-text-2"}`}>{l}</button>
          ))}
        </div>
      </div>
      {bulk.length > 0 && picked.size > 0 && (
        <div role="region" aria-label="Bulk actions" className="sticky top-14 z-[2] mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-3 py-2 text-paper md:top-[68px]">
          <span className="text-[14px] font-semibold tabular-nums">{picked.size} selected</span>
          <span className="flex-1" />
          {bulk.map((b) => (
            <button key={b.label} type="button" className="min-h-10 rounded-lg border border-paper/40 px-3 text-[13px] font-semibold hover:bg-white/10 md:min-h-8" onClick={async () => { await b.run(pickedRows); setPicked(new Set()); }}>{b.label}</button>
          ))}
          <button type="button" className="min-h-10 rounded-lg px-3 text-[13px] font-semibold text-paper/80 md:min-h-8" onClick={() => setPicked(new Set())}>Clear</button>
        </div>
      )}
      {shown.length === 0 ? (
        empty ?? <p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">Nothing matches.</p>
      ) : (
        <>
          <div className="hidden max-h-[calc(100dvh-220px)] overflow-auto rounded-xl border border-edge bg-surface md:block">
            <table className="w-full border-separate border-spacing-0 text-[14px]">
              <thead>
                <tr>
                  {bulk.length > 0 && (
                    <th scope="col" className="sticky top-0 z-[1] w-11 border-b border-edge bg-surface px-3">
                      <input type="checkbox" aria-label="Select all" checked={allPicked} onChange={(e) => setPicked(e.target.checked ? new Set(shown.map(rowKey)) : new Set())} />
                    </th>
                  )}
                  {columns.map(th)}
                  {actions && <th scope="col" className="sticky top-0 z-[1] border-b border-edge bg-surface"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const k = rowKey(r);
                  const sel = picked.has(k);
                  return (
                    <tr key={k} aria-selected={bulk.length ? sel : undefined} data-cursor={i === cursor || undefined} className={`group ${sel ? "bg-gold-100/40" : "hover:bg-[#faf9f6]"} ${i === cursor ? "outline-2 -outline-offset-2 outline-gold-500" : ""}`}>
                      {bulk.length > 0 && (
                        <td className="border-b border-edge px-3">
                          <input type="checkbox" aria-label={`Select ${String(title.sort?.(r) ?? k)}`} checked={sel} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(k); else n.delete(k); return n; })} />
                        </td>
                      )}
                      {columns.map((c) => <td key={c.key} className={`border-b border-edge px-3 ${dense ? "py-1.5" : "py-3"} ${c.className ?? ""}`}>{c.render(r)}</td>)}
                      {actions && <td className="whitespace-nowrap border-b border-edge px-3 text-right">{actions(r)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {shown.map((r) => {
              const k = rowKey(r);
              return (
                <li key={k} className={`rounded-xl border bg-surface p-3 ${picked.has(k) ? "border-gold-500" : "border-edge"}`}>
                  <div className="flex items-start gap-3">
                    {bulk.length > 0 && (
                      <label className="-m-2 grid h-11 w-11 shrink-0 place-items-center">
                        <input type="checkbox" aria-label="Select" checked={picked.has(k)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(k); else n.delete(k); return n; })} />
                      </label>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 text-[15px] font-semibold">{title.render(r)}</div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">{columns.filter((c) => c.card === "badge").map((c) => <span key={c.key}>{c.render(r)}</span>)}</div>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-muted">
                        {columns.filter((c) => c.card === "meta").map((c, i) => <span key={c.key}>{i > 0 && "· "}{c.render(r)}</span>)}
                      </div>
                    </div>
                  </div>
                  {actions && <div className="mt-2 flex flex-wrap gap-2 [&>*]:flex-1">{actions(r)}</div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
