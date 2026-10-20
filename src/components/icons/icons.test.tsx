import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { platforms } from "@/data/platforms";
import { processSteps } from "@/data/process";
import { industryIcons, platformIcons, processIcons, serviceIcons, InstagramIcon } from ".";

describe("icon system", () => {
  it("has an icon for every platform, industry, service and process step", () => {
    expect(platforms.filter((p) => !platformIcons[p.id]).map((p) => p.id)).toEqual([]);
    expect(categories.filter((c) => !industryIcons[c.slug]).map((c) => c.slug)).toEqual([]);
    expect(processSteps.filter((s) => !processIcons[s.id]).map((s) => s.id)).toEqual([]);
    expect(Object.keys(serviceIcons)).toEqual(["strategy", "content", "reels", "posting", "community", "reporting", "optimization"]);
  });

  it("draws on a 24px grid with 1.5px round strokes in currentColor", () => {
    const svg = renderToStaticMarkup(<InstagramIcon />);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('stroke="currentColor"');
  });

  it("is decorative by default and named when given a title", () => {
    expect(renderToStaticMarkup(<InstagramIcon />)).toContain('aria-hidden="true"');
    const named = renderToStaticMarkup(<InstagramIcon title="Instagram" />);
    expect(named).toContain('role="img"');
    expect(named).toContain("<title>Instagram</title>");
    expect(named).not.toContain("aria-hidden");
  });

  it("paints accent strokes gold only when asked", () => {
    expect(renderToStaticMarkup(<InstagramIcon />)).not.toContain("--icon-accent:");
    expect(renderToStaticMarkup(<InstagramIcon accent />)).toContain("--icon-accent:var(--color-gold-500)");
  });
});
