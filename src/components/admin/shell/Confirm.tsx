"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog } from "./Drawer";

/*
 * Confirmation for destructive or irreversible actions only (everything reversible gets a toast with Undo).
 * `const ok = await confirm({ title, body, action })` — resolves true when confirmed.
 */
export interface ConfirmInput {
  title: string;
  body?: ReactNode;
  /** The confirm button's label, e.g. "Delete invoice". */
  action: string;
  danger?: boolean;
  cancel?: string;
}

const Ctx = createContext<(c: ConfirmInput) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ConfirmInput | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const ask = useCallback((c: ConfirmInput) => {
    setCurrent(c);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);
  const done = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setCurrent(null);
  };
  return (
    <Ctx.Provider value={ask}>
      {children}
      <Dialog
        open={!!current}
        onClose={() => done(false)}
        title={current?.title ?? ""}
        footer={
          <>
            <button type="button" onClick={() => done(false)} className="min-h-11 rounded-lg border border-edge-strong bg-surface px-4 text-[14px] font-semibold md:min-h-10">{current?.cancel ?? "Cancel"}</button>
            <button type="button" data-autofocus onClick={() => done(true)} className={`min-h-11 rounded-lg px-4 text-[14px] font-semibold text-white md:min-h-10 ${current?.danger ? "bg-bad" : "bg-ink"}`}>{current?.action}</button>
          </>
        }
      >
        {current?.body}
      </Dialog>
    </Ctx.Provider>
  );
}
