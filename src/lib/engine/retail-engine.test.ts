import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { EARLIER_PRICE, RETAIL_BANNED_WORDING, retailFestivals, retailPlaybook } from "@/data/playbooks/retail";
import { buildTags, packages } from "./core";
import { retailConfig } from "./categories/retail";
import { generateRetailPlan, type RetailAnswers, type Sale } from "./retail-engine";
import type { Plan } from "./types";

const sale = (over: Partial<Sale> = {}): Sale => ({ name: "Winter sale", start: "2026-11-20", end: "2026-11-25", offer: "Up to 20% off on select models", earlierPriceConfirmed: "no", ...over });
const base: RetailAnswers = {
  name: "Test Store", city: "Kanpur", type: "electronics", goals: ["sales", "footfall"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "launch", date: "2026-11-12", label: "New TV range" }],
  categories: ["LED TVs", "Washing machines", "Refrigerators"], brands: "Brand A, Brand B", priceRange: "₹8,000 – ₹1,50,000", emi: "No-cost EMI on select cards — terms as per bank",
  exchange: "Exchange your old TV — valuation in store", warranty: "Manufacturer warranty as per brand", delivery: "Delivery and installation within city limits",
  timings: "Daily 10 am – 9 pm", branches: "Swaroop Nagar and Kidwai Nagar", sales: [sale(), sale({ name: "Clearance", start: "2026-11-27", end: "", offer: "Was ₹40,000, now ₹32,000" })], onCamera: "some",
};
const gen = (over: Partial<RetailAnswers> = {}) => generateRetailPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

const variants: Partial<RetailAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { type: "clothing", categories: ["Sarees", "Kurtas"], brands: "" },
  { type: "furniture", categories: ["Sofas", "Beds"], emi: "", exchange: "" },
  { type: "mobile", onCamera: "none", shoot: "own" },
  { type: "general", categories: [], sales: [], events: [] },
  { goals: ["reviews"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
  { stage: "new", goals: [], startDate: "2026-12-28" },
];

describe("retail playbook", () => {
  const T = retailPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording and never quotes a price on its own", () => {
    for (const t of T) {
      expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(RETAIL_BANNED_WORDING);
      expect([t.title, t.hook].join(" | "), t.id).not.toMatch(EARLIER_PRICE);
      expect([t.title, t.hook].join(" | "), t.id).not.toMatch(/₹\s?\d/);
    }
  });
  it("bans the wording the brief lists", () => {
    for (const bad of ["Lowest price in town", "Best deals", "No.1 showroom", "Only 2 left!", "While stocks last", "Hurry, last chance"]) expect(bad, bad).toMatch(RETAIL_BANNED_WORDING);
    for (const ok of ["New arrivals", "Up to 20% off on select models", "No-cost EMI on select cards"]) expect(ok, ok).not.toMatch(RETAIL_BANNED_WORDING);
  });
});

describe("retail plan engine", () => {
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
      const tags = buildTags(retailConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = retailPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
  it("replaces client text that breaks the rules", () => {
    const p = gen({ categories: ["Lowest price TVs"], brands: "Best brands", sales: [sale({ offer: "Hurry! Only 2 left" })], events: [{ kind: "launch", date: "2026-11-12", label: "No.1 launch" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Lowest price|Best brands|Only 2 left|No\.1 launch/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(RETAIL_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
  it("shows customers only with consent", () => {
    const faceIds = new Set(retailPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });
});

describe("retail offers", () => {
  it("shows offers exactly as provided on the sale start", () => {
    const p = gen();
    expect(on(p, "2026-11-20").find((x) => x.templateId === "RP08")?.hook).toBe("Up to 20% off on select models");
    expect(on(p, "2026-11-20").find((x) => x.templateId === "RR19")?.hook).toBe("Up to 20% off on select models");
    expect(on(p, "2026-11-19").some((x) => x.platform === "whatsapp" && x.format === "broadcast")).toBe(true);
    expect(on(p, "2026-11-17").some((x) => x.templateId === "RP09")).toBe(true);
    expect(on(p, "2026-11-25").some((x) => x.title === "Winter sale ends today (as per your dates)")).toBe(true);
  });
  it("never shows a “was ₹X, now ₹Y” offer unless the earlier price is confirmed", () => {
    const p = gen();
    expect(JSON.stringify(p.days)).not.toContain("Was ₹40,000");
    expect(on(p, "2026-11-27").some((x) => x.templateId === "RP28")).toBe(true);
    expect(p.compliance?.join(" ")).toMatch(/Clearance: the offer quotes an earlier price you haven't confirmed/);
    const ok = gen({ sales: [sale({ name: "Clearance", start: "2026-11-27", end: "", offer: "Was ₹40,000, now ₹32,000", earlierPriceConfirmed: "yes" })] });
    expect(on(ok, "2026-11-27").find((x) => x.templateId === "RP08")?.hook).toBe("Was ₹40,000, now ₹32,000");
  });
  it("names only brands from the client's list and uses EMI and warranty terms verbatim", () => {
    const p = gen({ pkg: "premium" });
    for (const x of ig(p, "reel").concat(ig(p, "post")).filter((i) => ["RR24", "RP22"].includes(i.templateId))) expect(x.hook).toBe("Brand A, Brand B");
    for (const x of ig(p, "reel").concat(ig(p, "post")).filter((i) => ["RR06", "RP04"].includes(i.templateId))) expect(x.hook).toBe(base.emi);
    for (const x of ig(p, "reel").concat(ig(p, "post")).filter((i) => ["RR23", "RP19"].includes(i.templateId))) expect(x.hook).toBe(base.warranty);
    expect(items(gen({ brands: "", pkg: "premium" })).some((x) => ["RR24", "RP22"].includes(x.templateId))).toBe(false);
  });
});

describe("retail pinned dates", () => {
  it("launch reel on the day, teaser before", () => {
    const p = gen();
    expect(on(p, "2026-11-12").some((x) => x.templateId === "RR20")).toBe(true);
    expect(on(p, "2026-11-09").some((x) => x.templateId === "RP09")).toBe(true);
  });
  it("weekend pushes on Saturdays", () => {
    const p = gen({ sales: [], events: [] });
    expect(p.days.filter((d) => d.weekday === "Sat" && d.items.some((x) => x.templateId === "RP23")).length).toBe(2);
    for (const d of p.days.filter((x) => x.weekday === "Sat")) expect(d.items.some((x) => x.templateId === "RS10")).toBe(true);
  });
  it("never auto-schedules festivals whose date changes", () => {
    for (const start of ["2026-09-28", "2026-10-19", "2026-11-02", "2027-01-04"]) {
      const text = JSON.stringify(gen({ startDate: start, events: [], sales: [] }).days);
      for (const f of retailFestivals) expect(text).not.toContain(f.name);
    }
  });
  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], categories: [], brands: "", priceRange: "", emi: "", exchange: "", warranty: "", delivery: "", timings: "", branches: "", sales: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
