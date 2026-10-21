import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { REAL_ESTATE_BANNED_WORDING, buyingFestivals, realEstatePlaybook } from "@/data/playbooks/real-estate";
import { buildTags, packages } from "./core";
import { realEstateConfig } from "./categories/real-estate";
import { generateRealEstatePlan, type Project, type RealEstateAnswers } from "./real-estate-engine";
import type { Plan } from "./types";

const project = (over: Partial<Project> = {}): Project => ({
  name: "Test Greens", type: "apartments", location: "Kalyanpur", stage: "uc", rera: "TEST-RERA-123", units: "2 and 3 BHK", price: "Starting from ₹45 lakh",
  possession: "December 2028", launch: "", booking: "2026-11-12", handover: "", sample: "yes", ...over,
});
const base: RealEstateAnswers = {
  name: "Test Homes", city: "Kanpur", role: "builder", goals: ["visits"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "visitday", date: "2026-11-14", label: "Site-visit weekend" }],
  projects: [project(), project({ name: "Test Heights", rera: "", stage: "prelaunch", launch: "2026-11-20", booking: "" })],
  reraSite: "rera.example", agentRera: "", amenities: ["security", "park"], visit: "Sat–Sun, 10 am – 6 pm", siteAccess: "yes",
  banks: "", distances: ["Railway station: 8 km"], offer: "", onCamera: "some",
};
const gen = (over: Partial<RealEstateAnswers> = {}) => generateRealEstatePlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

const variants: Partial<RealEstateAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { onCamera: "none", shoot: "own" },
  { siteAccess: "no" },
  { stage: "new", goals: ["launch"] },
  { goals: ["inventory"], projects: [project({ stage: "ready", booking: "", handover: "2026-11-20" })], consent: "yes" },
  { goals: ["trust"], projects: [] },
  { projects: [project({ rera: "" })] },
  { role: "broker", goals: ["resale"], agentRera: "TEST-AGENT-9", projects: [] },
  { role: "broker", goals: ["resale"], agentRera: "", projects: [] },
  { offer: "Modular kitchen included, terms apply", events: [{ kind: "festive", date: "2026-11-08", label: "Dhanteras" }] },
  { banks: "Test Bank, Sample Bank", distances: ["Railway station: 8 km", "University: 6 km", "Hospital: 2 km"] },
  { platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
  { goals: [] },
  { startDate: "2027-03-29" },
];

describe("real estate playbook", () => {
  const T = realEstatePlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording", () => {
    for (const t of T) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(REAL_ESTATE_BANNED_WORDING);
  });
  it("puts the RERA line on every template that names a project", () => {
    for (const t of T.filter((x) => /\{project\}/.test(x.title + x.hook))) expect(t.note, t.id).toContain("{rera_line}");
  });
  it("gates offers, faces and listings", () => {
    for (const t of T.filter((x) => /\{offer\}/.test(x.title + x.hook))) expect(t.requires, t.id).toContain("has:offer");
    for (const t of T.filter((x) => x.faces && !x.pinnedOnly)) expect(t.requires, t.id).toContain("consent:yes");
    for (const t of T.filter((x) => /\{agent_rera\}/.test(x.note ?? ""))) expect(t.requires, t.id).toContain("has:agentrera");
  });
});

