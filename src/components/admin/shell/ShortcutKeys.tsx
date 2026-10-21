"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./Drawer";
import { matchShortcut, SHORTCUTS } from "./shortcuts";

/** Listens for desktop shortcuts. List screens receive J/K/Enter/X as "admin:shortcut" events. */
export function ShortcutHost({ onPalette, onHelp }: { onPalette: () => void; onHelp: () => void }) {
  const router = useRouter();
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.querySelector('[aria-modal="true"]') && !((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) return;
      const { action, pending: next } = matchShortcut({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, target: e.target as HTMLElement }, pending.current);
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      if (next) timer.current = setTimeout(() => (pending.current = null), 1200);
      if (!action) return;
      e.preventDefault();
      if (action.kind === "palette" || action.kind === "search") onPalette();
      else if (action.kind === "help") onHelp();
      else if (action.kind === "go") router.push(action.href);
      else window.dispatchEvent(new CustomEvent("admin:shortcut", { detail: action.name }));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPalette, onHelp, router]);
  return null;
}

/** The "?" panel. */
export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups = [...new Set(SHORTCUTS.map((s) => s.group))];
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" footer={<button type="button" data-autofocus onClick={onClose} className="min-h-10 rounded-lg bg-ink px-4 text-[14px] font-semibold text-paper">Close</button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{g}</p>
            <dl className="space-y-1">
              {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-3">
                  <dt className="text-[13px]">{s.label}</dt>
                  <dd className="flex gap-1">{s.keys.map((k) => <kbd key={k} className="rounded border border-b-2 border-edge px-1.5 text-[11px] font-semibold text-muted">{k === "Ctrl" ? "Ctrl/⌘" : k}</kbd>)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-muted">Two-key shortcuts (G then T) are pressed one after the other. Shortcuts never fire while you type in a field.</p>
    </Dialog>
  );
}
