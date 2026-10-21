"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Admin } from "@/lib/admin/types";
import type { ShellCounts } from "@/lib/admin/shell-data";
import { CommandPalette } from "./CommandPalette";
import { Drawer } from "./Drawer";
import { Icon } from "./Icon";
import { accountLinksFor, activeHref, moreFor, navFor, TAB_BAR, titleFor, type NavItem } from "./nav";
import { commandsFor } from "./palette";
import { QuickAdd } from "./QuickAdd";
import { ShortcutHelp, ShortcutHost } from "./ShortcutKeys";
import { ToastProvider } from "./Toasts";
import { ConfirmProvider } from "./Confirm";
import { useStored } from "../ui/useStored";

const countOf = (i: NavItem, c: ShellCounts) => (i.count ? c[i.count] : 0);
const NAV_COOKIE = "oz_nav";

function CountPill({ n, tone = "muted" }: { n: number; tone?: "muted" | "bad" }) {
  if (!n) return null;
  return <span className={`ml-auto rounded-full px-1.5 text-[11px] font-bold leading-5 tabular-nums ${tone === "bad" ? "bg-bad text-white" : "bg-white/10"}`}>{n > 99 ? "99+" : n}</span>;
}

function Sidebar({ admin, counts, collapsed, onToggle }: { admin: Admin; counts: ShellCounts; collapsed: boolean; onToggle: () => void }) {
  const path = usePathname();
  const groups = navFor(admin.role);
  const active = activeHref(path, groups.flatMap((g) => g.items.map((i) => i.href)));
  return (
    <aside aria-label="Admin" className={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-text md:flex ${collapsed ? "w-[72px]" : "w-[248px]"}`}>
      <Link href="/admin/today" className="mb-2 flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-paper" aria-label="Oryza admin — Today">
        <Image src="/brand/oryza-icon.png" alt="" width={28} height={28} className="shrink-0" />
        {!collapsed && <span className="font-display text-[18px]">Oryza</span>}
      </Link>
      {groups.map((g) => (
        <div key={g.label} className="mt-3">
          {!collapsed && <p className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8d938f]">{g.label}</p>}
          <ul>
            {g.items.map((i) => {
              const on = active === i.href;
              const n = countOf(i, counts);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={on ? "page" : undefined}
                    title={collapsed ? i.label : undefined}
                    className={`relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-semibold transition-colors ${on ? "bg-white/[0.08] text-gold-300 before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-gold-300" : "hover:bg-white/[0.05] hover:text-paper"}`}
                  >
                    <Icon name={i.icon} />
                    {collapsed ? n > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold-300" aria-label={`${n}`} /> : <><span className="truncate">{i.label}</span><CountPill n={n} tone={i.count === "overdue" ? "bad" : "muted"} /></>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <button type="button" onClick={onToggle} aria-pressed={collapsed} className="mt-auto flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] hover:bg-white/[0.05]" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <Icon name={collapsed ? "chevron" : "left"} />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}

function useClickAway(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", h);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", h);
    };
  }, [open, close]);
  return ref;
}

interface Note {
  id: string;
  kind: "approved" | "changes" | "lead" | "overdue";
  text: string;
  at: string;
  href: string;
}
const SEEN = "oz_notes_seen";
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

function Notifications({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: Note[]; overdue: number } | null>(null);
  const [seenAt, setSeen] = useStored(SEEN);
  const seen = seenAt ?? "";
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway(open, close);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/notifications");
      if (res.ok) setData(await res.json());
    } catch {
      /* offline */
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 800);
    return () => clearTimeout(t);
  }, [load]);
  const unread = (data?.items ?? []).filter((n) => n.at > seen).length;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unread ? ` (${unread} new)` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open) {
            void load();
            const now = new Date().toISOString();
            setTimeout(() => setSeen(now), 1500);
          }
        }}
        className={`relative grid place-items-center rounded-lg hover:bg-surface-2 ${compact ? "h-11 w-11" : "h-10 w-10"}`}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-canvas" />}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-14 z-40 max-h-[70vh] overflow-y-auto rounded-xl border border-edge bg-surface p-2 shadow-float md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[380px]">
          <p className="px-2 pb-1 pt-1 text-[13px] font-semibold">Notifications</p>
          {data?.overdue ? (
            <Link href="/admin/today?f=overdue" onClick={close} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-[14px] hover:bg-surface-2">
              <span className="h-2 w-2 rounded-full bg-bad" /> {data.overdue} overdue task{data.overdue > 1 ? "s" : ""}
            </Link>
          ) : null}
          {!data && <p className="px-2 py-4 text-[14px] text-muted">Loading…</p>}
          {data && !data.items.length && !data.overdue && <p className="px-2 py-4 text-[14px] text-muted">Nothing new this week.</p>}
          {data?.items.map((n) => (
            <Link key={n.id} href={n.href} onClick={close} className="flex min-h-11 items-start gap-2 rounded-lg px-2 py-2 text-[14px] hover:bg-surface-2">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.kind === "changes" ? "bg-warn" : n.kind === "lead" ? "bg-info" : "bg-ok"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block ${n.at > seen ? "font-semibold" : ""}`}>{n.text}</span>
                <span className="text-[12px] text-muted">{ago(n.at)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Menu({ label, button, children }: { label: string; button: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway(open, close);
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-10 items-center rounded-lg hover:bg-surface-2">{button}</button>
      {open && <div role="menu" className="absolute right-0 top-12 z-40 w-60 rounded-xl border border-edge bg-surface p-1.5 shadow-float">{children(close)}</div>}
    </div>
  );
}
const menuItem = "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[14px] hover:bg-surface-2";

function TopBar({ admin, onPalette, onHelp, onQuickAdd }: { admin: Admin; onPalette: () => void; onHelp: () => void; onQuickAdd: () => void }) {
  const initials = admin.email.slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 hidden h-[60px] items-center gap-3 border-b border-edge bg-canvas/90 px-6 backdrop-blur md:flex">
      <button type="button" onClick={onPalette} className="flex min-h-10 w-full max-w-[520px] items-center gap-2 rounded-lg border border-edge-strong bg-surface px-3 text-left text-[14px] text-placeholder" aria-label="Search or jump to (Ctrl K)">
        <Icon name="search" />
        <span className="flex-1">Search clients, posts, leads, shoots…</span>
        <kbd className="rounded border border-b-2 border-edge px-1.5 text-[11px] font-semibold text-muted">Ctrl K</kbd>
      </button>
      <span className="flex-1" />
      <Menu label="Create" button={<span className="flex min-h-10 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[14px] font-semibold text-paper"><Icon name="plus" size={16} />New</span>}>
        {(close) => (
          <>
            <Link role="menuitem" href="/admin/clients/new" onClick={close} className={menuItem}><Icon name="clients" />New client</Link>
            <Link role="menuitem" href="/admin/clients?next=approvals" onClick={close} className={menuItem}><Icon name="check" />Send for approval…</Link>
            <button role="menuitem" type="button" onClick={() => { close(); onQuickAdd(); }} className={menuItem}><Icon name="upload" />Upload to a post…</button>
            <Link role="menuitem" href="/admin/team#leave" onClick={close} className={menuItem}><Icon name="team" />Add leave</Link>
          </>
        )}
      </Menu>
      <Notifications />
      <Menu label="Account menu" button={<span className="grid h-8 w-8 place-items-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">{initials}</span>}>
        {(close) => (
          <>
            <p className="truncate px-2.5 pb-1 pt-1.5 text-[13px] text-muted" title={admin.email}>{admin.email} · <span className="capitalize">{admin.role}</span></p>
            {accountLinksFor(admin.role).map((l) => <Link key={l.href} role="menuitem" href={l.href} onClick={close} className={menuItem}><Icon name={l.icon} />{l.label}</Link>)}
            <button role="menuitem" type="button" onClick={() => { close(); onHelp(); }} className={menuItem}><Icon name="keyboard" />Keyboard shortcuts</button>
            <a role="menuitem" href="/" target="_blank" rel="noopener" className={menuItem}><Icon name="external" />View the website</a>
            <form action="/admin/auth/signout" method="post"><button role="menuitem" className={menuItem}><Icon name="logout" />Sign out</button></form>
          </>
        )}
      </Menu>
    </header>
  );
}

function MobileTop({ onPalette }: { onPalette: () => void }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-edge bg-canvas/95 pl-4 pr-1 backdrop-blur md:hidden">
      <p className="min-w-0 flex-1 truncate font-display text-[20px]">{titleFor(path)}</p>
      <button type="button" onClick={onPalette} aria-label="Search" className="grid h-11 w-11 place-items-center rounded-lg"><Icon name="search" size={20} /></button>
      <Notifications compact />
    </header>
  );
}

function TabBar({ counts, onMore, moreOpen }: { counts: ShellCounts; onMore: () => void; moreOpen: boolean }) {
  const path = usePathname();
  const active = activeHref(path, TAB_BAR.map((t) => t.href));
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(60px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-edge bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {TAB_BAR.map((t) => {
        const on = active === t.href && !moreOpen;
        const n = countOf(t, counts);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${on ? "text-ink" : "text-muted"}`}>
            <span className={`relative ${on ? "text-gold-700" : ""}`}>
              <Icon name={t.icon} size={22} />
              {n > 0 && <span aria-hidden="true" className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-bad px-1 text-center text-[10px] font-bold leading-4 text-white">{n > 99 ? "99+" : n}</span>}
            </span>
            {t.label}
            {n > 0 && <span className="sr-only">{` (${n} ${t.count === "overdue" ? "overdue" : "new"})`}</span>}
          </Link>
        );
      })}
      <button type="button" onClick={onMore} aria-expanded={moreOpen} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${moreOpen ? "text-ink" : "text-muted"}`}>
        <Icon name="more" size={22} />More
      </button>
    </nav>
  );
}

/** Pull down at the top of a phone screen to reload its data. */
function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let dist = 0;
    const down = (e: TouchEvent) => {
      start = window.scrollY <= 0 && !document.querySelector('[aria-modal="true"]') ? e.touches[0].clientY : null;
      dist = 0;
    };
    const move = (e: TouchEvent) => {
      if (start === null) return;
      dist = Math.max(0, Math.min(120, e.touches[0].clientY - start));
      setPull(dist);
    };
    const up = () => {
      if (start !== null && dist > 80) router.refresh();
      start = null;
      setPull(0);
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [router]);
  if (pull < 10) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-14 z-20 flex justify-center md:hidden" style={{ transform: `translateY(${pull / 3}px)` }}>
      <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-semibold shadow-float">{pull > 80 ? "Release to refresh" : "Pull to refresh"}</span>
    </div>
  );
}

/** The admin app shell (client half): navigation, search, quick add, shortcuts, toasts. */
export function Shell({ admin, counts, collapsed: initialCollapsed, children }: { admin: Admin; counts: ShellCounts; collapsed: boolean; children: ReactNode }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const [more, setMore] = useState(false);
  const [quick, setQuick] = useState(false);
  const openPalette = useCallback(() => setPalette(true), []);
  const openHelp = useCallback(() => setHelp(true), []);
  // Moving to another page closes the More sheet.
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMore(false);
  }
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${NAV_COOKIE}=${next ? "c" : "o"}; path=/admin; max-age=31536000; samesite=lax`;
  };
  return (
    <ToastProvider>
      <ConfirmProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[90] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
      <div className="flex min-h-dvh">
        <Sidebar admin={admin} counts={counts} collapsed={collapsed} onToggle={toggle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar admin={admin} onPalette={openPalette} onHelp={openHelp} onQuickAdd={() => setQuick(true)} />
          <MobileTop onPalette={openPalette} />
          <main id="main" className="mx-auto w-full min-w-0 max-w-[1360px] flex-1 px-4 pb-[calc(140px+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-12 md:pt-6">{children}</main>
        </div>
      </div>
      <TabBar counts={counts} onMore={() => setMore(true)} moreOpen={more} />
      {!/^\/admin\/(items|shoots|clients)\/[^/]+/.test(path) && (
        <button type="button" onClick={() => setQuick(true)} aria-label="Quick add: upload from camera, add a note, new client" className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-ink text-paper shadow-float md:hidden">
          <Icon name="plus" size={26} />
        </button>
      )}
      <Drawer open={more} onClose={() => setMore(false)} title="More">
        <ul className="grid grid-cols-2 gap-2">
          {moreFor(admin.role).map((i) => (
            <li key={i.href}><Link href={i.href} className="flex min-h-14 items-center gap-2.5 rounded-xl border border-edge bg-surface px-3 text-[15px] font-semibold"><Icon name={i.icon} />{i.label}</Link></li>
          ))}
        </ul>
        <form action="/admin/auth/signout" method="post" className="mt-6"><button className="flex min-h-11 items-center gap-2 text-[15px] font-semibold text-bad"><Icon name="logout" />Sign out</button></form>
        <p className="mt-2 text-[13px] text-muted">{admin.email} · <span className="capitalize">{admin.role}</span></p>
      </Drawer>
      {quick && <QuickAdd open onClose={() => setQuick(false)} />}
      {palette && <CommandPalette open onClose={() => setPalette(false)} commands={commandsFor(admin.role)} onHelp={openHelp} />}
      <ShortcutHelp open={help} onClose={() => setHelp(false)} />
      <ShortcutHost onPalette={openPalette} onHelp={openHelp} />
      <PullToRefresh />
      </ConfirmProvider>
    </ToastProvider>
  );
}
