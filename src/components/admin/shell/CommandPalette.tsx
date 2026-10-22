"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { trapTab } from "./Drawer";
import { flatten, paletteKey, paletteSections, parseQuery, parseRecent, pushRecent, recentKey, returnFocus, TYPE_LABEL, type PaletteEntry, type PaletteSection } from "./palette";
import type { IconName } from "./nav";
import { useStored } from "../ui/useStored";

const GROUP_ICON: Record<string, IconName> = { Clients: "clients", Posts: "calendar", Leads: "leads", Shoots: "shoots" };
export const PALETTE_PLACEHOLDER = "Search clients, posts, leads, shoots…";

/** The rows, grouped under section headings. Separate so it can be rendered on its own (and tested). */
export function PaletteList({ sections, current, onHover, onPick, empty }: { sections: PaletteSection[]; current: number; onHover: (i: number) => void; onPick: (e: PaletteEntry) => void; empty: string }) {
  if (!sections.length) return <p className="px-4 py-10 text-center text-[14px] text-muted">{empty}</p>;
  const offset = sections.map((_, k) => sections.slice(0, k).reduce((n, s) => n + s.entries.length, 0));
  return (
    <div id="palette-list" role="listbox" aria-label="Results" className="py-1.5">
      {sections.map((s, si) => (
        <div key={s.name} role="group" aria-labelledby={`pal-h-${s.name}`} className="pb-1.5">
          <p id={`pal-h-${s.name}`} className="px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{s.name}</p>
          {s.entries.map((e, ei) => {
            const n = offset[si] + ei;
            const on = n === current;
            return (
              <div
                key={`${s.name}:${e.id}`}
                id={`pal-${n}`}
                role="option"
                aria-selected={on}
                data-selected={on || undefined}
                onMouseMove={() => !on && onHover(n)}
                onClick={() => onPick(e)}
                className={`relative mx-1.5 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg pl-3 pr-3 text-[14px] md:min-h-11 ${on ? "bg-gold-100/70 shadow-[inset_3px_0_0_var(--color-gold-500)]" : "hover:bg-surface-2/70"}`}
              >
                <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${on ? "bg-surface text-gold-700" : "bg-surface-2 text-text-2"}`}>
                  <Icon name={e.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{e.label}</span>
                  {e.hint && <span className="block truncate text-[12px] text-muted">{e.hint}</span>}
                </span>
                <span className="shrink-0 text-[12px] text-muted">{TYPE_LABEL[e.group]}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Ctrl/⌘+K: jump to any client, post, lead or shoot, or run a command ("&gt;" for commands only).
 * ↑/↓ move, Enter opens, Esc closes; focus goes back to whatever opened it. Full-screen sheet on phones.
 */
export function CommandPalette({ open, onClose, commands, onHelp, user }: { open: boolean; onClose: () => void; commands: PaletteEntry[]; onHelp: () => void; user: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [hits, setHits] = useState<PaletteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [storedRecent, setStoredRecent] = useStored(recentKey(user));
  const recent = useMemo(() => parseRecent(storedRecent), [storedRecent]);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // The shell mounts the palette only while it is open: focus the field, and give focus back on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => {
      returnFocus(opener);
    };
  }, [open]);

  const { commandsOnly, text } = parseQuery(q);
  const searching = open && !commandsOnly && text.length >= 2;
  useEffect(() => {
    if (!searching) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/admin/api/search?q=${encodeURIComponent(text)}`, { signal: ctl.signal });
        const json = (await res.json()) as { hits?: { group: PaletteEntry["group"]; id: string; label: string; hint: string; href: string }[] };
        setHits((json.hits ?? []).map((h) => ({ id: `${h.group}:${h.id}`, group: h.group, label: h.label, hint: h.hint, href: h.href, icon: GROUP_ICON[h.group] ?? "search" })));
      } catch {
        /* aborted or offline: keep the local commands */
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [text, searching]);

  const sections = useMemo(() => paletteSections(q, commands, searching ? hits : [], recent), [q, commands, hits, searching, recent]);
  const rows = flatten(sections);
  const current = Math.min(sel, Math.max(0, rows.length - 1));

  // Keep the selected row in view while moving with the keyboard.
  useEffect(() => {
    list.current?.querySelector(`#pal-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, rows.length]);

  if (!open) return null;
  const go = (e: PaletteEntry) => {
    setStoredRecent(JSON.stringify(pushRecent(recent, e)));
    onClose();
    if (e.href === "#shortcuts") onHelp();
    else router.push(e.href);
  };
  const empty = commandsOnly ? "No command matches." : text.length < 2 ? "Type at least two letters to search." : loading ? "Searching…" : "No matches. Try a client name, a post title, or type > for commands.";

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="absolute inset-0 flex animate-rise flex-col overflow-hidden bg-surface shadow-modal ring-gold-500/60 focus-within:ring-2 md:inset-auto md:left-1/2 md:top-[12vh] md:max-h-[70vh] md:w-[640px] md:-translate-x-1/2 md:rounded-2xl"
        onKeyDown={(e) => {
          const r = paletteKey(e.key, current, rows.length);
          if (r) e.preventDefault();
          if (r?.kind === "close") onClose();
          else if (r?.kind === "move") setSel(r.sel);
          else if (r?.kind === "open" && rows[r.sel]) go(rows[r.sel]);
          if (box.current) trapTab(e, box.current, document.activeElement);
        }}
      >
        {/* The whole row is the field: icon, input, Esc hint. One hairline below. */}
        <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-edge pl-3.5 pr-1 md:gap-3 md:pl-4 md:pr-4" onClick={() => input.current?.focus()}>
          <Icon name="search" size={20} className="text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={rows[current] ? `pal-${current}` : undefined}
            aria-autocomplete="list"
            aria-label="Search clients, posts, leads and shoots, or type > for commands"
            placeholder={PALETTE_PLACEHOLDER}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="palette-input min-h-14 min-w-0 flex-1 bg-transparent text-[17px] text-ink placeholder:text-muted md:text-[16px]"
          />
          {loading && <span className="text-[12px] text-muted" aria-live="polite">Searching…</span>}
          <kbd className="hidden h-6 items-center rounded-[5px] border border-b-2 border-edge px-1.5 font-sans text-[11px] font-semibold text-muted md:inline-flex">Esc</kbd>
          <button type="button" onClick={onClose} className="min-h-11 shrink-0 rounded-lg px-2.5 text-[15px] font-semibold text-ink md:hidden">Cancel</button>
        </div>
        <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <PaletteList sections={sections} current={current} onHover={setSel} onPick={go} empty={empty} />
        </div>
        <div className="hidden shrink-0 items-center justify-between border-t border-edge px-4 py-2 text-[12px] text-muted md:flex">
          <span>↑↓ move · ↵ open · Esc close</span>
          <span>Type <kbd className="rounded-[4px] border border-edge px-1 font-sans font-semibold">&gt;</kbd> for commands</span>
        </div>
      </div>
    </div>
  );
}
