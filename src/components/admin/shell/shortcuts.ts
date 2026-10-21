/** Desktop keyboard shortcuts: definitions (for the "?" panel) and the matcher. Pure (no React). */

export type ShortcutAction =
  | { kind: "palette" }
  | { kind: "help" }
  | { kind: "search" }
  | { kind: "go"; href: string }
  | { kind: "event"; name: string };

export interface Shortcut {
  /** Keys as shown, e.g. ["Ctrl", "K"] or ["G", "T"] (a two-key sequence). */
  keys: string[];
  label: string;
  group: "General" | "Go to" | "Create" | "Lists";
  action: ShortcutAction;
  /** "chord" = held together (Ctrl/⌘ + key); "sequence" = one after the other; "single" = one key. */
  type: "chord" | "sequence" | "single";
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "K"], label: "Search or run a command", group: "General", action: { kind: "palette" }, type: "chord" },
  { keys: ["/"], label: "Search", group: "General", action: { kind: "search" }, type: "single" },
  { keys: ["?"], label: "Show keyboard shortcuts", group: "General", action: { kind: "help" }, type: "single" },
  { keys: ["G", "T"], label: "Today", group: "Go to", action: { kind: "go", href: "/admin/today" }, type: "sequence" },
  { keys: ["G", "C"], label: "Calendar", group: "Go to", action: { kind: "go", href: "/admin/calendar" }, type: "sequence" },
  { keys: ["G", "B"], label: "Board", group: "Go to", action: { kind: "go", href: "/admin/calendar?view=board" }, type: "sequence" },
  { keys: ["G", "K"], label: "Clients", group: "Go to", action: { kind: "go", href: "/admin/clients" }, type: "sequence" },
  { keys: ["G", "L"], label: "Leads", group: "Go to", action: { kind: "go", href: "/admin/leads" }, type: "sequence" },
  { keys: ["G", "S"], label: "Shoots", group: "Go to", action: { kind: "go", href: "/admin/shoots" }, type: "sequence" },
  { keys: ["G", "R"], label: "Reports", group: "Go to", action: { kind: "go", href: "/admin/reports" }, type: "sequence" },
  { keys: ["N", "C"], label: "New client", group: "Create", action: { kind: "go", href: "/admin/clients/new" }, type: "sequence" },
  { keys: ["J"], label: "Next row", group: "Lists", action: { kind: "event", name: "next" }, type: "single" },
  { keys: ["K"], label: "Previous row", group: "Lists", action: { kind: "event", name: "prev" }, type: "single" },
  { keys: ["Enter"], label: "Open the selected row", group: "Lists", action: { kind: "event", name: "open" }, type: "single" },
  { keys: ["X"], label: "Mark the selected task done", group: "Lists", action: { kind: "event", name: "done" }, type: "single" },
];

export interface KeyInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  /** The element that has focus: typing in a field never triggers single-key shortcuts. */
  target?: { tagName?: string; isContentEditable?: boolean } | null;
}

const typing = (t: KeyInput["target"]) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/i.test(t.tagName ?? ""));

/**
 * Feeds one key press. Returns the action to run (if any) and the pending first key of a sequence.
 * `pending` is the previous unfinished sequence key ("g" or "n") or null.
 */
export function matchShortcut(e: KeyInput, pending: string | null): { action: ShortcutAction | null; pending: string | null } {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if ((e.ctrlKey || e.metaKey) && key === "k") return { action: { kind: "palette" }, pending: null };
  if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return { action: null, pending: null };
  if (pending) {
    const hit = SHORTCUTS.find((s) => s.type === "sequence" && s.keys[0].toLowerCase() === pending && s.keys[1].toLowerCase() === key);
    return { action: hit?.action ?? null, pending: null };
  }
  if (SHORTCUTS.some((s) => s.type === "sequence" && s.keys[0].toLowerCase() === key)) return { action: null, pending: key };
  const single = SHORTCUTS.find((s) => s.type === "single" && (s.keys[0] === e.key || s.keys[0].toLowerCase() === key));
  return { action: single?.action ?? null, pending: null };
}
