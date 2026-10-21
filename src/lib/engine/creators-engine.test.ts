import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CREATOR_BANNED_WORDING, DISCLOSURE, creatorsPlaybook } from "@/data/playbooks/creators";
import { buildTags, packages } from "./core";
import { creatorsConfig } from "./categories/creators";
import { generateCreatorsPlan, type CreatorAnswers } from "./creators-engine";
import type { Plan } from "./types";

const base: CreatorAnswers = {
  name: "Test Creator", city: "Kanpur", niche: "food", topic: "quick home cooking", goals: ["growth", "deals"], styles: ["talking", "tutorial"], followers: "10k", language: "Hinglish",
  stage: "active", consent: "no", shoot: "1", pkg: "growth", platforms: ["instagram", "youtube", "facebook"], optimize: [], startDate: "2026-11-02",
  events: [], collabs: [{ brand: "Brand Z", date: "2026-11-12", type: "paid" }, { brand: "Brand Y", date: "2026-11-19", type: "gifted" }, { brand: "Brand X", date: "2026-11-24", type: "affiliate" }],
  launches: [{ name: "Recipe e-book", date: "2026-11-25" }], series: [{ name: "10-minute Tuesdays", weekday: "2" }], sebi: "", qualifications: "", kids: "none", onCamera: "all",
};
const gen = (over: Partial<CreatorAnswers> = {}) => generateCreatorsPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const finance: Partial<CreatorAnswers> = { niche: "finance", topic: "money basics for students" };
const health: Partial<CreatorAnswers> = { niche: "health", topic: "home workouts" };

const variants: Partial<CreatorAnswers>[] = [
  {}, { pkg: "starter" }, { pkg: "premium", consent: "yes" }, finance, { ...finance, sebi: "INA000000000 (as provided)" }, health, { ...health, qualifications: "Certified fitness trainer (as provided)" },
  { styles: ["vlog", "skit"], kids: "consent" }, { styles: [], series: [], collabs: [], launches: [] }, { onCamera: "none", startDate: "2026-06-22" },
  { stage: "new", goals: ["launch"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
];

describe("creators playbook", () => {
  const T = creatorsPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording", () => {
    for (const t of T) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(CREATOR_BANNED_WORDING);
  });
  it("brand collab templates exist only as engine-created items that carry the disclosure", () => {
    for (const t of T.filter((x) => /\{brand\}/.test(x.title + x.hook))) {
      expect(t.pinnedOnly, t.id).toBe(true);
      expect(t.title.startsWith("{collab_label}"), t.id).toBe(true);
      expect(t.note, t.id).toMatch(/paid-partnership tool/);
    }
  });
  it("gates finance advice on SEBI registration and health advice on qualifications", () => {
    for (const t of T.filter((x) => /SEBI/.test(x.note ?? ""))) expect(t.requires, t.id).toEqual(expect.arrayContaining(["niche:finance", "sebi:yes"]));
    for (const t of T.filter((x) => /qualifications/.test(x.note ?? ""))) expect(t.requires, t.id).toEqual(expect.arrayContaining(["niche:health", "quals:yes"]));
  });
});

