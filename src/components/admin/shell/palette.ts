/** Command palette: the built-in commands, ranking, sections, recent items and keys. Pure (no React). */
import type { AdminRole } from "@/lib/admin/types";
import { accountLinksFor, navFor, type IconName } from "./nav";

export interface PaletteEntry {
  id: string;
  group: "Go to" | "Actions" | "Clients" | "Posts" | "Leads" | "Shoots";
  label: string;
  hint?: string;
  href: string;
  icon: IconName;
  keys?: string[];
}

/** Navigation and actions available to this role (results from the server are added as you type). */
export function commandsFor(role: AdminRole): PaletteEntry[] {
  const go: PaletteEntry[] = [...navFor(role).flatMap((g) => g.items), ...accountLinksFor(role)].map((i) => ({ id: `go:${i.href}`, group: "Go to", label: `Go to ${i.label}`, href: i.href, icon: i.icon }));
  const actions: PaletteEntry[] = [
    { id: "act:new-client", group: "Actions", label: "New client", hint: "Convert a lead or add one directly", href: "/admin/clients/new", icon: "plus", keys: ["N", "C"] },
    { id: "act:approval", group: "Actions", label: "Send for approval", hint: "Pick the client, then the posts", href: "/admin/clients?next=approvals", icon: "check" },
    { id: "act:board", group: "Actions", label: "Open the content board", href: "/admin/calendar?view=board", icon: "board", keys: ["G", "B"] },
    { id: "act:leave", group: "Actions", label: "Add leave", href: "/admin/team#leave", icon: "team" },
    { id: "act:shortcuts", group: "Actions", label: "Keyboard shortcuts", href: "#shortcuts", icon: "keyboard", keys: ["?"] },
  ];
  return [...go, ...actions];
}

/** Lower is better: exact, prefix, word prefix, substring, then subsequence; null = no match. */
export function score(label: string, q: string): number | null {
  const l = label.toLowerCase();
  const s = q.trim().toLowerCase();
  if (!s) return 50;
  if (l === s) return 0;
  if (l.startsWith(s)) return 1;
  if (l.split(/[\s·/-]+/).some((w) => w.startsWith(s))) return 2;
  if (l.includes(s)) return 3;
  let i = 0;
  for (const c of l) if (c === s[i]) i++;
  return i === s.length ? 4 : null;
}

const GROUP_ORDER: PaletteEntry["group"][] = ["Go to", "Actions", "Clients", "Posts", "Leads", "Shoots"];

/** Filters and orders entries for a query; with no query, navigation and actions only. */
export function rank(entries: PaletteEntry[], q: string, limit = 30): PaletteEntry[] {
  const scored = entries
    .map((e) => ({ e, s: score(`${e.label} ${e.hint ?? ""}`, q) }))
    .filter((x): x is { e: PaletteEntry; s: number } => x.s !== null && (q.trim() !== "" || x.e.group === "Go to" || x.e.group === "Actions"));
  return scored
    .sort((a, b) => (q.trim() ? a.s - b.s : 0) || GROUP_ORDER.indexOf(a.e.group) - GROUP_ORDER.indexOf(b.e.group))
    .slice(0, limit)
    .map((x) => x.e);
}

/* ---------------------------------------------------------------- sections shown in the palette */

export type SectionName = "Recent" | "Clients" | "Posts" | "Leads" | "Shoots" | "Actions";
export interface PaletteSection {
  name: SectionName;
  entries: PaletteEntry[];
}

/** The small type label on the right of each row. */
export const TYPE_LABEL: Record<PaletteEntry["group"], string> = { Clients: "Client", Posts: "Post", Leads: "Lead", Shoots: "Shoot", Actions: "Action", "Go to": "Page" };

/** ">" at the start filters to commands only; the rest is the search text. */
export function parseQuery(raw: string): { commandsOnly: boolean; text: string } {
  const t = raw.trimStart();
  return t.startsWith(">") ? { commandsOnly: true, text: t.slice(1).trim() } : { commandsOnly: false, text: raw.trim() };
}

