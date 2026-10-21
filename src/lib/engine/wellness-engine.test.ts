import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WELLNESS_BANNED_WORDING, wellnessPlaybook } from "@/data/playbooks/wellness";
import { buildTags, packages } from "./core";
import { wellnessConfig } from "./categories/wellness";
import { generateWellnessPlan, type WellnessAnswers } from "./wellness-engine";
import type { Plan } from "./types";

const base: WellnessAnswers = {
  name: "Test Fitness", city: "Kanpur", type: "gym", goals: ["members"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-12-21",
  events: [{ kind: "launch", date: "2027-01-05", label: "New strength zone" }],
  services: ["Strength training", "Yoga", "Zumba"], timings: "5 am – 10 pm", packages: "Monthly ₹1,500 · Quarterly ₹4,000",
  classes: [{ name: "Yoga", days: "Mon/Wed/Fri", time: "7 am" }], womenSlots: "Women-only: 11 am – 1 pm daily", certifications: "Trainers certified by (as provided)",
  offers: [{ name: "New Year offer", start: "2027-01-02", end: "2027-01-10", offer: "Joining fee waived (as provided)" }], onCamera: "all",
};
const gen = (over: Partial<WellnessAnswers> = {}) => generateWellnessPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

const variants: Partial<WellnessAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { type: "salon", services: ["Haircuts", "Hair colour", "Bridal make-up"], classes: [], goals: ["bridal"] },
  { type: "spa", services: ["Swedish massage", "Foot reflexology"], startDate: "2027-06-07", classes: [] },
  { type: "unisex", onCamera: "none", shoot: "own" },
  { type: "bridal", services: [], events: [{ kind: "wedding", date: "2026-12-28", label: "Wedding season" }] },
  { goals: ["reviews"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"], startDate: "2027-07-05" },
  { stage: "new", goals: [], offers: [] },
];

describe("wellness playbook", () => {
  const T = wellnessPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording", () => {
    for (const t of T) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(WELLNESS_BANNED_WORDING);
  });
  it("bans the wording the brief lists", () => {
    for (const bad of ["Lose 10 kg in 30 days", "Guaranteed transformation", "Fat burner shake", "Whey protein powder", "Fairness facial", "Skin whitening", "Hair regrowth therapy", "Cures acne", "Best gym in Kanpur", "Get rid of that fat", "Sensual massage", "Only 3 slots left"])
      expect(bad, bad).toMatch(WELLNESS_BANNED_WORDING);
    for (const ok of ["Strength training", "Hair colour", "Bridal make-up", "Swedish massage", "Results vary"]) expect(ok, ok).not.toMatch(WELLNESS_BANNED_WORDING);
  });
  it("before/after templates need consent and carry the “Results vary” note", () => {
    for (const t of T.filter((x) => /before \/ after/i.test(x.note ?? ""))) {
      expect(t.requires, t.id).toContain("consent:yes");
      expect(t.note).toMatch(/real and unedited/);
      expect(t.note).toMatch(/Results vary/);
    }
    for (const t of T.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe("wellness plan engine", () => {
  it("is deterministic", () => {
    for (const v of variants) expect(hash(gen(v))).toBe(hash(gen(v)));
  });
  it("matches package volumes for every variant", () => {
    for (const v of variants) {
      const pk = v.pkg ?? "growth";
      const p = gen(v);
      expect(ig(p, "reel").length, JSON.stringify(v)).toBe(packages[pk].reels);
      expect(ig(p, "post").length, JSON.stringify(v)).toBe(packages[pk].posts);
    }
  });
  it("leaves no variable unfilled", () => {
    for (const v of variants) expect(JSON.stringify(gen(v)), JSON.stringify(v)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
  it("only schedules templates whose tag rules pass", () => {
    for (const v of variants) {
      const tags = buildTags(wellnessConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = wellnessPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
  it("replaces client text that breaks the rules", () => {
    const p = gen({ services: ["Fat burner programme", "Skin whitening facial", "Yoga"], packages: "Lose 10 kg in 30 days — guaranteed", offers: [{ name: "Summer", start: "2027-01-02", end: "", offer: "Only 3 slots left!" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Fat burner|whitening|Lose 10 kg|Only 3 slots/i);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(WELLNESS_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
  it("shows clients and before/after only with consent", () => {
    const faceIds = new Set(wellnessPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
    const p = gen({ pkg: "premium", consent: "yes" });
    const ba = items(p).filter((x) => x.platform === "instagram" && ["WR06", "WP08"].includes(x.templateId));
    expect(ba.length).toBeGreaterThan(0);
    for (const x of ba) expect(x.note).toMatch(/Results vary/);
  });
  it("keeps spa content family-safe and adds the note", () => {
    const p = gen({ type: "spa", services: ["Swedish massage"], classes: [], pkg: "premium" });
    for (const x of items(p)) expect(`${x.title} ${x.hook ?? ""}`).not.toMatch(/sexy|sensual|erotic|body[- ]to[- ]body/i);
    expect(p.compliance?.join(" ")).toMatch(/family-safe/);
  });
  it("uses prices, packages, certifications and offers verbatim", () => {
    const p = gen({ pkg: "premium" });
    for (const x of ig(p, "post").filter((i) => i.templateId === "WP03")) expect(x.hook).toBe(base.packages);
    for (const x of ig(p, "post").concat(ig(p, "reel")).filter((i) => ["WP17", "WR16"].includes(i.templateId))) expect(x.hook).toBe(base.certifications);
    expect(on(p, "2027-01-02").find((x) => x.templateId === "WP10")?.hook).toBe("Joining fee waived (as provided)");
  });
});

describe("wellness pinned dates", () => {
  it("New Year fitness push on 1 Jan for gyms (no plain greeting)", () => {
    const p = gen();
    expect(on(p, "2027-01-01").some((x) => x.templateId === "WP14")).toBe(true);
    expect(on(p, "2027-01-01").some((x) => x.templateId === "WP13")).toBe(false);
    expect(on(gen({ type: "salon", services: ["Haircuts"], classes: [] }), "2027-01-01").some((x) => x.templateId === "WP14")).toBe(false);
  });
  it("International Day of Yoga on 21 June for gyms and spas", () => {
    const p = gen({ startDate: "2027-06-07", events: [], offers: [] });
    expect(on(p, "2027-06-21").map((x) => x.templateId)).toEqual(expect.arrayContaining(["WP15", "WR19"]));
    expect(on(gen({ type: "salon", startDate: "2027-06-07", events: [], offers: [] }), "2027-06-21").some((x) => x.templateId === "WP15")).toBe(false);
  });
  it("launch reel and post on the day", () => {
    expect(on(gen(), "2027-01-05").map((x) => x.templateId)).toEqual(expect.arrayContaining(["WR17", "WP11"]));
  });
  it("wedding season only on a date the client verified", () => {
    const p = gen({ type: "bridal", services: ["Bridal make-up"], events: [{ kind: "wedding", date: "2026-12-28", label: "Wedding season" }] });
    expect(on(p, "2026-12-28").some((x) => x.templateId === "WP20")).toBe(true);
    expect(JSON.stringify(gen({ type: "bridal", services: ["Bridal make-up"], events: [] }).days)).not.toMatch(/Wedding season/);
  });
  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], services: [], timings: "", packages: "", classes: [], womenSlots: "", certifications: "", offers: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
