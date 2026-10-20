"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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
      className="rounded-full border border-ink/20 px-4 py-1.5 text-[13px] font-semibold hover:border-ink"
    >
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}
