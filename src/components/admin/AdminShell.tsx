/*
 * Every admin page imports this module. It must keep using next/image and next/link: Turbopack groups the shared
 * framework chunks by which pages use them, and dropping these imports from all admin pages moves Next's router
 * code into a chunk every PUBLIC page loads (+5 KB). A test guards this (auth-protection.test.ts).
 */
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Page header: Fraunces title (24/28 px), one line of context, and the page's actions on the right. */
/** Section pages whose title the phone top bar already shows (the heading stays for screen readers). */
const REPEATS_TOP_BAR = new Set(["Today", "Calendar", "Clients", "Shoots", "Team", "Leads", "Reports", "Images", "Payments", "Settings", "Users", "Activity", "Account"]);

export function AdminTitle({ title, intro, actions, crumb }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode; crumb?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {crumb && <p className="mb-1 text-[13px] text-muted">{crumb}</p>}
        <h1 className={`font-display text-[24px] leading-[30px] tracking-[-0.01em] md:text-[28px] md:leading-[34px] ${typeof title === "string" && REPEATS_TOP_BAR.has(title) ? "max-md:sr-only" : ""}`}>{title}</h1>
        {intro && <p className="mt-1 max-w-3xl text-[14px] text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const badge: Record<string, string> = {
  empty: "bg-neutral-bg text-neutral",
  review: "bg-warn-bg text-warn",
  live: "bg-ok-bg text-ok",
  archived: "bg-neutral-bg text-neutral",
  uploaded: "bg-warn-bg text-warn",
};
const badgeLabel: Record<string, string> = {
  empty: "Empty",
  review: "Uploaded – needs review",
  uploaded: "Needs review",
  live: "Live",
  archived: "Earlier version",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[12px] font-semibold ${badge[status] ?? badge.empty}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />{badgeLabel[status] ?? status}</span>;
}

export const sourceLabel = (s: string) => (s === "real" ? "Real photo" : "AI illustrative");

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const cls = tone === "error" ? "border-bad/30 bg-bad-bg text-bad" : tone === "ok" ? "border-ok/25 bg-ok-bg text-ok" : "border-gold-500/40 bg-gold-100/50 text-ink";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[14px] ${cls}`}>{children}</p>;
}

export const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";

/** The Oryza mark linking home (used by full-screen admin pages). */
export function BrandMark() {
  return (
    <Link href="/admin/today" className="inline-flex items-center gap-2" aria-label="Oryza admin — Today">
      <Image src="/brand/oryza-icon.png" alt="" width={28} height={28} />
    </Link>
  );
}
