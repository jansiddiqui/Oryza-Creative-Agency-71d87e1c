import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { COACHING_BANNED_WORDING, coachingPlaybook } from "@/data/playbooks/coaching";
import { buildTags, packages } from "./core";
import { coachingConfig } from "./categories/coaching";
import { generateCoachingPlan, type CoachingAnswers, type VerifiedResult } from "./coaching-engine";
import type { Plan } from "./types";

const result = (over: Partial<VerifiedResult> = {}): VerifiedResult => ({
  student: "A. Student", exam: "JEE Main 2026", score: "98.2 percentile", course: "Two-year classroom programme", duration: "2 years", paid: "yes", consent: "yes", ...over,
});
const base: CoachingAnswers = {
  name: "Test Academy", city: "Kanpur", type: "jee", goals: ["admissions", "demo"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "seminar", date: "2026-11-08", label: "Parent orientation" }, { kind: "results", date: "2026-11-20", label: "" }],
  courses: ["JEE Main Physics", "JEE Main Maths"], age: "school", mode: "hybrid",
  batches: [{ name: "Target batch", course: "JEE Main", start: "2026-11-16", timing: "Mon–Sat 4–7 pm", mode: "offline" }],
  demo: "Every Saturday, 11 am", onCamera: "all",
  results: [result(), result({ student: "B. Student", score: "", exam: "NEET 2026" })],
  fees: "₹60,000 per year (as provided)", scholarship: "", material: "yes", testSeries: "yes", exams: [{ name: "JEE Main Session 1", date: "2026-11-28" }],
};
const gen = (over: Partial<CoachingAnswers> = {}) => generateCoachingPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const RESULT_TEMPLATES = new Set(coachingPlaybook.templates.filter((t) => /\{student\}/.test(t.title + t.hook)).map((t) => t.id));

const variants: Partial<CoachingAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { results: [] },
  { results: [result({ consent: "no" }), result({ paid: "" }), result({ duration: "" }), result({ course: "" })] },
  { type: "boards", goals: ["trust"], age: "school", mode: "offline", onCamera: "none" },
  { type: "govt", age: "college", mode: "online", goals: ["results"] },
  { type: "skill", goals: ["launch"], courses: [], batches: [], demo: "", exams: [] },
  { type: "language", shoot: "own", startDate: "2027-01-04" },
  { type: "computer", platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"], startDate: "2026-08-31" },
  { stage: "new", goals: [] },
];

