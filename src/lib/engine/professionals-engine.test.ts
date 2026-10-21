import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CA_CTA, CA_NOTE, LAW_CTA, LAW_NOTE, PRO_BANNED_WORDING, STRICT_BLOCKED, professionalsPlaybook } from "@/data/playbooks/professionals";
import { buildTags, packages } from "./core";
import { professionalsConfig } from "./categories/professionals";
import { generateProfessionalsPlan, type Profession, type ProfessionalAnswers } from "./professionals-engine";
import type { Plan } from "./types";

const base: ProfessionalAnswers = {
  name: "Test Practice", city: "Kanpur", profession: "consultant", goals: ["clients", "authority"], stage: "revive", consent: "yes", shoot: "1", pkg: "growth",
  platforms: ["instagram", "linkedin", "gbp", "youtube", "facebook", "whatsapp"], optimize: [], startDate: "2026-11-16",
  events: [{ kind: "webinar", date: "2026-11-28", label: "Year-end planning webinar" }],
  areas: ["Business strategy", "Leadership"], experience: "15 years in practice", credentials: "MBA (as provided)", team: "small", languages: "Hindi, English",
  deadlines: [{ name: "GSTR-3B (as notified)", date: "2026-11-20" }], clients: [{ name: "Client A", permission: "yes" }, { name: "Client B", permission: "no" }], onCamera: "all",
};
const gen = (over: Partial<ProfessionalAnswers> = {}) => generateProfessionalsPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const law: Partial<ProfessionalAnswers> = { profession: "lawyer", areas: ["Property law", "Family law"], credentials: "Enrolled with the Bar Council of Uttar Pradesh (as provided)" };
const ca: Partial<ProfessionalAnswers> = { profession: "ca", areas: ["GST", "Income tax"] };

const variants: Partial<ProfessionalAnswers>[] = [
  {}, { pkg: "starter" }, { pkg: "premium" }, { onCamera: "none", shoot: "own" },
  law, { ...law, pkg: "premium" }, { ...law, startDate: "2026-11-16" },
  ca, { ...ca, pkg: "premium" }, { ...ca, profession: "cs" }, { ...ca, startDate: "2026-06-22" },
  { stage: "new", goals: [], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
];

describe("professionals playbook", () => {
  const T = professionalsPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording, and every soliciting template is blocked in strict modes", () => {
    for (const t of T) {
      expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(PRO_BANNED_WORDING);
      if (STRICT_BLOCKED.test([t.title, t.hook, t.cta ?? ""].join(" | ")) || t.faces || /\{client\}/.test(t.title + t.hook)) {
        expect(t.blockedBy, t.id).toEqual(expect.arrayContaining(["mode:law", "mode:ca"]));
      }
    }
  });
});

