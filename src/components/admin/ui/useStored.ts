"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * A per-browser preference or draft in localStorage (a remembered layout, the notifications you have seen, an unsaved
 * caption). Server render and first paint use null, so nothing mismatches on hydration; storage that is blocked
 * (private mode) simply reads as null. Pages must work without it.
 */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** `[value, set]`: set(null) removes it. */
export function useStored(key: string): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback(
    (v: string | null) => {
      try {
        if (v === null) localStorage.removeItem(key);
        else localStorage.setItem(key, v);
      } catch {
        /* storage blocked */
      }
      notify();
    },
    [key],
  );
  return [value, set];
}