/** With nothing typed: these four, in this order. */
const DEFAULT_ACTIONS = ["act:new-client", "act:approval", "go:/admin/today", "go:/admin/calendar"];
const RESULT_GROUPS: [SectionName, PaletteEntry["group"]][] = [["Clients", "Clients"], ["Posts", "Posts"], ["Leads", "Leads"], ["Shoots", "Shoots"]];

/**
 * What the palette lists. Empty: Recent (last opened) and four Actions. Typing: Clients · Posts · Leads · Shoots ·
 * Actions. ">…": Actions only (all commands, filtered by the text).
 */
export function paletteSections(raw: string, commands: PaletteEntry[], hits: PaletteEntry[], recent: PaletteEntry[]): PaletteSection[] {
  const { commandsOnly, text } = parseQuery(raw);
  const isCommand = (e: PaletteEntry) => e.group === "Actions" || e.group === "Go to";
  const sections: PaletteSection[] = [];
  if (commandsOnly) {
    // Actions first, then the "Go to" pages.
    const all = [...commands.filter((c) => c.group === "Actions"), ...commands.filter((c) => c.group === "Go to")];
    sections.push({ name: "Actions", entries: text ? rank(all, text, 20) : all });
  } else if (!text) {
    if (recent.length) sections.push({ name: "Recent", entries: recent.slice(0, RECENT_MAX) });
    sections.push({ name: "Actions", entries: DEFAULT_ACTIONS.map((id) => commands.find((c) => c.id === id)).filter((c): c is PaletteEntry => !!c) });
  } else {
    for (const [name, group] of RESULT_GROUPS) {
      const entries = hits.filter((h) => h.group === group);
      if (entries.length) sections.push({ name, entries });
    }
    const actions = rank(commands.filter(isCommand), text, 6);
    if (actions.length) sections.push({ name: "Actions", entries: actions });
  }
  return sections.filter((s) => s.entries.length);
}

export const flatten = (sections: PaletteSection[]) => sections.flatMap((s) => s.entries);

/* ---------------------------------------------------------------- recent items (kept per user, in this browser) */

export const RECENT_MAX = 5;
export const recentKey = (email: string) => `oz_palette_recent:${email.toLowerCase()}`;
const OPENABLE = new Set<PaletteEntry["group"]>(["Clients", "Posts", "Leads", "Shoots"]);

/** Adds an opened client, post, lead or shoot to the front (no duplicates, at most five). Commands are not kept. */
export function pushRecent(list: PaletteEntry[], e: PaletteEntry): PaletteEntry[] {
  if (!OPENABLE.has(e.group)) return list;
  const { id, group, label, hint, href, icon } = e;
  return [{ id, group, label, hint, href, icon }, ...list.filter((x) => x.href !== e.href)].slice(0, RECENT_MAX);
}

/** Reads the stored list, ignoring anything malformed. */
export function parseRecent(raw: string | null): PaletteEntry[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((e) => e && typeof e.href === "string" && e.href.startsWith("/admin/") && typeof e.label === "string" && OPENABLE.has(e.group))
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------- keys */

export type PaletteKeyResult = { kind: "move"; sel: number } | { kind: "open"; sel: number } | { kind: "close" } | null;

/** ↑/↓ move (wrapping), Home/End jump, Enter opens the selected row, Esc closes. */
export function paletteKey(key: string, sel: number, count: number): PaletteKeyResult {
  if (key === "Escape") return { kind: "close" };
  if (!count) return null;
  const cur = Math.min(Math.max(sel, 0), count - 1);
  if (key === "ArrowDown") return { kind: "move", sel: (cur + 1) % count };
  if (key === "ArrowUp") return { kind: "move", sel: (cur - 1 + count) % count };
  if (key === "Home") return { kind: "move", sel: 0 };
  if (key === "End") return { kind: "move", sel: count - 1 };
  if (key === "Enter") return { kind: "open", sel: cur };
  return null;
}

/** Puts focus back on whatever opened the palette (if it is still on the page). */
export function returnFocus(el: { focus?: (o?: { preventScroll?: boolean }) => void; isConnected?: boolean } | null | undefined): boolean {
  if (!el || el.isConnected === false || typeof el.focus !== "function") return false;
  el.focus({ preventScroll: true });
  return true;
}