describe("professionals plan engine", () => {
  it("is deterministic", () => {
    for (const v of variants) expect(hash(gen(v))).toBe(hash(gen(v)));
  });
  it("matches package volumes for every variant and mode", () => {
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
      const tags = buildTags(professionalsConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = professionalsPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });
});

describe("lawyer mode (strict)", () => {
  const p = gen({ ...law, pkg: "premium" });
  it("blocks solicitation CTAs, testimonials, results, fees and client names", () => {
    for (const x of items(p)) {
      expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | "), `${x.templateId} ${x.title}`).not.toMatch(STRICT_BLOCKED);
      expect([x.title, x.hook ?? ""].join(" | ")).not.toMatch(/Client A|Client B/);
    }
    const blocked = new Set(professionalsPlaybook.templates.filter((t) => t.blockedBy?.includes("mode:law")).map((t) => t.id));
    expect(items(p).filter((x) => blocked.has(x.templateId))).toEqual([]);
    expect(items(p).some((x) => x.platform === "gbp" && x.templateId === "GBP-R")).toBe(false);
  });
  it("uses only the legal-awareness CTA and puts the note on every item", () => {
    for (const x of items(p)) {
      if (x.cta) expect(x.cta).toBe(LAW_CTA);
      expect(x.note, `${x.platform} ${x.title}`).toContain(LAW_NOTE);
    }
    expect(p.compliance?.join(" ")).toMatch(/Confirm with your State Bar Council before posting/);
  });
  it("replaces client text that solicits or claims results", () => {
    const q = gen({ ...law, areas: ["Top criminal lawyer", "Won 100 cases", "Family law"], experience: "Free consultation for every case", events: [{ kind: "webinar", date: "2026-11-28", label: "Book a consultation day" }] });
    expect(JSON.stringify(q.days)).not.toMatch(/Top criminal|Won 100|Free consultation|Book a consultation/);
    expect(q.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
  it("marks Constitution Day (26 Nov) for lawyers only", () => {
    expect(on(p, "2026-11-26").some((x) => x.templateId === "PR21")).toBe(true);
    expect(on(gen({ ...ca }), "2026-11-26").some((x) => x.templateId === "PR21")).toBe(false);
  });
});

describe("CA / CS mode (strict)", () => {
  for (const profession of ["ca", "cs"] as Profession[]) {
    const p = gen({ ...ca, profession, pkg: "premium" });
    it(`${profession}: blocks client names, testimonials, result claims, fees and solicitation`, () => {
      for (const x of items(p)) {
        expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | "), `${x.templateId} ${x.title}`).not.toMatch(STRICT_BLOCKED);
        if (x.cta) expect(x.cta).toBe(CA_CTA);
        expect(x.note).toContain(CA_NOTE);
      }
      const q = gen({ ...ca, profession, areas: ["Saved ₹10 lakh tax for clients", "GST"], experience: "Best CA in Kanpur" });
      expect(JSON.stringify(q.days)).not.toMatch(/Saved ₹10 lakh|Best CA/);
    });
  }
  it("uses only deadlines the client provided, with countdowns, marked verify", () => {
    const p = gen({ ...ca, startDate: "2026-11-02", events: [] });
    expect(on(p, "2026-11-13").find((x) => x.templateId === "PP05")?.hook).toBe("Due 20 Nov — what to keep ready");
    expect(on(p, "2026-11-20").some((x) => x.templateId === "PP06")).toBe(true);
    for (const d of ["2026-11-17", "2026-11-18", "2026-11-19"]) expect(on(p, d).some((x) => x.title === "GSTR-3B (as notified) — due 20 Nov")).toBe(true);
    for (const x of items(p).filter((i) => ["PP05", "PP06", "PR08"].includes(i.templateId) && i.platform === "instagram")) expect(x.note).toMatch(/verify against the official notification/);
    expect(JSON.stringify(gen({ ...ca, startDate: "2026-11-02", deadlines: [] }).days)).not.toMatch(/Reminder:|due today/i);
    expect(JSON.stringify(gen({}).days)).not.toContain("GSTR-3B");
  });
  it("marks CA Day (1 Jul) for CAs only", () => {
    expect(on(gen({ ...ca, startDate: "2026-06-22" }), "2026-07-01").some((x) => x.title.includes("CA Day"))).toBe(true);
    expect(on(gen({ ...ca, profession: "cs", startDate: "2026-06-22" }), "2026-07-01").some((x) => x.title.includes("CA Day"))).toBe(false);
  });
});

describe("consultant mode (standard)", () => {
  const p = gen({ pkg: "premium" });
  it("allows normal CTAs, permitted case studies and consented testimonials", () => {
    expect(items(p).some((x) => x.cta === "Book a discovery call")).toBe(true);
    const cases = ig(p, "reel").concat(ig(p, "post")).filter((x) => ["PR13", "PP13"].includes(x.templateId));
    expect(cases.length).toBeGreaterThan(0);
    for (const x of cases) expect(x.title).toContain("Client A");
    expect(JSON.stringify(p.days)).not.toContain("Client B");
  });
  it("never schedules testimonials without consent or guaranteed outcomes", () => {
    const faceIds = new Set(professionalsPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    expect(items(gen({ consent: "no", pkg: "premium" })).filter((x) => faceIds.has(x.templateId))).toEqual([]);
    const q = gen({ areas: ["Guaranteed six-figure income coaching", "Leadership"] });
    expect(JSON.stringify(q.days)).not.toMatch(/Guaranteed|six-figure/i);
  });
  it("builds a valid plan from minimal answers", () => {
    const q = gen({ name: "", city: "", goals: [], events: [], areas: [], experience: "", credentials: "", languages: "", deadlines: [], clients: [], platforms: [], optimize: [] });
    expect(q.days).toHaveLength(30);
    expect(ig(q, "reel").length).toBe(packages.growth.reels);
    expect(ig(q, "post").length).toBe(packages.growth.posts);
    expect(q.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(q)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
