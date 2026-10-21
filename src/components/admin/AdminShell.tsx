import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Admin } from "@/lib/admin/types";
import { AdminNav, type NavItem } from "./AdminNav";

export function adminNav(admin: Pick<Admin, "role">): NavItem[] {
  return [
    { href: "/admin", label: "Overview" },
    { href: "/admin/today", label: "Today" },
    { href: "/admin/calendar", label: "Calendar" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/images", label: "Images" },
    ...(admin.role === "owner" ? [{ href: "/admin/users", label: "Users" }, { href: "/admin/settings", label: "Settings" }] : []),
    { href: "/admin/audit", label: "Activity" },
    { href: "/admin/account", label: "Account" },
  ];
}

/** Admin frame: ink sidebar (desktop) / top bar (phone), signed-in user and sign out. */
export function AdminShell({ admin, children }: { admin: Admin; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-ink px-4 pb-3 pt-4 text-paper md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:px-5 md:py-7">
        <div className="mb-3 flex items-center justify-between md:mb-8 md:block">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Oryza admin — overview">
            <Image src="/brand/oryza-icon.png" alt="" width={28} height={28} />
            <span className="font-display text-lg">Oryza admin</span>
          </Link>
          <form action="/admin/auth/signout" method="post" className="md:hidden">
            <button className="rounded-full border border-paper/25 px-3 py-1.5 text-[13px] text-paper/85">Sign out</button>
          </form>
        </div>
        <AdminNav items={adminNav(admin)} />
        <div className="mt-auto hidden pt-8 text-[13px] text-paper/60 md:block">
          <p className="truncate" title={admin.email}>{admin.email}</p>
          <p className="capitalize text-gold-300">{admin.role}</p>
          <form action="/admin/auth/signout" method="post" className="mt-3">
            <button className="rounded-full border border-paper/25 px-4 py-1.5 text-paper/85 hover:border-paper">Sign out</button>
          </form>
          <Link href="/" className="mt-4 block underline-offset-4 hover:underline">View the website ↗</Link>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 md:py-10">{children}</main>
    </div>
  );
}

export function AdminTitle({ title, intro, actions }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-[15px] text-muted">{intro}</p>}
      </div>
      {actions}
    </header>
  );
}

const badge: Record<string, string> = {
  empty: "border border-line text-muted",
  review: "bg-gold-100 text-gold-700",
  live: "bg-ink text-paper",
  archived: "border border-line text-muted",
  uploaded: "bg-gold-100 text-gold-700",
};
const badgeLabel: Record<string, string> = {
  empty: "Empty",
  review: "Uploaded – needs review",
  uploaded: "Needs review",
  live: "Live",
  archived: "Earlier version",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${badge[status] ?? badge.empty}`}>{badgeLabel[status] ?? status}</span>;
}

export const sourceLabel = (s: string) => (s === "real" ? "Real photo" : "AI illustrative");

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const cls = tone === "error" ? "border-red-800/30 bg-red-50 text-red-900" : tone === "ok" ? "border-ink/20 bg-cream text-ink" : "border-gold-500/40 bg-gold-100/50 text-ink";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[14px] ${cls}`}>{children}</p>;
}

export const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
