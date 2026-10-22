import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { accountLinksFor, activeHref, moreFor, NAV_GROUPS, navFor, TAB_BAR, titleFor } from "./nav";
import { commandsFor, rank, score } from "./palette";
import { matchShortcut, SHORTCUTS } from "./shortcuts";
import { Dialog, Drawer, trapTab } from "./Drawer";
import { Shell } from "./Shell";

const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
const at = (path: string, el: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <PathnameContext.Provider value={path}>{el}</PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );

describe("navigation", () => {
  it("groups the sidebar as briefed: Work, Growth, Content, Business", () => {
    expect(NAV_GROUPS.map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
      ["Work", ["Today", "Calendar", "Clients", "Shoots", "Team"]],
      ["Growth", ["Leads", "Reports"]],
      ["Content", ["Images"]],
      ["Business", ["Payments", "Settings"]],
    ]);
  });

  it("hides owner-only pages from editors (same permissions as before)", () => {
    const editor = navFor("editor").flatMap((g) => g.items.map((i) => i.href));
    expect(editor).not.toContain("/admin/billing");
    expect(editor).not.toContain("/admin/settings");
    expect(navFor("editor").map((g) => g.label)).not.toContain("Business");
    expect(accountLinksFor("editor").map((i) => i.href)).not.toContain("/admin/users");
    expect(navFor("owner").flatMap((g) => g.items).map((i) => i.href)).toEqual(expect.arrayContaining(["/admin/billing", "/admin/settings"]));
  });

  it("marks the right section as current, including detail pages", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(activeHref("/admin/today", hrefs)).toBe("/admin/today");
    expect(activeHref("/admin", hrefs)).toBe("/admin/today");
    expect(activeHref("/admin/clients/abc", hrefs)).toBe("/admin/clients");
    expect(activeHref("/admin/clients/abc/reports/2026-11", hrefs)).toBe("/admin/reports");
    expect(activeHref("/admin/items/xyz", hrefs)).toBe("/admin/calendar");
    expect(activeHref("/admin/shoots/s1", hrefs)).toBe("/admin/shoots");
    expect(activeHref("/admin/clientsx", hrefs)).toBeNull();
  });

  it("titles the phone top bar", () => {
    expect(titleFor("/admin/today")).toBe("Today");
    expect(titleFor("/admin/items/1")).toBe("Post");
    expect(titleFor("/admin/shoots/1")).toBe("Shoot day");
    expect(titleFor("/admin/clients/new")).toBe("New client");
    expect(titleFor("/admin/clients/abc/plans/p1")).toBe("Plan");
    expect(titleFor("/admin/audit")).toBe("Activity log");
  });

  it("puts everything not in the tab bar under More", () => {
    const more = moreFor("owner").map((i) => i.label);
    for (const t of TAB_BAR) expect(more).not.toContain(t.label);
    expect(more).toEqual(expect.arrayContaining(["Shoots", "Team", "Reports", "Images", "Payments", "Settings", "Account", "Users", "Activity log"]));
    expect(moreFor("editor").map((i) => i.label)).not.toContain("Payments");
  });

  it("the old Overview redirects to Today", () => {
    const src = readFileSync(join(process.cwd(), "src/app/admin/(panel)/page.tsx"), "utf8");
    expect(src).toMatch(/redirect\(.*\/admin\/today/);
  });
});

describe("mobile tab bar", () => {
  it("has Today, Calendar, Clients, Leads and More, with counts, and marks the current tab", () => {
    expect(TAB_BAR.map((t) => t.label)).toEqual(["Today", "Calendar", "Clients", "Leads"]);
    const html = at("/admin/clients/abc", <Shell admin={{ email: "owner@oryza.test", role: "owner" }} counts={{ overdue: 4, newLeads: 2, reviewImages: 0 }} collapsed={false}><p>Body</p></Shell>);
    const bar = html.slice(html.lastIndexOf('<nav aria-label="Main"'));
    for (const l of ["Today", "Calendar", "Clients", "Leads", "More"]) expect(bar).toContain(l);
    expect(bar).toMatch(/aria-current="page"[^>]*href="\/admin\/clients"|href="\/admin\/clients"[^>]*aria-current="page"/);
    expect(bar).toContain("(4 overdue)");
    expect(bar).toContain("(2 new)");
    expect(bar).toContain('aria-expanded="false"');
    // Every tab is a full-height cell of a 60px bar (tap targets well over 44px).
    expect(bar).toContain("h-[calc(60px+env(safe-area-inset-bottom))]");
  });

  it("renders the skip link, desktop sidebar and the page body", () => {
    const html = at("/admin/today", <Shell admin={{ email: "editor@oryza.test", role: "editor" }} counts={{ overdue: 0, newLeads: 0, reviewImages: 0 }} collapsed={false}><p>Body</p></Shell>);
    expect(html).toContain('href="#main"');
    expect(html).toContain('id="main"');
    expect(html).toContain("<p>Body</p>");
    expect(html).not.toContain('href="/admin/settings"');
  });
});

describe("command palette", () => {
  it("offers navigation and actions for the role", () => {
    const owner = commandsFor("owner").map((c) => c.label);
    expect(owner).toEqual(expect.arrayContaining(["Go to Today", "Go to Payments", "New client", "Send for approval", "Keyboard shortcuts"]));
    expect(commandsFor("editor").map((c) => c.label)).not.toContain("Go to Payments");
  });

  it("scores exact, prefix, word and fuzzy matches in that order", () => {
    expect(score("Calendar", "calendar")).toBe(0);
    expect(score("Calendar", "cal")).toBe(1);
    expect(score("Open the content board", "board")).toBe(2);
    expect(score("Calendar", "end")).toBe(3);
    expect(score("Calendar", "cldr")).toBe(4);
    expect(score("Calendar", "zz")).toBeNull();
  });

  it("ranks results and shows only navigation and actions with an empty query", () => {
    const entries = [...commandsFor("owner"), { id: "c:1", group: "Clients" as const, label: "Sample Clinic", href: "/admin/clients/1", icon: "clients" as const }];
    expect(rank(entries, "").some((e) => e.group === "Clients")).toBe(false);
    expect(rank(entries, "clinic")[0].label).toBe("Sample Clinic");
    expect(rank(entries, "lea")[0].label).toBe("Go to Leads");
    expect(rank(entries, "", 3)).toHaveLength(3);
  });
});

