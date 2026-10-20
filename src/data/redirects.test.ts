import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { buildRedirects, reservedPaths } from "./redirects";

/** The 32 URLs of the old site (/ plus 31 HTML files), copied from docs/old-site-audit.md §2 — kept separate from the redirect map on purpose. */
const OLD_URLS = [
  "/", "/index.html", "/about.html", "/services.html", "/shop.html", "/blog.html", "/contact.html",
  "/privacy-policy.html", "/terms-of-services.html", "/cookie-policy.html",
  ...[
    "Building-a-Memorable-Brand-Identity-from-Scratch", "Creating-Scroll-Stopping-Social-Media-Content",
    "Grow-Your-Business-Online", "How-Oryza-Builds-Personal-Brands-for-Leaders",
    "How-Oryza-Helps-You-Establish-Your-Lifestyle-as-a-Brand", "Mastering-Instagram-Stories-for-Business-Growth",
    "Overcoming-Creative-Block-Strategies-That-Work", "The-Art-of-Visual-Storytelling-in-Marketing",
    "The-Creative-Workspace-Designing-for-Inspiration", "The-Psychology-of-Color-in-Brand-Identity",
    "Typography-Trends-for-Modern-Digital-Design",
  ].map((s) => `/blog/${s}.html`),
  ...[
    "brand-style-guide-service", "business-card-design", "customized-bag-designs", "facebook-ad-creatives-package",
    "instagram-content-pack", "logo-design-package", "packaging-design-package",
    "premium-political-campaign-social-media-kit", "premium-social-media-pack", "professional-visiting-card-design",
    "web-design-package",
  ].map((s) => `/catalog/${s}.html`),
];

/** Static routes of the new site, read from src/app (folders with a page.tsx). */
function appRoutes(): Set<string> {
  const appDir = join(process.cwd(), "src", "app");
  const routes = new Set<string>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name));
      else if (e.name === "page.tsx") {
        const rel = relative(appDir, dir).split(sep).filter((p) => p && !p.startsWith("("));
        routes.add("/" + rel.join("/"));
      }
    }
  };
  walk(appDir);
  return routes;
}

const redirects = buildRedirects();
const bySource = new Map(redirects.map((r) => [r.source, r]));
const routes = appRoutes();

describe("old site redirects", () => {
  it("covers all 32 old URLs", () => {
    expect(OLD_URLS).toHaveLength(32);
    const missing = OLD_URLS.filter((u) => !bySource.has(u) && !routes.has(u));
    expect(missing).toEqual([]);
  });

  it("also redirects the extensionless form of each old URL (unless it is a page or reserved)", () => {
    const missing = OLD_URLS.map((u) => u.replace(/\.html$/, ""))
      .filter((u) => !bySource.has(u) && !routes.has(u) && !reservedPaths.includes(u));
    expect(missing).toEqual([]);
  });

  it.each(redirects.map((r) => [r.source, r.destination]))("%s → %s is a 301 to a real page", (source, destination) => {
    expect(bySource.get(source)?.statusCode).toBe(301);
    expect(routes.has(destination.split(/[?#]/)[0])).toBe(true);
    expect(bySource.has(destination)).toBe(false); // no redirect chains
  });

  it("never shadows a real page", () => {
    expect(redirects.filter((r) => routes.has(r.source))).toEqual([]);
  });

  it("is what next.config.ts serves", async () => {
    expect(await nextConfig.redirects?.()).toEqual(redirects);
  });

  it("never redirects reserved future paths (/about, /blog, /portfolio)", () => {
    expect(redirects.filter((r) => reservedPaths.includes(r.source))).toEqual([]);
  });

  it("has no portfolio page or redirect target yet", () => {
    expect(routes.has("/portfolio")).toBe(false);
    expect(redirects.some((r) => r.destination.startsWith("/portfolio"))).toBe(false);
  });
});
