"use client";

/** Opens the browser's print dialog (choose "Save as PDF" for a PDF). */
export function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink print:hidden">
      {label}
    </button>
  );
}
