"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy", primary = false }: { text: string; label?: string; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          setDone(false);
        }
      }}
      className={`rounded-full px-5 py-2.5 text-[14px] font-semibold ${primary ? "bg-ink text-paper hover:bg-ink-soft" : "border border-ink/20 hover:border-ink"}`}
    >
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}
