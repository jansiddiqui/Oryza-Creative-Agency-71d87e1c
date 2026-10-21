"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/*
 * Toasts: short confirmations that float (no layout shift) and offer Undo for reversible actions.
 * Confirm dialogs are kept for destructive or irreversible actions only.
 */
export interface ToastInput {
  message: string;
  tone?: "default" | "error";
  /** Runs the reverse action; the toast then says "Undone" (or the error). */
  undo?: () => Promise<{ ok: boolean; error?: string } | void> | void;
  /** ms before it disappears (Undo toasts stay longer). */
  duration?: number;
}
interface Toast extends ToastInput {
  id: number;
}

const Ctx = createContext<{ show: (t: ToastInput | string) => void }>({ show: () => undefined });

/** Show a toast from anywhere inside the admin shell. */
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const show = useCallback((input: ToastInput | string) => {
    const t: Toast = { ...(typeof input === "string" ? { message: input } : input), id: ++seq.current };
    setToasts((all) => [...all.slice(-2), t]);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div role="region" aria-label="Notifications" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-stretch gap-2 md:inset-x-auto md:bottom-6 md:left-6 md:w-[420px]">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} replace={show} />)}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose, replace }: { toast: Toast; onClose: () => void; replace: (t: ToastInput) => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const id = setTimeout(onClose, toast.duration ?? (toast.undo ? 6000 : 3000));
    return () => clearTimeout(id);
  }, [toast, onClose]);
  return (
    <div className={`pointer-events-auto flex min-h-12 animate-rise items-center gap-3 rounded-xl py-2 pl-4 pr-2 text-[14px] font-semibold shadow-float ${toast.tone === "error" ? "bg-bad text-white" : "bg-ink text-paper"}`}>
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.undo && (
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-lg px-3 font-bold text-gold-300 hover:bg-white/10 md:min-h-9"
          onClick={async () => {
            setBusy(true);
            const res = await toast.undo!();
            onClose();
            replace(res && res.ok === false ? { message: res.error ?? "Could not undo", tone: "error" } : { message: "Undone" });
          }}
        >
          Undo
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-lg text-paper/70 hover:bg-white/10 md:h-9 md:w-9">×</button>
    </div>
  );
}
