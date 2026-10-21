import { describe, expect, it } from "vitest";
import { breaksWording, buildTags, fill, generatePlan, packages, type CategoryConfig } from "./core";
import { hospitalConfig, type HospitalAnswers } from "./categories/medical";
import { schoolConfig } from "./categories/school";
import { schoolVariants } from "./school-variants";
import type { Template } from "./types";

const hospital: HospitalAnswers = {
  name: "Test Hospital", city: "Kanpur", goals: ["footfall"], events: [], stage: "active", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "youtube", "website", "linkedin", "pinterest", "x"], optimize: ["gbp"], startDate: "2026-11-02",
  practice: "multi", specialities: ["general"], doctors: "few", onCamera: "some", qualifications: "", opd: "Mon–Sat 9–2", emergency: "no", online: "no", awarenessDays: [],
};
const t = (over: Partial<Template>): Template => ({ id: "X", format: "post", pillar: "p", title: "", hook: "", who: "Oryza designs", ...over });

describe("shared engine core", () => {
  it("fills known variables and leaves unknown ones visible", () => {
    expect(fill("{a} and {b}", { a: "x" })).toBe("x and {b}");
  });

  it("adds the shared tags to the category's own", () => {
    const tags = buildTags(hospitalConfig, hospital);
    for (const x of ["stage:active", "consent:no", "shoot:2", "pkg:growth", "goal:footfall", "primary:footfall", "practice:multi", "spec:general", "has:opd"]) expect(tags.has(x)).toBe(true);
  });

  it("checks wording in title, hook and CTA", () => {
    const banned = /\bbest\b/i;
    expect(breaksWording(t({ title: "Our best team" }), banned)).toBe(true);
    expect(breaksWording(t({ cta: "Best in town" }), banned)).toBe(true);
    expect(breaksWording(t({ title: "A good team" }), banned)).toBe(false);
    expect(breaksWording(t({ title: "Best" }))).toBe(false);
  });

  it("fills every package's reel and post slots for every category", () => {
    for (const [config, a] of [[schoolConfig, schoolVariants.base], [hospitalConfig, hospital]] as unknown as [CategoryConfig<never>, never][])
      for (const pkg of ["starter", "growth", "premium"] as const) {
        const p = generatePlan(config, { ...(a as object), pkg } as never);
        const count = (f: string) => p.days.reduce((n, d) => n + d.items.filter((x) => x.platform === "instagram" && x.format === f).length, 0);
        expect(count("reel")).toBe(packages[pkg].reels);
        expect(count("post")).toBe(packages[pkg].posts);
        expect(p.days).toHaveLength(30);
      }
  });

  it("schedules each selected platform and nothing else", () => {
    const p = generatePlan(hospitalConfig, { ...hospital, platforms: ["instagram", "gbp"] });
    const used = new Set(p.days.flatMap((d) => d.items.map((x) => x.platform)));
    expect([...used].sort()).toEqual(["gbp", "instagram"]);
    expect(p.deliverables.map((d) => d.platform)).toEqual(["instagram", "gbp"]);
  });

  it("only adds compliance notes when the category provides them", () => {
    expect(generatePlan(schoolConfig, schoolVariants.base).compliance).toBeUndefined();
    expect(generatePlan(hospitalConfig, hospital).compliance?.length).toBeGreaterThan(0);
  });

  it("never schedules a template whose wording breaks the category's rules", () => {
    const loud = t({ id: "LOUD", format: "post", pillar: "access", title: "The best hospital in town", hook: "Guaranteed results", boosts: ["primary:footfall", "has:opd", "practice:multi"] });
    const config = { ...hospitalConfig, playbook: { ...hospitalConfig.playbook, templates: [loud, ...hospitalConfig.playbook.templates] } };
    const p = generatePlan(config, hospital);
    expect(p.days.some((d) => d.items.some((x) => x.templateId === "LOUD"))).toBe(false);
  });

  it("gives every shoot day a shot list and keeps reels after the first shoot", () => {
    const p = generatePlan(hospitalConfig, hospital);
    expect(p.shootDays.length).toBe(2);
    for (const s of p.shootDays) expect(s.shots.length).toBeGreaterThan(0);
    const firstReel = p.days.find((d) => d.items.some((x) => x.format === "reel" && x.platform === "instagram"))!;
    expect(firstReel.day).toBeGreaterThanOrEqual(p.shootDays[0].day + 2);
  });
});
