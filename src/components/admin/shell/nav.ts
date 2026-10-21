/** Admin navigation: grouped sidebar, phone tab bar, and which item is current. Pure (no React). */
import type { AdminRole } from "@/lib/admin/types";

export type IconName =
  | "today" | "calendar" | "clients" | "shoots" | "team" | "leads" | "reports" | "images" | "payments" | "settings"
  | "users" | "activity" | "account" | "search" | "bell" | "plus" | "more" | "close" | "menu" | "chevron" | "left"
  | "check" | "upload" | "note" | "logout" | "external" | "keyboard" | "board" | "list";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Shown only to owners. */
  owner?: boolean;
  /** Key for a count badge supplied by the shell (e.g. overdue tasks, new leads). */
  count?: "overdue" | "newLeads" | "reviewImages";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/admin/today", label: "Today", icon: "today", count: "overdue" },
      { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
      { href: "/admin/clients", label: "Clients", icon: "clients" },
      { href: "/admin/shoots", label: "Shoots", icon: "shoots" },
      { href: "/admin/team", label: "Team", icon: "team" },
    ],
  },
  { label: "Growth", items: [{ href: "/admin/leads", label: "Leads", icon: "leads", count: "newLeads" }, { href: "/admin/reports", label: "Reports", icon: "reports" }] },
  { label: "Content", items: [{ href: "/admin/images", label: "Images", icon: "images", count: "reviewImages" }] },
  {
    label: "Business",
    items: [
      { href: "/admin/billing", label: "Payments", icon: "payments", owner: true },
      { href: "/admin/settings", label: "Settings", icon: "settings", owner: true },
    ],
  },
];

/** Account-level links (user menu, and the More sheet on phones). */
export const ACCOUNT_LINKS: NavItem[] = [
  { href: "/admin/account", label: "Account", icon: "account" },
  { href: "/admin/users", label: "Users", icon: "users", owner: true },
  { href: "/admin/audit", label: "Activity log", icon: "activity" },
];

/** The phone tab bar: four destinations and "More". */
export const TAB_BAR: NavItem[] = [
  { href: "/admin/today", label: "Today", icon: "today", count: "overdue" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
  { href: "/admin/clients", label: "Clients", icon: "clients" },
  { href: "/admin/leads", label: "Leads", icon: "leads", count: "newLeads" },
];

export function navFor(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.owner || role === "owner") })).filter((g) => g.items.length);
}

export const accountLinksFor = (role: AdminRole) => ACCOUNT_LINKS.filter((i) => !i.owner || role === "owner");

/** Everything reachable from the More sheet on phones (the nav minus the tab bar, plus account links). */
export function moreFor(role: AdminRole): NavItem[] {
  const inTabs = new Set(TAB_BAR.map((t) => t.href));
  return [...navFor(role).flatMap((g) => g.items).filter((i) => !inTabs.has(i.href)), ...accountLinksFor(role)];
}

/**
 * The current item for a path: the longest nav href that the path starts with. Content items, shoots and
 * reports opened from elsewhere still highlight their section.
 */
export function activeHref(path: string, hrefs: string[]): string | null {
  const alias: [RegExp, string][] = [
    [/^\/admin\/items\//, "/admin/calendar"],
    [/^\/admin\/clients\/[^/]+\/reports/, "/admin/reports"],
    [/^\/admin\/?$/, "/admin/today"],
  ];
  for (const [re, to] of alias) if (re.test(path) && hrefs.includes(to)) return to;
  const hit = hrefs.filter((h) => path === h || path.startsWith(`${h}/`)).sort((a, b) => b.length - a.length)[0];
  return hit ?? null;
}

/** The page title for the phone top bar. */
export function titleFor(path: string): string {
  const all = [...NAV_GROUPS.flatMap((g) => g.items), ...ACCOUNT_LINKS];
  const hit = activeHref(path, all.map((i) => i.href));
  if (/^\/admin\/items\//.test(path)) return "Post";
  if (/^\/admin\/shoots\/[^/]+/.test(path)) return "Shoot day";
  if (/^\/admin\/clients\/new/.test(path)) return "New client";
  if (/^\/admin\/clients\/[^/]+\/plans\//.test(path)) return "Plan";
  return all.find((i) => i.href === hit)?.label ?? "Oryza admin";
}
