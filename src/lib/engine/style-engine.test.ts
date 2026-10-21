import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { STYLE_BANNED_WORDING, STYLE_CLAIM_WORDS, styleFestivals, stylePlaybook } from "@/data/playbooks/style";
import { buildTags, packages } from "./core";
import { styleConfig } from "./categories/style";
import { generateStylePlan, type StyleAnswers, type StyleProject } from "./style-engine";
import type { Plan } from "./types";

const project = (over: Partial<StyleProject> = {}): StyleProject => ({ name: "Test Residence", kind: "3 BHK apartment", timeline: "10 weeks", budget: "₹12 lakh", showBudget: "no", consent: "yes", ...over });
const jeweller: StyleAnswers = {
  name: "Test Jewellers", city: "Kanpur", type: "jeweller", goals: ["launch", "bridal"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "pinterest"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "festive", date: "2026-11-06", label: "Dhanteras" }],
  specialities: ["Bridal sets", "Gold bangles", "Diamond rings"], collections: [{ name: "Winter bridal collection", launch: "2026-11-14" }], projects: [],
  hallmark: "BIS hallmarked with HUID on every gold piece", fabric: "", prices: "request", priceText: "", making: "", rateStories: "yes",
  offers: [{ name: "Wedding offer", start: "2026-11-20", offer: "Making charges from 8% (as provided)", earlierPriceConfirmed: "no" }], workshop: "yes", onCamera: "some",
};
const gen = (over: Partial<StyleAnswers> = {}) => generateStylePlan({ ...jeweller, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const interior: Partial<StyleAnswers> = { type: "interior", specialities: ["Modular kitchens", "Living rooms"], collections: [], hallmark: "", rateStories: "no", projects: [project(), project({ name: "Café Test", kind: "Café interior", consent: "no" })], goals: ["enquiries"] };
const boutique: Partial<StyleAnswers> = { type: "boutique", specialities: ["Sarees", "Lehengas"], hallmark: "", rateStories: "no", fabric: "Handloom cotton sarees from Chanderi weavers (as provided)" };

const variants: Partial<StyleAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  interior,
  { ...interior, pkg: "premium", consent: "yes" },
  boutique,
  { ...boutique, type: "designer", goals: ["bridal"], workshop: "no" },
  { prices: "show", priceText: "Bridal sets from ₹2,40,000 (as on 2 Nov, 10 am)", making: "12% (as provided)" },
  { onCamera: "none", shoot: "own", startDate: "2027-04-20" },
  { stage: "new", goals: [], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
];

describe("style playbook", () => {
  const T = stylePlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording and never makes purity, hallmark or fabric claims on its own", () => {
    for (const t of T) {
      expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(STYLE_BANNED_WORDING);
      expect([t.title, t.hook, t.cta ?? ""].join(" | ").replace(/\{\w+\}/g, ""), t.id).not.toMatch(STYLE_CLAIM_WORDS);
      expect([t.title, t.hook].join(" | "), t.id).not.toMatch(/₹\s?\d/);
    }
  });
  it("bans the wording the brief lists", () => {
    for (const bad of ["Gold is the best investment", "Guaranteed returns", "Your wealth grows", "Lowest making charges", "Only 2 pieces left", "Zero making charges"]) expect(bad, bad).toMatch(STYLE_BANNED_WORDING);
    for (const ok of ["Bridal sets", "BIS hallmarked with HUID", "Handloom cotton sarees", "Modular kitchens"]) expect(ok, ok).not.toMatch(STYLE_BANNED_WORDING);
  });
  it("labels renders and gates real projects and faces", () => {
    for (const t of T.filter((x) => /concept|visualisation|moodboard|render/i.test(x.title + x.hook) && x.requires?.includes("type:interior"))) expect(t.note, t.id).toMatch(/Design concept \/ visualisation/);
    for (const t of T.filter((x) => /\{project\}/.test(x.title + x.hook))) expect(t.requires, t.id).toContain("has:projects");
    for (const t of T.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe("style plan engine", () => {
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
      const tags = buildTags(styleConfig, { ...jeweller, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = stylePlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
  it("never presents gold as an investment and replaces client text that breaks the rules", () => {
    const p = gen({ specialities: ["Investment gold coins", "Bangles"], hallmark: "Best purity, assured returns", offers: [{ name: "Offer", start: "2026-11-20", offer: "Zero making charges — hurry", earlierPriceConfirmed: "no" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Investment gold|assured returns|Zero making|hurry/i);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(STYLE_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
});

describe("style claims and disclosures", () => {
  it("jewellery: hallmark details only verbatim, never without them", () => {
    const p = gen({ pkg: "premium" });
    const h = ig(p, "post").concat(ig(p, "reel")).filter((x) => ["YP08", "YR16"].includes(x.templateId));
    expect(h.length).toBeGreaterThan(0);
    for (const x of h) expect(x.hook).toBe(jeweller.hallmark);
    expect(JSON.stringify(gen({ hallmark: "", pkg: "premium" }).days)).not.toMatch(/hallmark|HUID|BIS/i);
  });
  it("jewellery: rates only as sent with date and time; prices only when chosen", () => {
    const p = gen();
    const rate = items(p).filter((x) => x.templateId === "YS05");
    expect(rate.length).toBeGreaterThan(0);
    for (const x of rate) {
      expect(x.hook).toMatch(/never filled automatically/);
      expect(`${x.title} ${x.hook}`).not.toMatch(/₹\s?\d/);
    }
    expect(JSON.stringify(p.days)).not.toMatch(/₹/);
    const shown = gen({ prices: "show", priceText: "Bridal sets from ₹2,40,000 (as on 2 Nov, 10 am)", making: "12% (as provided)", pkg: "premium" });
    const pr = ig(shown, "post").filter((x) => x.templateId === "YP10");
    expect(pr.length).toBeGreaterThan(0);
    for (const x of pr) expect(x.hook).toBe("Bridal sets from ₹2,40,000 (as on 2 Nov, 10 am) · Making charges: 12% (as provided)");
  });
  it("offers quoting an earlier price only when confirmed", () => {
    const p = gen({ offers: [{ name: "Wedding offer", start: "2026-11-20", offer: "Was ₹50,000, now ₹45,000", earlierPriceConfirmed: "no" }] });
    expect(JSON.stringify(p.days)).not.toContain("Was ₹50,000");
    expect(p.compliance?.join(" ")).toMatch(/Wedding offer: the offer quotes an earlier price/);
    const ok = gen({ offers: [{ name: "Wedding offer", start: "2026-11-20", offer: "Was ₹50,000, now ₹45,000", earlierPriceConfirmed: "yes" }] });
    expect(on(ok, "2026-11-20").find((x) => x.templateId === "YP13")?.hook).toBe("Was ₹50,000, now ₹45,000");
  });
  it("interiors: renders labelled, projects only with consent, costs only when chosen", () => {
    const p = gen({ ...interior, pkg: "premium" });
    for (const x of ig(p, "reel").concat(ig(p, "post")).filter((i) => ["YR06", "YR13", "YR14", "YR20", "YP05", "YP16"].includes(i.templateId))) expect(x.note).toMatch(/Design concept \/ visualisation/);
    const real = ig(p, "reel").concat(ig(p, "post")).filter((x) => ["YR07", "YP04"].includes(x.templateId));
    expect(real.length).toBeGreaterThan(0);
    for (const x of real) {
      expect(x.title).toContain("Test Residence");
      expect(x.hook?.startsWith("3 BHK apartment · 10 weeks")).toBe(true);
      expect(x.hook).not.toContain("₹");
    }
    expect(JSON.stringify(p.days)).not.toContain("Café Test");
    expect(p.compliance?.join(" ")).toMatch(/1 project was left out because the client's written consent/);
    const withCost = gen({ ...interior, pkg: "premium", projects: [project({ showBudget: "yes" })] });
    expect(ig(withCost, "post").find((x) => x.templateId === "YP04")?.hook).toBe("3 BHK apartment · 10 weeks · ₹12 lakh");
  });
  it("fashion: fabric claims only verbatim", () => {
    const p = gen({ ...boutique, pkg: "premium" });
    for (const x of ig(p, "post").concat(ig(p, "reel")).filter((i) => ["YP09", "YR15"].includes(i.templateId))) expect(x.hook).toBe(boutique.fabric);
    expect(JSON.stringify(gen({ ...boutique, fabric: "", pkg: "premium" }).days)).not.toMatch(/handloom|silk|chanderi/i);
  });
  it("shows customers only with consent", () => {
    const faceIds = new Set(stylePlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });
});

describe("style pinned dates", () => {
  it("collection launch: teaser 5 days before, countdown, reel and post on the day", () => {
    const p = gen();
    expect(on(p, "2026-11-09").some((x) => x.templateId === "YP24")).toBe(true);
    for (const d of ["2026-11-11", "2026-11-12", "2026-11-13"]) expect(on(p, d).some((x) => x.title === "Countdown: Winter bridal collection")).toBe(true);
    expect(on(p, "2026-11-14").map((x) => x.templateId)).toEqual(expect.arrayContaining(["YR03", "YP01"]));
  });
  it("festive buying days only on dates the client verified", () => {
    expect(on(gen(), "2026-11-06").some((x) => x.templateId === "YP12" && x.title.includes("Dhanteras"))).toBe(true);
    for (const start of ["2026-10-19", "2026-11-02", "2027-04-12", "2026-12-28"]) {
      const text = JSON.stringify(gen({ startDate: start, events: [], collections: [], offers: [] }).days);
      for (const f of styleFestivals) expect(text).not.toContain(f.name);
    }
  });
  it("fixed design days by business type", () => {
    expect(on(gen({ ...interior, startDate: "2027-04-20" }), "2027-04-27").some((x) => x.title.includes("World Design Day"))).toBe(true);
    expect(on(gen({ ...boutique, startDate: "2027-08-02" }), "2027-08-07").some((x) => x.title.includes("National Handloom Day"))).toBe(true);
    expect(JSON.stringify(gen({ startDate: "2027-08-02" }).days)).not.toContain("National Handloom Day");
  });
  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], specialities: [], collections: [], projects: [], hallmark: "", offers: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
