/** Command palette: the built-in commands, and ranking for search results. Pure (no React). */
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
  const go: PaletteEntry[] = [...navFor(role).flatMap((g) => g.items), ...accountLinksFor(role)].map((i) => ({ id: `go:${i.href}`, group: "Go to", label: i.label, href: i.href, icon: i.icon }));
  const actions: PaletteEntry[] = [
    { id: "act:new-client", group: "Actions", label: "New client", hint: "Convert a lead or add one directly", href: "/admin/clients/new", icon: "plus", keys: ["N", "C"] },
    { id: "act:approval", group: "Actions", label: "Send for approval…", hint: "Pick the client, then the posts", href: "/admin/clients?next=approvals", icon: "check" },
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
