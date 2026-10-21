"use client";

import { useState } from "react";

/** wa.me link with a prefilled message (optionally to a number). Opens WhatsApp; nothing is sent automatically. */
export const waLink = (text: string, phone?: string) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
};

export function WhatsAppShare({ text, phone, label = "WhatsApp", onShare, className }: { text: string; phone?: string; label?: string; onShare?: () => void; className?: string }) {
  return (
    <a href={waLink(text, phone)} target="_blank" rel="noopener noreferrer" onClick={onShare} className={className ?? "inline-flex items-center rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper"}>
      {label}
    </a>
  );
}

export function CopyLink({ url, onCopy, className }: { url: string; onCopy?: () => void; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          onCopy?.();
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy the link:", url);
        }
      }}
      className={className ?? "rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink"}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