describe("keyboard shortcuts", () => {
  const press = (key: string, pending: string | null = null, extra: object = {}) => matchShortcut({ key, ...extra }, pending);

  it("Ctrl/⌘+K opens the palette, even while typing", () => {
    expect(press("k", null, { ctrlKey: true }).action).toEqual({ kind: "palette" });
    expect(press("K", null, { metaKey: true, target: { tagName: "INPUT" } }).action).toEqual({ kind: "palette" });
  });

  it("two-key sequences go to pages", () => {
    const first = press("g");
    expect(first).toEqual({ action: null, pending: "g" });
    expect(press("t", first.pending).action).toEqual({ kind: "go", href: "/admin/today" });
    expect(press("b", "g").action).toEqual({ kind: "go", href: "/admin/calendar?view=board" });
    expect(press("c", "n").action).toEqual({ kind: "go", href: "/admin/clients/new" });
    expect(press("z", "g")).toEqual({ action: null, pending: null });
  });

  it("single keys: ? help, / search, J/K/Enter/X for lists", () => {
    expect(press("?").action).toEqual({ kind: "help" });
    expect(press("/").action).toEqual({ kind: "search" });
    expect(press("j").action).toEqual({ kind: "event", name: "next" });
    expect(press("k").action).toEqual({ kind: "event", name: "prev" });
    expect(press("Enter").action).toEqual({ kind: "event", name: "open" });
    expect(press("x").action).toEqual({ kind: "event", name: "done" });
  });

  it("never fires while typing in a field or with modifier keys", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) expect(press("g", null, { target: { tagName } })).toEqual({ action: null, pending: null });
    expect(press("j", null, { target: { isContentEditable: true } }).action).toBeNull();
    expect(press("j", null, { altKey: true }).action).toBeNull();
  });

  it("every shortcut in the help panel is reachable and unique", () => {
    const seen = new Set<string>();
    for (const s of SHORTCUTS) {
      const id = s.keys.join("+").toLowerCase();
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
      const r = s.type === "chord" ? press(s.keys[1].toLowerCase(), null, { ctrlKey: true }) : s.type === "sequence" ? press(s.keys[1], s.keys[0].toLowerCase()) : press(s.keys[0]);
      expect(r.action, id).toEqual(s.action);
    }
  });
});

describe("drawer and sheet", () => {
  const el = () => ({ focus: vi.fn(), hasAttribute: () => false });

  it("traps Tab inside the panel in both directions", () => {
    const [a, b, c] = [el(), el(), el()];
    const root = { querySelectorAll: () => [a, b, c], contains: (x: unknown) => [a, b, c].includes(x as never) } as unknown as HTMLElement;
    const ev = (shiftKey: boolean) => ({ key: "Tab", shiftKey, preventDefault: vi.fn() });
    const fwd = ev(false);
    trapTab(fwd, root, c as never);
    expect(fwd.preventDefault).toHaveBeenCalled();
    expect(a.focus).toHaveBeenCalled();
    const back = ev(true);
    trapTab(back, root, a as never);
    expect(c.focus).toHaveBeenCalled();
    const mid = ev(false);
    trapTab(mid, root, b as never);
    expect(mid.preventDefault).not.toHaveBeenCalled();
    const other = { key: "Escape", shiftKey: false, preventDefault: vi.fn() };
    trapTab(other, root, c as never);
    expect(other.preventDefault).not.toHaveBeenCalled();
  });

  it("is a modal dialog: full-screen sheet on phones, right-hand drawer from md up, with a 44px close button", () => {
    const html = renderToStaticMarkup(<Drawer open onClose={() => undefined} title="Meet our doctors" subtitle="Sample Clinic" footer={<button>Save</button>}><p>Body</p></Drawer>);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Meet our doctors"');
    expect(html).toMatch(/class="absolute inset-0 [^"]*md:right-0[^"]*"/);
    expect(html).toMatch(/aria-label="Close" class="[^"]*h-11 w-11/);
    expect(html).toContain("<p>Body</p>");
    expect(renderToStaticMarkup(<Drawer open={false} onClose={() => undefined} title="x"><p /></Drawer>)).toBe("");
  });

  it("confirm dialogs are alert dialogs", () => {
    const html = renderToStaticMarkup(<Dialog open onClose={() => undefined} title="Delete invoice ORY-1?" footer={<button>Delete invoice</button>}>Gone for good.</Dialog>);
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("Delete invoice ORY-1?");
  });
});

describe("admin shell keeps public bundles unchanged", () => {
  it("AdminShell still imports next/image and next/link (see the comment there)", () => {
    const src = readFileSync(join(process.cwd(), "src/components/admin/AdminShell.tsx"), "utf8");
    expect(src).toMatch(/from "next\/image"/);
    expect(src).toMatch(/from "next\/link"/);
  });

  it("globals.css keeps admin, share and docs out of the public stylesheet", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const p of ["../components/admin", "./admin", "./share", "../lib/admin", "../lib/ops", "../../docs"]) expect(css).toContain(`@source not "${p}"`);
    expect(css).toContain('@source "../styles/public-css-sources.frozen.txt"');
  });
});
