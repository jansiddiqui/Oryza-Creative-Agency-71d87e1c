import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { Footer } from "./Footer";

describe("footer", () => {
  const html = renderToStaticMarkup(<Footer />);
  const industries = html.slice(html.indexOf('aria-label="Industries"'));

  it("lists all 13 industries", () => {
    expect(categories).toHaveLength(13);
    for (const c of categories) expect(industries, c.name).toContain(`>${c.name.replace(/&/g, "&amp;")}</a>`);
  });

  it("links live industries to their page and the rest to /industries, plus an “All industries” link", () => {
    for (const c of categories) {
      const href = c.plannerLive ? `/industries/${c.slug}` : "/industries";
      expect(industries, c.slug).toContain(`href="${href}"`);
    }
    expect(industries).toContain("All industries →");
  });

  it("stays light: no icons in the industry list", () => {
    const list = industries.slice(0, industries.indexOf("All industries"));
    expect(list).not.toContain("<svg");
  });
});
