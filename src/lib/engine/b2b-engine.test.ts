import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { B2B_BANNED_WORDING, b2bPlaybook } from "@/data/playbooks/b2b";
import { buildTags, packages } from "./core";
import { b2bConfig } from "./categories/b2b";
import { generateB2bPlan, type B2bAnswers } from "./b2b-engine";
import type { Plan } from "./types";

const base: B2bAnswers = {
  name: "Test Industries", city: "Kanpur", type: "manufacturer", goals: ["enquiries"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "linkedin", "gbp", "website", "whatsapp"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "fair", date: "2026-11-18", label: "Test Leather Fair" }, { kind: "launch", date: "2026-11-25", label: "New work boot" }],
  products: ["Leather gloves", "Safety shoes"], industries: ["Construction", "Manufacturing"],
  certifications: [{ name: "ISO 9001:2015", number: "TEST-123", validTill: "Mar 2028" }, { name: "BIS", number: "", validTill: "" }],
  capacity: "20,000 pairs a month", moq: "500 pairs", leadTime: "3–4 weeks", markets: "UAE, UK", years: "25 years", sustainability: "Water recycling at the tannery (as provided)",
  customers: [{ name: "Customer A", permission: "yes" }, { name: "Customer B", permission: "no" }, { name: "Customer C", permission: "" }],
  factory: "yes", staffConsent: "yes", onCamera: "some",
};
const gen = (over: Partial<B2bAnswers> = {}) => generateB2bPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

const variants: Partial<B2bAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium" },
  { type: "distributor", factory: "no", goals: ["dealers"] },
  { type: "exporter", goals: ["export"], staffConsent: "no", onCamera: "none" },
  { type: "services", certifications: [], customers: [], shoot: "own" },
  { goals: ["hiring"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"], startDate: "2026-09-07" },
  { stage: "new", goals: [], events: [] },
];

describe("b2b playbook", () => {
  const T = b2bPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording or quotes figures on its own", () => {
    for (const t of T) {
      expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(B2B_BANNED_WORDING);
      expect([t.title, t.hook].join(" | ").replace(/\{\w+\}/g, ""), t.id).not.toMatch(/ISO|BIS|CE mark|₹|\d+\s?(pairs|tons|tonnes|units|pieces|years|%)/);
    }
  });
  it("bans superlatives, comparisons and anonymised name-drops", () => {
    for (const bad of ["India's leading manufacturer", "Best quality", "Better than competitors", "Supplier to a leading textile brand", "Trusted by a well-known retailer", "World-class factory"]) expect(bad, bad).toMatch(B2B_BANNED_WORDING);
    for (const ok of ["Leather gloves", "ISO 9001:2015", "Water recycling at the tannery"]) expect(ok, ok).not.toMatch(B2B_BANNED_WORDING);
  });
});

describe("b2b plan engine", () => {
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
      const tags = buildTags(b2bConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = b2bPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
  it("replaces client text that breaks the rules", () => {
    const p = gen({ products: ["India's best gloves", "Safety shoes"], capacity: "Largest capacity in UP", events: [{ kind: "fair", date: "2026-11-18", label: "Leading fair" }] });
    expect(JSON.stringify(p.days)).not.toMatch(/best gloves|Largest capacity|Leading fair/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(B2B_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
});

describe("b2b facts and permissions", () => {
  it("names only customers with written permission, never anyone else", () => {
    const p = gen({ pkg: "premium" });
    const text = JSON.stringify(p);
    expect(text).toContain("Customer A");
    expect(JSON.stringify(p.days)).not.toMatch(/Customer B|Customer C/);
    expect(p.compliance?.join(" ")).toMatch(/2 customers are left out entirely/);
    const none = gen({ customers: [{ name: "Customer B", permission: "no" }], pkg: "premium" });
    expect(items(none).some((x) => ["BR15", "BP10"].includes(x.templateId))).toBe(false);
  });
  it("shows certifications with numbers exactly as typed, and drops ones without a number", () => {
    const p = gen({ pkg: "premium" });
    const certs = ig(p, "post").concat(ig(p, "reel")).filter((x) => ["BP04", "BR08", "BP24"].includes(x.templateId));
    expect(certs.length).toBeGreaterThan(0);
    for (const x of certs) {
      expect(x.hook + x.title).toContain("ISO 9001:2015 — No. TEST-123, valid till Mar 2028");
      expect(x.hook + x.title).not.toMatch(/BIS —/);
    }
  });
  it("uses figures only as provided", () => {
    const p = gen({ pkg: "premium" });
    for (const x of ig(p, "post").filter((i) => i.templateId === "BP05")) expect(x.hook).toBe("20,000 pairs a month");
    for (const x of ig(p, "post").concat(ig(p, "reel")).filter((i) => ["BP06", "BR14"].includes(i.templateId))) expect(x.hook).toBe("MOQ: 500 pairs · Lead time: 3–4 weeks");
    const bare = gen({ capacity: "", moq: "", leadTime: "", markets: "", years: "", pkg: "premium" });
    expect(items(bare).some((x) => ["BP05", "BP06", "BR14", "BR18", "BP16", "BP11"].includes(x.templateId))).toBe(false);
  });
  it("puts staff on camera only with consent", () => {
    const staff = new Set(b2bPlaybook.templates.filter((t) => t.requires?.includes("staff:yes")).map((t) => t.id));
    expect(items(gen({ staffConsent: "no", pkg: "premium" })).filter((x) => staff.has(x.templateId))).toEqual([]);
  });
});

describe("b2b pinned dates", () => {
  it("trade fair: invite, countdown, live, highlights and follow-up", () => {
    const p = gen();
    expect(on(p, "2026-11-13").some((x) => x.templateId === "BP07")).toBe(true);
    expect(on(p, "2026-11-13").some((x) => x.platform === "whatsapp" && x.format === "broadcast")).toBe(true);
    expect(on(p, "2026-11-16").some((x) => x.templateId === "BR09")).toBe(true);
    for (const d of ["2026-11-15", "2026-11-16", "2026-11-17"]) expect(on(p, d).some((x) => x.title === "Countdown: Test Leather Fair")).toBe(true);
    expect(on(p, "2026-11-18").some((x) => x.title === "Live from Test Leather Fair")).toBe(true);
    expect(on(p, "2026-11-19").some((x) => x.templateId === "BR10")).toBe(true);
    expect(on(p, "2026-11-21").some((x) => x.templateId === "BP08")).toBe(true);
  });
  it("product launch reel and post on the day", () => {
    expect(on(gen(), "2026-11-25").map((x) => x.templateId)).toEqual(expect.arrayContaining(["BR11", "BP13"]));
  });
  it("fixed days: Engineers' Day and World Standards Day", () => {
    expect(on(gen({ startDate: "2026-09-07", events: [] }), "2026-09-15").some((x) => x.templateId === "BP26")).toBe(true);
    expect(on(gen({ startDate: "2026-10-05", events: [] }), "2026-10-14").some((x) => x.title.includes("World Standards Day"))).toBe(true);
    expect(JSON.stringify(gen({ type: "distributor", factory: "no", startDate: "2026-09-07", events: [] }).days)).not.toContain("Engineers");
  });
  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], products: [], industries: [], certifications: [], capacity: "", moq: "", leadTime: "", markets: "", years: "", sustainability: "", customers: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
