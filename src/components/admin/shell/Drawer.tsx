"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `root` and returns focus to the opener on close. Exported for tests. */
export function trapTab(e: { key: string; shiftKey: boolean; preventDefault: () => void }, root: HTMLElement, active: Element | null) {
  if (e.key !== "Tab") return;
  const els = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
  if (!els.length) return;
  const first = els[0];
  const last = els[els.length - 1];
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * A side drawer on desktop and a full-screen sheet on phones (same markup, CSS decides). Modal: focus is trapped,
 * Escape and the backdrop close it, focus returns to where it was.
 */
export function Drawer({ open, onClose, title, subtitle, badge, children, footer, width = 560 }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (panel.current) trapTab(e, panel.current, document.activeElement);
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ ["--w" as string]: `${width}px` }}
        className="absolute inset-0 flex animate-rise flex-col bg-surface shadow-modal md:inset-y-0 md:left-auto md:right-0 md:w-[min(var(--w),100vw)] md:rounded-l-2xl"
      >
        <div className="flex items-start gap-2 border-b border-edge py-2 pl-4 pr-2 md:pl-5">
          <div className="min-w-0 flex-1 py-1.5">
            {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
            <h2 className="truncate text-[16px] font-semibold leading-[22px]">{title}</h2>
          </div>
          {badge && <span className="mt-2">{badge}</span>}
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-surface-2 md:h-10 md:w-10">
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-2 border-t border-edge bg-surface px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:px-5 md:pb-3 [&>*]:max-md:flex-1">{footer}</div>}
      </div>
    </div>
  );
}

/** A small centred dialog for the confirmations that remain (destructive or irreversible actions only). */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    (panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (panel.current) trapTab(e, panel.current, document.activeElement);
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      opener?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-end p-0 md:place-items-center md:p-6">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div ref={panel} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" className="relative w-full animate-rise rounded-t-2xl bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-modal md:max-w-md md:rounded-2xl md:pb-5">
        <h2 id="dlg-title" className="text-[17px] font-semibold">{title}</h2>
        <div className="mt-2 text-[14px] text-text-2">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2 [&>*]:max-md:flex-1">{footer}</div>
      </div>
    </div>
  );
}