describe("coaching playbook", () => {
  const T = coachingPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording (guarantees, superlatives, seat scarcity, fear or pressure)", () => {
    for (const t of T) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(COACHING_BANNED_WORDING);
  });
  it("bans the wording the brief lists", () => {
    for (const bad of ["Guaranteed selection", "100% results", "India's top coaching", "Best faculty", "No.1 institute", "Last 5 seats", "Don't fail this year", "Exam pressure? Join now", "Selection pakka"])
      expect(bad, bad).toMatch(COACHING_BANNED_WORDING);
    for (const ok of ["Good luck today", "A calm revision plan", "Demo class this Saturday", "Verified result"]) expect(ok, ok).not.toMatch(COACHING_BANNED_WORDING);
  });
  it("carries the full disclosure on every result template", () => {
    for (const id of RESULT_TEMPLATES) {
      const t = T.find((x) => x.id === id)!;
      for (const v of ["{student}", "{score}", "{r_exam}", "{r_course}", "{duration}", "{paid_line}"]) expect(`${t.hook} ${t.note}`, `${id} ${v}`).toContain(v);
      expect(t.requires).toContain("has:results");
    }
    for (const t of T.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe("coaching plan engine", () => {
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
      const tags = buildTags(coachingConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = coachingPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });

  it("never schedules banned wording and replaces client text that uses it", () => {
    const p = gen({ courses: ["Guaranteed selection batch", "JEE Main Maths"], fees: "Last 5 seats left!", events: [{ kind: "seminar", date: "2026-11-08", label: "Best toppers' seminar" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Guaranteed|Last 5 seats|Best toppers/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(COACHING_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });
});

describe("result disclosures", () => {
  it("shares only results with every disclosure, each at most twice in different formats", () => {
    const p = gen({ pkg: "premium" });
    const res = items(p).filter((x) => x.platform === "instagram" && (RESULT_TEMPLATES.has(x.templateId) || x.templateId === "CP12"));
    expect(res.length).toBeGreaterThan(0);
    for (const x of res) {
      expect(x.title).toContain("A. Student");
      expect(x.hook).toBe("98.2 percentile in JEE Main 2026 · Course: Two-year classroom programme, 2 years · paid course");
      expect(x.note).toMatch(/Written consent on file/);
    }
    expect(JSON.stringify(p.days)).not.toContain("B. Student");
    expect(p.compliance?.join(" ")).toMatch(/1 result was left out because a disclosure was missing/);
  });

  it("blocks a result when any single field is missing", () => {
    const fields: (keyof VerifiedResult)[] = ["student", "exam", "score", "course", "duration", "paid", "consent"];
    for (const f of fields) {
      const p = gen({ pkg: "premium", results: [result({ [f]: f === "consent" ? "no" : "" } as Partial<VerifiedResult>)] });
      expect(items(p).filter((x) => RESULT_TEMPLATES.has(x.templateId) || x.templateId === "CP12"), f).toEqual([]);
      expect(p.compliance?.join(" ")).toMatch(/No result posts are scheduled/);
    }
  });

  it("does not promote a result day without a verified result", () => {
    const p = gen({ results: [] });
    expect(JSON.stringify(p.days)).not.toMatch(/Result day/);
    expect(on(p, "2026-11-20").some((x) => x.templateId === "CP12")).toBe(false);
    expect(on(gen(), "2026-11-20").some((x) => x.templateId === "CP12")).toBe(true);
  });

  it("shows students only with consent", () => {
    const faceIds = new Set(coachingPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });
});

describe("coaching pinned dates", () => {
  it("batch start: demo pushes a week before, reel before, countdown and post on the day", () => {
    const p = gen();
    expect(on(p, "2026-11-09").some((x) => x.templateId === "CP15")).toBe(true);
    expect(on(p, "2026-11-09").some((x) => x.platform === "whatsapp" && x.format === "broadcast")).toBe(true);
    expect(on(p, "2026-11-13").some((x) => x.templateId === "CR24")).toBe(true);
    for (const d of ["2026-11-13", "2026-11-14", "2026-11-15"]) expect(on(p, d).some((x) => x.title === "Countdown: Target batch starts")).toBe(true);
    expect(on(p, "2026-11-16").some((x) => x.templateId === "CP14")).toBe(true);
  });

  it("exam dates: calm plan 10 days before, checklist the day before, calm countdown — never pressure", () => {
    const p = gen();
    expect(on(p, "2026-11-18").some((x) => x.templateId === "CP16")).toBe(true);
    expect(on(p, "2026-11-27").some((x) => x.templateId === "CP17")).toBe(true);
    expect(on(p, "2026-11-28").some((x) => x.title === "JEE Main Session 1 today: good luck")).toBe(true);
    for (const x of items(p).filter((i) => i.title.includes("JEE Main Session 1"))) expect(`${x.title} ${x.hook}`).not.toMatch(COACHING_BANNED_WORDING);
  });

  it("Teachers' Day and National Youth Day", () => {
    expect(on(gen({ startDate: "2026-08-31", events: [], batches: [], exams: [] }), "2026-09-05").some((x) => x.title.includes("Teachers' Day"))).toBe(true);
    expect(on(gen({ startDate: "2027-01-04", events: [], batches: [], exams: [] }), "2027-01-12").some((x) => x.title.includes("National Youth Day"))).toBe(true);
  });

  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], courses: [], batches: [], demo: "", results: [], fees: "", exams: [], platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
