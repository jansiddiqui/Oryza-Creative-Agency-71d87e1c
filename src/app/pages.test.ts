import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/** Every static page under src/app with its route and source. */
function pages() {
  const appDir = join(process.cwd(), "src", "app");
  const out: { route: string; src: string }[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name));
      else if (e.name === "page.tsx") {
        const parts = relative(appDir, dir).split(sep).filter(Boolean);
        if (parts[0] === "admin") continue; // private, noindex — no canonical
        const route = "/" + parts.filter((p) => !p.startsWith("(")).join("/");
        out.push({ route, src: readFileSync(join(dir, e.name), "utf8") });
      }
    }
  };
  walk(appDir);
  return out;
}

describe("pages", () => {
  const all = pages();

  it.each(all.map((p) => [p.route, p.src]))("%s declares its own canonical URL", (route, src) => {
    const canonical = src.match(/canonical:\s*"([^"]+)"/)?.[1];
    expect(canonical).toBe(route);
  });

  it("has no two pages with identical source", () => {
    const seen = new Map<string, string>();
    for (const p of all) {
      expect(seen.get(p.src), `${p.route} duplicates ${seen.get(p.src)}`).toBeUndefined();
      seen.set(p.src, p.route);
    }
  });
});