describe("real estate plan engine", () => {
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

  it("never schedules banned wording, and replaces client text that breaks it", () => {
    const p = gen({
      projects: [project({ price: "Assured returns of 12%" })],
      events: [{ kind: "expo", date: "2026-11-14", label: "Hurry — only 2 left!" }],
      distances: ["Best location in Kanpur"],
      offer: "Guaranteed appreciation",
    });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Assured returns|only 2 left|Best location|Guaranteed appreciation/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(REAL_ESTATE_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });

  it("only schedules templates whose tag rules pass", () => {
    for (const v of variants) {
      const a = { ...base, ...v };
      const tags = buildTags(realEstateConfig, a);
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = realEstatePlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
});

describe("RERA gate", () => {
  it("carries the RERA number and website on every project item", () => {
    const p = gen();
    const projectItems = items(p).filter((x) => x.platform === "instagram" && x.title.includes("Test Greens"));
    expect(projectItems.length).toBeGreaterThan(3);
    for (const x of projectItems) expect(`${x.note} ${x.hook}`).toContain("TEST-RERA-123");
    for (const x of projectItems.filter((i) => i.note)) expect(x.note).toContain("rera.example");
  });

  it("gives a project without a RERA number no selling or booking content, and says so", () => {
    const p = gen();
    expect(JSON.stringify(p.days)).not.toContain("Test Heights");
    expect(on(p, "2026-11-20").some((x) => /launch/i.test(x.title))).toBe(false);
    expect(p.compliance?.join(" ")).toMatch(/Test Heights has no RERA number/);
    const none = gen({ projects: [project({ rera: "" })] });
    expect(JSON.stringify(none.days)).not.toContain("Test Greens");
    expect(none.compliance?.join(" ")).toMatch(/brand and educational content only/);
  });

  it("brokers need their RERA agent registration for listings", () => {
    const without = gen({ role: "broker", goals: ["resale"], projects: [] });
    expect(items(without).some((x) => ["ER21", "ER22", "EP23", "EP24"].includes(x.templateId))).toBe(false);
    expect(without.compliance?.join(" ")).toMatch(/RERA agent registration/);
    const withReg = gen({ role: "broker", goals: ["resale"], agentRera: "TEST-AGENT-9", projects: [] });
    const listings = items(withReg).filter((x) => x.platform === "instagram" && ["ER21", "ER22", "EP23", "EP24"].includes(x.templateId));
    expect(listings.length).toBeGreaterThan(0);
    for (const x of listings) expect(x.note).toContain("TEST-AGENT-9");
  });

  it("shows prices and possession dates exactly as provided", () => {
    const p = gen();
    const priced = items(p).find((x) => x.templateId === "EP02");
    if (priced) expect(priced.hook).toContain("Starting from ₹45 lakh, terms apply");
    const all = gen({ pkg: "premium" });
    const poss = items(all).find((x) => x.templateId === "EP04");
    expect(poss?.hook).toContain("December 2028");
    expect(JSON.stringify(gen({ projects: [project({ price: "" })] }).days)).not.toContain("₹");
  });

  it("never invents an offer", () => {
    const festive = { events: [{ kind: "festive", date: "2026-11-08", label: "Dhanteras" }] };
    const noOffer = gen(festive);
    expect(items(noOffer).some((x) => x.templateId === "EP16")).toBe(false);
    expect(on(noOffer, "2026-11-08").some((x) => x.templateId === "EP12")).toBe(true);
    const withOffer = gen({ ...festive, offer: "Modular kitchen included, terms apply" });
    const o = on(withOffer, "2026-11-08").find((x) => x.templateId === "EP16");
    expect(o?.hook).toBe("Modular kitchen included, terms apply");
  });

  it("labels renders and never shows planned amenities as ready", () => {
    const p = gen({ pkg: "premium" });
    const am = items(p).find((x) => x.templateId === "ER13");
    expect(am?.hook).toMatch(/Planned amenities/);
    expect(am?.note).toContain("Artist's impression");
    const ready = gen({ pkg: "premium", projects: [project({ stage: "ready" })] });
    expect(items(ready).find((x) => x.templateId === "ER13")?.hook).toMatch(/as they are today/);
  });

  it("only shows buyers with consent", () => {
    const faceIds = new Set(realEstatePlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });
});

describe("real estate pinned dates", () => {
  it("bookings open: reel, post, WhatsApp broadcast and countdown", () => {
    const p = gen();
    expect(on(p, "2026-11-12").map((x) => x.templateId)).toEqual(expect.arrayContaining(["ER15", "EP14"]));
    expect(on(p, "2026-11-12").some((x) => x.platform === "whatsapp" && x.title.includes("TEST-RERA-123"))).toBe(true);
    for (const d of ["2026-11-09", "2026-11-10", "2026-11-11"]) expect(on(p, d).some((x) => x.title === "Countdown: Test Greens bookings open")).toBe(true);
  });

  it("launch and handover for registered projects", () => {
    const p = gen({ projects: [project({ launch: "2026-11-06", booking: "" }), project({ name: "Test Court", rera: "TEST-RERA-456", stage: "ready", booking: "", handover: "2026-11-21" })], consent: "yes" });
    expect(on(p, "2026-11-06").map((x) => x.templateId)).toEqual(expect.arrayContaining(["ER14", "EP13"]));
    expect(on(p, "2026-11-21").some((x) => x.templateId === "EP15" && x.title.includes("Test Court"))).toBe(true);
    expect(on(p, "2026-11-22").some((x) => x.templateId === "ER16")).toBe(true);
  });

  it("monthly site progress for projects under construction, only with site access", () => {
    expect(items(gen()).filter((x) => x.templateId === "ER01")).toHaveLength(1);
    expect(items(gen({ siteAccess: "no" })).some((x) => x.templateId === "ER01")).toBe(false);
  });

  it("site-visit weekend: invite 4 days before, highlights the day after", () => {
    const p = gen();
    expect(on(p, "2026-11-10").some((x) => x.templateId === "EP17")).toBe(true);
    expect(on(p, "2026-11-15").some((x) => x.templateId === "ER17")).toBe(true);
  });

  it("never auto-schedules festival buying days", () => {
    for (const start of ["2026-09-21", "2026-10-12", "2027-03-29", "2027-04-19"]) {
      const text = JSON.stringify(gen({ startDate: start, events: [] }).days);
      for (const f of buyingFestivals) expect(text).not.toContain(f.name);
    }
  });

  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], projects: [], amenities: [], visit: "", distances: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