describe("creators plan engine", () => {
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
      const tags = buildTags(creatorsConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = creatorsPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
  it("replaces client text that breaks the rules", () => {
    const p = gen({ topic: "guaranteed stock tips", launches: [{ name: "Get rich course", date: "2026-11-25" }] });
    expect(JSON.stringify(p.days)).not.toMatch(/guaranteed stock|Get rich/i);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
});

describe("collab disclosure (ASCI)", () => {
  it("every collab item carries the right disclosure upfront, on every platform", () => {
    const p = gen();
    for (const c of base.collabs) {
      const label = DISCLOSURE[c.type];
      const day = on(p, c.date);
      const collab = day.filter((x) => x.title.includes(c.brand));
      expect(collab.length, c.brand).toBeGreaterThan(0);
      for (const x of collab) expect(x.title, `${x.platform} ${x.title}`).toMatch(new RegExp(`^(Native post: |Short: )?${label}`));
    }
    for (const x of items(p).filter((i) => i.platform === "instagram" && /Brand [XYZ]/.test(i.title))) expect(x.note ?? x.hook).toMatch(/paid-partnership tool|disclosure/);
    // YouTube Shorts repurposed from a collab keep the disclosure in the title.
    for (const x of items(p).filter((i) => i.platform === "youtube" && /Brand [XYZ]/.test(i.title))) expect(x.title).toMatch(/Short: (Paid partnership|Gifted|Ad)/);
  });
  it("never creates a collab item for an unknown collab type", () => {
    const p = gen({ collabs: [{ brand: "Brand Q", date: "2026-11-12", type: "unknown" as never }] });
    expect(JSON.stringify(p.days)).not.toContain("Brand Q");
  });
});

describe("finance, health and family rules", () => {
  it("finance without SEBI: literacy only, every item marked not investment advice", () => {
    const p = gen({ ...finance, pkg: "premium" });
    const adviceIds = new Set(creatorsPlaybook.templates.filter((t) => t.requires?.includes("sebi:yes")).map((t) => t.id));
    expect(items(p).filter((x) => adviceIds.has(x.templateId))).toEqual([]);
    for (const x of items(p)) expect(x.note).toContain("Not investment advice.");
  });
  it("finance with SEBI: registration number on items, advice templates allowed", () => {
    const p = gen({ ...finance, sebi: "INA000000000 (as provided)", pkg: "premium" });
    expect(items(p).some((x) => ["CR15", "CP13"].includes(x.templateId))).toBe(true);
    for (const x of items(p)) expect(x.note).toContain("SEBI Reg. No. INA000000000 (as provided)");
  });
  it("health: advice only with qualifications, never medical claims", () => {
    const without = gen({ ...health, pkg: "premium" });
    expect(items(without).some((x) => ["CR16", "CP14"].includes(x.templateId))).toBe(false);
    for (const x of items(without)) expect(x.note).toContain("Not medical advice");
    const withQ = gen({ ...health, qualifications: "Certified fitness trainer (as provided)", pkg: "premium" });
    expect(items(withQ).some((x) => ["CR16", "CP14"].includes(x.templateId))).toBe(true);
  });
  it("children only with a parent's consent", () => {
    expect(items(gen({ styles: ["vlog"], pkg: "premium" })).some((x) => x.templateId === "CR17")).toBe(false);
  });
});

describe("creators pinned dates", () => {
  it("launch funnel: teaser, coming soon, countdown, launch and follow-up", () => {
    const p = gen();
    expect(on(p, "2026-11-18").some((x) => x.templateId === "CP06")).toBe(true);
    expect(on(p, "2026-11-22").some((x) => x.templateId === "CR13")).toBe(true);
    for (const d of ["2026-11-22", "2026-11-23", "2026-11-24"]) expect(on(p, d).some((x) => x.title === "Countdown: Recipe e-book")).toBe(true);
    expect(on(p, "2026-11-25").map((x) => x.templateId)).toEqual(expect.arrayContaining(["CR12", "CP21"]));
    expect(on(p, "2026-11-28").some((x) => x.templateId === "CP07")).toBe(true);
  });
  it("weekly series on its weekday", () => {
    const p = gen();
    const eps = items(p).filter((x) => x.templateId === "CR05" && x.platform === "instagram");
    expect(eps.length).toBeGreaterThanOrEqual(3);
    for (const x of eps) expect(p.days.find((d) => d.date === x.date)!.weekday).toBe("Tue");
  });
  it("World Social Media Day (30 Jun)", () => {
    expect(on(gen({ startDate: "2026-06-22", collabs: [], launches: [] }), "2026-06-30").some((x) => x.templateId === "CP22")).toBe(true);
  });
  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", topic: "", goals: [], styles: [], events: [], collabs: [], launches: [], series: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
