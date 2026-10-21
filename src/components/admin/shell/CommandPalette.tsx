"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { trapTab } from "./Drawer";
import { rank, type PaletteEntry } from "./palette";
import type { IconName } from "./nav";

const GROUP_ICON: Record<string, IconName> = { Clients: "clients", Posts: "calendar", Leads: "leads", Shoots: "shoots" };

/** Ctrl/⌘+K: jump to any client, post, lead or shoot, or run a command. ↑/↓ to choose, Enter to open, Esc to close. */
export function CommandPalette({ open, onClose, commands, onHelp }: { open: boolean; onClose: () => void; commands: PaletteEntry[]; onHelp: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [hits, setHits] = useState<PaletteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // The shell mounts the palette only while it is open, so every opening starts empty.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const searching = open && q.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/admin/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
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
  }, [q, searching]);

  const results = useMemo(() => {
    const local = rank(commands, q, 12);
    return [...local, ...(searching ? hits : []).filter((h) => !local.some((l) => l.href === h.href))];
  }, [commands, hits, q, searching]);
  const current = Math.min(sel, Math.max(0, results.length - 1));

  if (!open) return null;
  const go = (e: PaletteEntry) => {
    onClose();
    if (e.href === "#shortcuts") onHelp();
    else router.push(e.href);
  };
  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="absolute inset-x-0 top-0 flex max-h-dvh animate-rise flex-col overflow-hidden bg-surface shadow-modal md:inset-x-auto md:left-1/2 md:top-[12vh] md:max-h-[70vh] md:w-[640px] md:-translate-x-1/2 md:rounded-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((current + 1) % Math.max(1, results.length));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((current - 1 + results.length) % Math.max(1, results.length));
          }
          if (e.key === "Enter" && results[current]) {
            e.preventDefault();
            go(results[current]);
          }
          if (box.current) trapTab(e, box.current, document.activeElement);
        }}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4">
          <Icon name="search" className="text-muted" />
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
            aria-activedescendant={results[current] ? `pal-${current}` : undefined}
            aria-autocomplete="list"
            placeholder="Jump to a client, post, lead or shoot — or type a command"
            className="min-h-14 flex-1 border-0 bg-transparent text-[16px] outline-none [border-color:transparent!important]"
          />
          {loading && <span className="text-[12px] text-muted">Searching…</span>}
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-surface-2 md:hidden"><Icon name="close" /></button>
        </div>
        <ul id="palette-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-muted">{q.trim().length < 2 ? "Type at least two letters to search." : "No matches. Try a client name, a post title or “new”."}</li>}
          {results.map((e, i) => {
            const head = e.group !== lastGroup ? (lastGroup = e.group) : null;
            return (
              <li key={e.id}>
                {head && <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{head}</p>}
                <button
                  type="button"
                  id={`pal-${i}`}
                  role="option"
                  aria-selected={i === current}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(e)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] ${i === current ? "bg-surface-2" : ""}`}
                >
                  <Icon name={e.icon} className="text-muted" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{e.label}</span>
                    {e.hint && <span className="ml-2 text-muted">{e.hint}</span>}
                  </span>
                  {e.keys && <span className="hidden gap-1 md:flex">{e.keys.map((k) => <kbd key={k} className="rounded border border-b-2 border-edge px-1.5 text-[11px] font-semibold text-muted">{k}</kbd>)}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="hidden border-t border-edge px-4 py-2 text-[12px] text-muted md:block">↑ ↓ to choose · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}
