import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CommandPalette, PALETTE_PLACEHOLDER, PaletteList } from "./CommandPalette";
import { commandsFor, flatten, paletteKey, paletteSections, parseQuery, parseRecent, pushRecent, recentKey, returnFocus, type PaletteEntry } from "./palette";

const cmds = commandsFor("owner");
const hit = (group: PaletteEntry["group"], n: number): PaletteEntry => ({ id: `${group}:${n}`, group, label: `${group} ${n}`, hint: "", href: `/admin/${group.toLowerCase()}/${n}`, icon: "clients" });
const hits = [hit("Shoots", 1), hit("Leads", 1), hit("Clients", 1), hit("Posts", 1), hit("Clients", 2)];

describe("keyboard", () => {
  it("↑/↓ move and wrap, Home/End jump", () => {
    expect(paletteKey("ArrowDown", 0, 3)).toEqual({ kind: "move", sel: 1 });
    expect(paletteKey("ArrowDown", 2, 3)).toEqual({ kind: "move", sel: 0 });
    expect(paletteKey("ArrowUp", 0, 3)).toEqual({ kind: "move", sel: 2 });
    expect(paletteKey("Home", 2, 3)).toEqual({ kind: "move", sel: 0 });
    expect(paletteKey("End", 0, 3)).toEqual({ kind: "move", sel: 2 });
  });

  it("Enter opens the selected row; nothing happens with no rows", () => {
    expect(paletteKey("Enter", 1, 3)).toEqual({ kind: "open", sel: 1 });
    expect(paletteKey("Enter", 9, 3)).toEqual({ kind: "open", sel: 2 });
    expect(paletteKey("Enter", 0, 0)).toBeNull();
    expect(paletteKey("ArrowDown", 0, 0)).toBeNull();
    expect(paletteKey("a", 0, 3)).toBeNull();
  });

  it("Esc closes, even with no results", () => {
    expect(paletteKey("Escape", 0, 3)).toEqual({ kind: "close" });
    expect(paletteKey("Escape", 0, 0)).toEqual({ kind: "close" });
  });

  it("focus returns to the trigger when the palette closes", () => {
    const trigger = { focus: vi.fn(), isConnected: true };
    expect(returnFocus(trigger)).toBe(true);
    expect(trigger.focus).toHaveBeenCalledWith({ preventScroll: true });
    const gone = { focus: vi.fn(), isConnected: false };
    expect(returnFocus(gone)).toBe(false);
    expect(gone.focus).not.toHaveBeenCalled();
    expect(returnFocus(null)).toBe(false);
  });
});

describe("sections", () => {
  it("empty: Recent (last opened) then the four Actions", () => {
    const recent = [hit("Clients", 7)];
    const s = paletteSections("", cmds, [], recent);
    expect(s.map((x) => x.name)).toEqual(["Recent", "Actions"]);
    expect(s[1].entries.map((e) => e.label)).toEqual(["New client", "Send for approval", "Go to Today", "Go to Calendar"]);
    expect(paletteSections("", cmds, [], []).map((x) => x.name)).toEqual(["Actions"]);
  });

  it("typing: grouped Clients · Posts · Leads · Shoots · Actions", () => {
    const s = paletteSections("cl", cmds, hits, []);
    expect(s.map((x) => x.name)).toEqual(["Clients", "Posts", "Leads", "Shoots", "Actions"]);
    expect(s[0].entries.map((e) => e.label)).toEqual(["Clients 1", "Clients 2"]);
    expect(flatten(s)[0].label).toBe("Clients 1");
  });

  it("'>' filters to commands only", () => {
    expect(parseQuery(">  new")).toEqual({ commandsOnly: true, text: "new" });
    expect(parseQuery("new")).toEqual({ commandsOnly: false, text: "new" });
    const all = paletteSections(">", cmds, hits, [hit("Clients", 9)]);
    expect(all.map((x) => x.name)).toEqual(["Actions"]);
    expect(all[0].entries.every((e) => e.group === "Actions" || e.group === "Go to")).toBe(true);
    expect(all[0].entries[0].label).toBe("New client");
    const s = paletteSections(">new", cmds, hits, []);
    expect(s.map((x) => x.name)).toEqual(["Actions"]);
    expect(s[0].entries[0].label).toBe("New client");
    expect(paletteSections(">zzzz", cmds, hits, [])).toEqual([]);
  });
});

describe("recent items", () => {
  it("newest first, no duplicates, at most five; commands are not kept", () => {
    let list: PaletteEntry[] = [];
    for (let i = 1; i <= 7; i++) list = pushRecent(list, hit("Posts", i));
    expect(list.map((e) => e.label)).toEqual(["Posts 7", "Posts 6", "Posts 5", "Posts 4", "Posts 3"]);
    list = pushRecent(list, hit("Posts", 5));
    expect(list.map((e) => e.label)).toEqual(["Posts 5", "Posts 7", "Posts 6", "Posts 4", "Posts 3"]);
    expect(pushRecent(list, cmds[0])).toBe(list);
  });

  it("are stored per user and read back safely", () => {
    expect(recentKey("Owner@Oryza.test")).toBe("oz_palette_recent:owner@oryza.test");
    expect(recentKey("a@x.in")).not.toBe(recentKey("b@x.in"));
    const stored = JSON.stringify(pushRecent([], hit("Leads", 1)));
    expect(parseRecent(stored).map((e) => e.label)).toEqual(["Leads 1"]);
    expect(parseRecent("not json")).toEqual([]);
    expect(parseRecent(JSON.stringify([{ group: "Clients", label: "x", href: "https://evil.example" }]))).toEqual([]);
    expect(parseRecent(null)).toEqual([]);
  });
});

describe("rendering", () => {
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  const html = renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <CommandPalette open onClose={() => undefined} commands={cmds} onHelp={() => undefined} user="owner@oryza.test" />
    </AppRouterContext.Provider>,
  );

  it("one borderless field row: icon, input, Esc hint (desktop) / Cancel (phone); footer hints", () => {
    expect(PALETTE_PLACEHOLDER).toBe("Search clients, posts, leads, shoots…");
    expect(html).toContain(`placeholder="${PALETTE_PLACEHOLDER}"`);
    expect(html).toMatch(/class="palette-input [^"]*text-\[17px\]/);
    expect(html).toContain(">Esc</kbd>");
    expect(html).toMatch(/>Cancel<\/button>/);
    expect(html).toContain("↑↓ move · ↵ open · Esc close");
    expect(html).toMatch(/Type <kbd[^>]*>&gt;<\/kbd> for commands/);
    expect(html).toMatch(/role="dialog"[^>]*class="absolute inset-0 [^"]*focus-within:ring-2/);
    expect(html).toContain('role="combobox"');
  });

  it("empty state shows the Actions; rows have an icon tile, title and type label; the selected row is gold", () => {
    expect(html).toContain(">Actions</p>");
    const list = renderToStaticMarkup(<PaletteList sections={paletteSections("cl", cmds, hits, [])} current={1} onHover={() => undefined} onPick={() => undefined} empty="" />);
    expect(list).toMatch(/id="pal-1" role="option" aria-selected="true"[^>]*class="[^"]*bg-gold-100\/70 shadow-\[inset_3px_0_0_var\(--color-gold-500\)\]/);
    expect(list).toMatch(/id="pal-0" role="option" aria-selected="false"/);
    for (const t of [">Client<", ">Post<", ">Lead<", ">Shoot<"]) expect(list).toContain(t);
    expect(list).toMatch(/aria-hidden="true" class="grid h-8 w-8/);
    expect(list).toMatch(/min-h-12/); // 48px rows on phones
  });
});
