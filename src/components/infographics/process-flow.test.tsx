import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { processSteps } from "@/data/process";
import { ProcessFlow } from "./ProcessFlow";

const dark = renderToStaticMarkup(<ProcessFlow light />);
const lightHtml = renderToStaticMarkup(<ProcessFlow />);
const lis = (html: string) => html.split(/<li[\s>]/).slice(1);

describe("How it works flow", () => {
  it("is an ordered list of the seven steps, each with its short line and a 'who' badge", () => {
    expect(dark).toMatch(/<ol[\s>]/);
    expect(lis(dark)).toHaveLength(7);
    const expected: [string, string, string, string?][] = [
      ["Questions", "Tell us about your business", "You", "4 min"],
      ["Plan", "30-day calendar, day by day", "Oryza"],
      ["Setup", "Profiles optimised", "Oryza", "first 7–10 days"],
      ["Shoot", "Planned shot list", "Oryza + you"],
      ["Approval", "You approve each week", "You"],
      ["Publish", "On time, every platform", "Oryza"],
      ["Report", "Honest numbers", "Oryza", "monthly"],
    ];
    lis(dark).forEach((li, i) => {
      const [label, short, who, when] = expected[i];
      expect(li).toContain(`>${label}</p>`);
      expect(li).toContain(`>${short}</p>`);
      expect(li).toContain(`<span class="sr-only">Done by: </span>${who.replace("+", "+")}`);
      if (when) expect(li).toContain(`<span class="sr-only">When: </span>${when}`);
      else expect(li).not.toContain("When: ");
    });
  });

  it("only repeats timings the site already states (no new claims)", () => {
    const site = readFileSync(join(process.cwd(), "src/app/(site)/page.tsx"), "utf8") + JSON.stringify(processSteps.map((s) => s.detail));
    expect(site).toMatch(/four minutes/);
    expect(site).toMatch(/7–10 days/);
    expect(processSteps.find((s) => s.id === "report")!.title).toMatch(/Monthly/);
    expect(processSteps.map((s) => s.when).filter(Boolean)).toEqual(["4 min", "first 7–10 days", "monthly"]);
  });

  it("client steps are solid gold, Oryza steps a gold outline filled with the section background", () => {
    const circles = lis(dark).map((li) => li.match(/class="flow-step [^"]*"/)![0]);
    const solid = circles.map((c) => c.includes("bg-gold-500"));
    expect(solid).toEqual([true, false, false, false, true, false, false]);
    expect(circles[1]).toContain("bg-ink");
    expect(lis(lightHtml).map((li) => li.match(/class="flow-step [^"]*"/)![0])[1]).toContain("bg-paper");
    expect(dark).toContain("Gold = your part");
    expect(dark).toContain("Outline = Oryza does it");
  });

  it("one continuous line from the first circle's centre to the last one's; icons hidden from screen readers", () => {
    const line = dark.match(/<span aria-hidden="true" class="flow-line [^"]*"/g) ?? [];
    expect(line).toHaveLength(1);
    expect(line[0]).toMatch(/left-\[calc\(100%\/14\)\][^"]*w-\[calc\(100%\*6\/7\)\]/);
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toMatch(/\.flow-line \{ background: linear-gradient\(90deg, var\(--color-gold-500\), color-mix\(in srgb, var\(--color-gold-500\) 35%, transparent\)\); \}/); // fades towards the end
    // Phones: one segment per gap (6), from circle centre to the next circle's centre.
    expect((dark.match(/class="flow-seg absolute left-\[27px\] top-7 h-full/g) ?? []).length).toBe(6);
    for (const svg of dark.match(/<svg[^>]*>/g) ?? []) expect(svg).toMatch(/aria-hidden="true"/);
  });

  it("animates only with motion allowed, and only with transform/opacity/stroke (no layout shift)", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const motion = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(motion).toContain("[data-revealed] .flow-line { transform-origin: left center; animation: flow-draw-x 0.8s ease-out both; }");
    expect(motion).toContain("[data-revealed] .flow-step { animation: flow-light 0.4s ease-out var(--reveal-delay, 0ms) both; }");
    expect(motion).toContain(".reveal-armed .flow-seg { transform: scaleY(0); }");
    // Nothing about the flow is animated outside the no-preference block (so none with reduced motion).
    const head = css.slice(0, css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(head).not.toMatch(/flow-(step|seg)|animation: flow/);
    // Steps light up in sequence (130 ms apart).
    const delays = (dark.match(/class="flow-step [^"]*" style="--reveal-delay:(\d+)ms"/g) ?? []).map((m) => +m.match(/(\d+)ms/)![1]);
    expect(delays).toEqual([0, 130, 260, 390, 520, 650, 780]);
    expect(dark).toContain('data-reveal="draw"');
  });
});
