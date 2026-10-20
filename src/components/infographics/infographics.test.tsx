import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { platforms } from "@/data/platforms";
import { schoolPlaybook } from "@/data/playbooks/school";
import { packages } from "@/lib/engine/school-engine";
import { samplePlan } from "@/lib/sample";
import { FitMatrix, FitStrip } from "./FitMatrix";
import { PackageCompare } from "./PackageCompare";
import { PillarMix } from "./PillarMix";
import { PlanTimeline } from "./PlanTimeline";
import { ProcessFlow } from "./ProcessFlow";

const count = (html: string, needle: string) => html.split(needle).length - 1;
const items = (html: string) => (html.match(/<li[\s>]/g) ?? []).length;

describe("infographics use only real product data", () => {
  it("fit matrix: every industry × platform, as an accessible table with text labels", () => {
    const html = renderToStaticMarkup(<FitMatrix categories={categories} />);
    expect(html).toContain("<table");
    expect(count(html, '<th scope="row"')).toBe(categories.length);
    expect(count(html, "<td")).toBe(categories.length * platforms.length);
    const cores = categories.reduce((n, c) => n + Object.values(c.fit).filter((f) => f === "core").length, 0);
    expect(count(html, '<span class="sr-only">Core</span>')).toBe(cores);
  });

  it("fit strip: all platforms for one industry", () => {
    const html = renderToStaticMarkup(<FitStrip category={categories[0]} />);
    expect(items(html)).toBe(platforms.length);
  });

  it("plan timeline: one cell per plan day and totals that match the plan", () => {
    const html = renderToStaticMarkup(<PlanTimeline plan={samplePlan} />);
    expect(count(html, 'class="pop relative flex')).toBe(samplePlan.days.length);
    const reels = samplePlan.days.flatMap((d) => d.items).filter((i) => i.format === "reel" || i.format === "short").length;
    expect(html).toContain(`${samplePlan.days.length} days · ${reels} reels`);
    expect(html).toContain(`${samplePlan.shootDays.length} shoot`);
  });

  it("pillar mix: legend shows each pillar's share, normalised to 100", () => {
    const pillars = schoolPlaybook.pillars.map((p) => ({ name: p.name, pct: p.share }));
    const html = renderToStaticMarkup(<PillarMix pillars={pillars} />);
    const total = pillars.reduce((s, p) => s + p.pct, 0);
    for (const p of pillars) expect(html).toContain(`${Math.round((p.pct / total) * 100)}%`);
    expect(count(html, "<circle")).toBe(pillars.length + 1);
  });

  it("package comparison: the planner's own volumes, no prices", () => {
    const html = renderToStaticMarkup(<PackageCompare />);
    for (const p of Object.values(packages)) {
      expect(html).toContain(`>${p.reels}<`);
      expect(html).toContain(`>${p.posts}<`);
    }
    expect(html).not.toMatch(/₹|\$|price/i);
  });

  it("process flow: the seven steps", () => {
    const html = renderToStaticMarkup(<ProcessFlow />);
    expect(items(html)).toBe(7);
  });
});
