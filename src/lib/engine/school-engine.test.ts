import { describe, expect, it } from "vitest";
import { generateSchoolPlan, packages, type SchoolAnswers } from "./school-engine";

const base: SchoolAnswers = {
  name: "Sunrise Public School", city: "Kanpur", board: "cbse", level: "12",
  goals: ["admissions"], admissionOpen: "2026-11-02", admissionClose: "2026-11-20",
  events: [{ kind: "sports", date: "2026-11-05" }, { kind: "ptm", date: "2026-11-13" }],
  usps: ["sports", "safety"], achievements: ["State chess champion", "100% board results", "Science fair winner"],
  stage: "revive", consent: "some", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "website", "youtube"], optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
};
const ig = (p: ReturnType<typeof generateSchoolPlan>, f: string) =>
  p.days.flatMap((d) => d.items.filter((x) => x.platform === "instagram" && x.format === f).map((x) => ({ ...x, day: d.day })));

describe("school plan engine", () => {
  it("is deterministic", () => {
    expect(JSON.stringify(generateSchoolPlan(base))).toBe(JSON.stringify(generateSchoolPlan(base)));
  });
  it("matches package volumes", () => {
    for (const pk of ["starter", "growth", "premium"] as const) {
      const p = generateSchoolPlan({ ...base, pkg: pk });
      expect(ig(p, "reel").length).toBe(packages[pk].reels);
      expect(ig(p, "post").length).toBe(packages[pk].posts);
    }
  });
  it("pins admissions content on the opening day", () => {
    const p = generateSchoolPlan(base);
    const day = p.days.find((d) => d.date === "2026-11-02")!;
    expect(day.items.some((x) => x.templateId === "R07")).toBe(true);
    expect(day.items.some((x) => x.templateId === "P04")).toBe(true);
  });
  it("never repeats an idea template within the month", () => {
    const p = generateSchoolPlan(base);
    const ids = [...ig(p, "reel"), ...ig(p, "post")].map((x) => x.templateId);
    const repeatable = new Set(["P02", "P10", "P11", "P14", "R10", "P17"]);
    const ideas = ids.filter((i) => !repeatable.has(i));
    expect(new Set(ideas).size).toBe(ideas.length);
  });
  it("blocks faces without consent", () => {
    const p = generateSchoolPlan({ ...base, consent: "no" });
    const ids = [...ig(p, "reel"), ...ig(p, "post")].map((x) => x.templateId);
    expect(ids).not.toContain("R06");
    expect(ids).not.toContain("R03");
  });
  it("uses each achievement once", () => {
    const p = generateSchoolPlan(base);
    const titles = ig(p, "post").filter((x) => x.templateId === "P02").map((x) => x.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it("never publishes a reel before the first shoot is edited", () => {
    const p = generateSchoolPlan(base);
    expect(Math.min(...ig(p, "reel").map((x) => x.day))).toBeGreaterThanOrEqual(3);
  });
  it("has at most one IG reel and one IG post per day", () => {
    for (const pk of ["starter", "growth", "premium"] as const) {
      const p = generateSchoolPlan({ ...base, pkg: pk });
      for (const d of p.days) {
        expect(d.items.filter((x) => x.platform === "instagram" && x.format === "reel").length).toBeLessThanOrEqual(1);
        expect(d.items.filter((x) => x.platform === "instagram" && x.format === "post").length).toBeLessThanOrEqual(1);
      }
    }
  });
  it("leaves no unfilled variables", () => {
    const p = generateSchoolPlan(base);
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/\{\w+\}/);
  });
  it("builds a plan with minimal answers", () => {
    const p = generateSchoolPlan({ ...base, admissionOpen: undefined, admissionClose: undefined, events: [], achievements: [], usps: [], platforms: [], optimize: [], level: "preprimary", board: "play", shoot: "own", stage: "new", goals: [] });
    expect(ig(p, "reel").length).toBeGreaterThan(0);
    expect(JSON.stringify(p.days)).not.toMatch(/\{\w+\}/);
  });
});
