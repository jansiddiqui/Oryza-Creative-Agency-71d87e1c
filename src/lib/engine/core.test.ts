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

  it("checks day:… tags against the day a template would be scheduled on", () => {
    const daily = t({ id: "DAILY", format: "post", pillar: "access", title: "Odd-day post", hook: "x", cta: "y", repeatable: true, blockedBy: ["day:even"], boosts: Array(20).fill("primary:footfall") });
    const config = { ...hospitalConfig, playbook: { ...hospitalConfig.playbook, templates: [daily, ...hospitalConfig.playbook.templates] }, dayTags: () => (day: number) => new Set(day % 2 ? [] : ["day:even"]) };
    const days = generatePlan(config, hospital).days.filter((d) => d.items.some((x) => x.templateId === "DAILY")).map((d) => d.day);
    expect(days.length).toBeGreaterThan(0);
    expect(days.every((d) => d % 2 === 1)).toBe(true);
  });

  it("keeps closed days free of reels, posts, stories and shoots, and drops events the category mutes", () => {
    const config = { ...hospitalConfig, closedDays: () => [1, 2, 15, 16], keepEvent: (_: unknown, e: { kind: string }) => e.kind !== "talk" };
    const p = generatePlan(config, { ...hospital, events: [{ kind: "camp", date: "2026-11-10" }, { kind: "talk", date: "2026-11-20" }] });
    for (const d of [1, 2, 15, 16]) expect(p.days[d - 1].items.filter((x) => x.platform === "instagram")).toEqual([]);
    expect(p.shootDays.map((s) => s.day)).not.toContain(1);
    expect(JSON.stringify(p.days)).not.toContain("Awareness talk");
    const count = (f: string) => p.days.reduce((n, d) => n + d.items.filter((x) => x.platform === "instagram" && x.format === f).length, 0);
    expect(count("reel")).toBe(packages.growth.reels);
    expect(count("post")).toBe(packages.growth.posts);
  });

  it("fills a template's variables from a list of variable sets, and skips templates whose list is empty", () => {
    const multi = t({ id: "MULTI", format: "post", pillar: "access", title: "{a} at {b}", hook: "x", cta: "y", boosts: Array(20).fill("primary:footfall") });
    const base = { ...hospitalConfig, playbook: { ...hospitalConfig.playbook, templates: [multi, ...hospitalConfig.playbook.templates] } };
    const filled = generatePlan({ ...base, templateLists: () => ({ MULTI: { key: "a", list: [{ a: "One", b: "Two" }], mode: "cycle" as const } }) }, hospital);
    expect(filled.days.some((d) => d.items.some((x) => x.title === "One at Two"))).toBe(true);
    const empty = generatePlan({ ...base, templateLists: () => ({ MULTI: { key: "a", list: [], mode: "cycle" as const } }) }, hospital);
    expect(empty.days.some((d) => d.items.some((x) => x.templateId === "MULTI"))).toBe(false);
  });

  it("gives every shoot day a shot list and keeps reels after the first shoot", () => {
    const p = generatePlan(hospitalConfig, hospital);
    expect(p.shootDays.length).toBe(2);
    for (const s of p.shootDays) expect(s.shots.length).toBeGreaterThan(0);
    const firstReel = p.days.find((d) => d.items.some((x) => x.format === "reel" && x.platform === "instagram"))!;
    expect(firstReel.day).toBeGreaterThanOrEqual(p.shootDays[0].day + 2);
  });
});
