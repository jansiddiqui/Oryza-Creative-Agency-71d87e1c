import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { EMERGENCY_LINE, MEDICAL_BANNED_WORDING, healthDaysVarying } from "@/data/medical";
import { doctorPlaybook } from "@/data/playbooks/doctor";
import { hospitalPlaybook } from "@/data/playbooks/hospital";
import { buildTags, packages } from "./core";
import { doctorConfig, hospitalConfig } from "./categories/medical";
import { generateDoctorPlan, generateHospitalPlan, type DoctorAnswers, type HospitalAnswers } from "./medical-engine";
import type { Plan, Template } from "./types";

const hospital: HospitalAnswers = {
  name: "Test Care Hospital", city: "Kanpur", goals: ["camps", "footfall"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "youtube", "website"], optimize: ["instagram", "gbp"], startDate: "2026-11-02",
  practice: "multi", specialities: ["general", "eye"], doctors: "few", onCamera: "some", qualifications: "", opd: "Mon–Sat, 9 am – 2 pm",
  emergency: "yes", online: "yes", awarenessDays: [],
  events: [
    { kind: "camp", date: "2026-11-12", label: "Eye check-up camp" },
    { kind: "doctor", date: "2026-11-24", label: "Dr. Test joins Eye care" },
  ],
};

const doctor: DoctorAnswers = {
  name: "Dr. Test", city: "Kanpur", goals: ["authority"], stage: "active", consent: "no", shoot: "1", pkg: "growth",
  platforms: ["instagram", "whatsapp", "gbp", "youtube", "linkedin"], optimize: [], startDate: "2026-11-02",
  practice: "own", specialities: ["diabetes", "general"], doctors: "1", onCamera: "all", qualifications: "", opd: "Mon–Sat, 6 – 9 pm",
  emergency: "no", online: "yes", awarenessDays: [],
  events: [{ kind: "talk", date: "2026-11-10", label: "Diabetes awareness talk" }],
};

/** Answer overrides that fit either category. */
type Over = Partial<Omit<HospitalAnswers, "practice" | "goals" | "events">> & { practice?: string; goals?: string[]; events?: { kind: string; date: string; label?: string }[] };
type Cat = { name: string; gen: (a: never) => Plan; base: HospitalAnswers | DoctorAnswers; playbook: typeof hospitalPlaybook };
const cats: Cat[] = [
  { name: "hospital", gen: generateHospitalPlan as (a: never) => Plan, base: hospital, playbook: hospitalPlaybook },
  { name: "doctor", gen: generateDoctorPlan as (a: never) => Plan, base: doctor, playbook: doctorPlaybook },
];
const gen = (c: Cat, over: Over = {}) => c.gen({ ...c.base, ...over } as never);
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

/** A spread of answers per category, used by the "for every variant" checks. */
const variants = (c: Cat) => {
  const out: Over[] = [{}];
  for (const pkg of ["starter", "premium"] as const) out.push({ pkg });
  for (const consent of ["yes", "some"] as const) out.push({ consent });
  for (const onCamera of ["all", "none"] as const) out.push({ onCamera });
  for (const shoot of ["own", "weekly"] as const) out.push({ shoot });
  out.push({ emergency: "no", online: "no", opd: "" }, { stage: "new" }, { qualifications: "MBBS, MS (Ophthalmology)" });
  out.push({ startDate: "2026-09-14", specialities: ["cardiology"] }, { startDate: "2026-12-20" }, { startDate: "2027-03-01", specialities: ["dental", "ent"] });
  out.push({ goals: [] }, { platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] });
  if (c.name === "hospital") out.push({ practice: "single", doctors: "1" }, { goals: ["launch"] }, { goals: ["trust"] }, { goals: ["awareness"] });
  else out.push({ goals: ["discovery"] }, { goals: ["online"] }, { goals: ["footfall"] }, { practice: "hospital" });
  return out;
};

describe.each(cats)("$name playbook", (c) => {
  it("has 50+ templates with reels, posts and stories", () => {
    expect(c.playbook.templates.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(c.playbook.templates.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
  });

  it("has unique ids, hooks, and CTAs on every reel and post", () => {
    const ids = c.playbook.templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of c.playbook.templates) {
      expect(t.hook.length, t.id).toBeGreaterThan(5);
      if (t.format !== "story" && !t.title.includes("wishes")) expect(t.cta, t.id).toBeTruthy();
      if (t.format === "reel" && t.who === "Oryza shoots") expect(t.shots?.length, t.id).toBeGreaterThan(0);
    }
  });

  it("never uses wording the compliance rules ban", () => {
    for (const t of c.playbook.templates) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(MEDICAL_BANNED_WORDING);
  });

  it("puts the emergency line in every emergency template", () => {
    const emergency = c.playbook.templates.filter((t) => t.requires?.includes("has:emergency"));
    expect(emergency.length).toBeGreaterThan(0);
    for (const t of emergency) expect([t.hook, t.cta].join(" "), t.id).toContain(EMERGENCY_LINE);
  });

  it("only uses faces with a consent requirement", () => {
    for (const t of c.playbook.templates.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe.each(cats)("$name plan engine", (c) => {
  it("is deterministic", () => {
    for (const v of variants(c)) expect(hash(gen(c, v))).toBe(hash(gen(c, v)));
  });

  it("matches package volumes", () => {
    for (const pkg of ["starter", "growth", "premium"] as const)
      for (const onCamera of ["all", "none"] as const) {
        const p = gen(c, { pkg, onCamera });
        expect(ig(p, "reel").length).toBe(packages[pkg].reels);
        expect(ig(p, "post").length).toBe(packages[pkg].posts);
        const storyDays = p.days.filter((d) => d.items.some((x) => x.format === "story")).length;
        expect(storyDays).toBeGreaterThanOrEqual(pkg === "starter" ? 16 : 30);
      }
  });

  it("leaves no variable unfilled anywhere in the plan", () => {
    for (const v of variants(c)) expect(JSON.stringify(gen(c, v)), JSON.stringify(v)).not.toMatch(/\{\w+\}/);
  });

  it("never schedules a template that breaks its tag rules or the wording rules", () => {
    const config = c.name === "hospital" ? hospitalConfig : doctorConfig;
    for (const v of variants(c)) {
      const a = { ...c.base, ...v };
      const tags = buildTags(config as never, a as never);
      for (const x of items(gen(c, v)).filter((i) => i.platform === "instagram")) {
        const t = c.playbook.templates.find((y) => y.id === x.templateId) as Template;
        expect([x.title, x.hook, x.cta ?? ""].join(" | ")).not.toMatch(MEDICAL_BANNED_WORDING);
        if (x.pinnedReason) continue;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, `${t.id} requires ${t.requires}`).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, `${t.id} blocked by ${t.blockedBy}`).toBe(false);
      }
    }
  });

  it("schedules no patient faces or testimonials without written consent", () => {
    const faceIds = new Set(c.playbook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const consent of ["no", "some"] as const) for (const pkg of ["starter", "premium"] as const) {
      const p = gen(c, { consent, pkg });
      expect(items(p).filter((x) => faceIds.has(x.templateId))).toEqual([]);
      expect(p.compliance?.join(" ")).toContain("No patient faces");
    }
    const withConsent = gen(c, { consent: "yes", pkg: "premium" });
    expect(items(withConsent).some((x) => faceIds.has(x.templateId))).toBe(true);
  });

  it("carries the emergency line on emergency items, and none without an emergency service", () => {
    const withEmergency = items(gen(c, { emergency: "yes", pkg: "premium" }));
    const em = withEmergency.filter((x) => c.playbook.templates.find((t) => t.id === x.templateId)?.requires?.includes("has:emergency"));
    expect(em.length).toBeGreaterThan(0);
    for (const x of em) expect(`${x.hook} ${x.cta}`).toMatch(/call 112/);
    const without = items(gen(c, { emergency: "no", pkg: "premium" }));
    expect(without.filter((x) => c.playbook.templates.find((t) => t.id === x.templateId)?.requires?.includes("has:emergency"))).toEqual([]);
  });

  it("marks medical items for the doctor's approval", () => {
    const p = gen(c);
    const noted = items(p).filter((x) => x.note);
    expect(noted.length).toBeGreaterThan(0);
    for (const x of noted) expect(x.note).toMatch(/doctor approves|consent/i);
    expect(p.compliance?.[0]).toMatch(/Doctor approves/);
  });

  it("keeps doctors off camera when asked", () => {
    const p = gen(c, { onCamera: "none", pkg: "premium" });
    for (const x of ig(p, "reel")) {
      const t = c.playbook.templates.find((y) => y.id === x.templateId)!;
      expect(t.shots?.some((s) => /^(new |lead )?(doctor|nursing head)\b/i.test(s)) ?? false, t.id).toBe(false);
    }
    expect(p.compliance?.join(" ")).toContain("off camera");
  });

  it("shows qualifications only exactly as provided", () => {
    const quals = "MBBS, MD (General Medicine)";
    expect(JSON.stringify(gen(c))).not.toMatch(/MBBS|MD\b/);
    const p = gen(c, { qualifications: quals });
    expect(p.compliance?.join(" ")).toContain(quals);
    const bad = gen(c, { qualifications: "MBBS, best doctor award" });
    expect(JSON.stringify(bad)).not.toContain("best doctor award");
    expect(bad.compliance?.join(" ")).toMatch(/left out/);
  });

  it("replaces event names that break the wording rules", () => {
    const p = gen(c, { events: [{ kind: "camp", date: "2026-11-12", label: "Free check-up camp — 50% off" }] });
    expect(JSON.stringify(p)).not.toMatch(/Free check-up|50% off/);
    expect(p.compliance?.join(" ")).toMatch(/replaced with a neutral name/);
  });

  it("builds a valid plan from minimal answers", () => {
    const p = gen(c, { name: "", city: "", goals: [], events: [], specialities: [], platforms: [], optimize: [], opd: "", qualifications: "" });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.deliverables.map((d) => d.platform)).toEqual(["instagram"]);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });

  it("does not auto-schedule awareness days whose date changes each year", () => {
    for (const v of variants(c)) {
      const text = JSON.stringify(gen(c, v).days);
      for (const d of healthDaysVarying) expect(text).not.toContain(d.name);
    }
  });
});

describe("pinned dates", () => {
  const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;

  it("hospital camp: registration 5 days before, countdown, live, highlights and thank-you", () => {
    const p = generateHospitalPlan(hospital);
    expect(on(p, "2026-11-07").some((x) => x.templateId === "HP09" && x.title.includes("Eye check-up camp"))).toBe(true);
    expect(on(p, "2026-11-07").some((x) => x.platform === "whatsapp" && x.format === "broadcast")).toBe(true);
    for (const d of ["2026-11-09", "2026-11-10", "2026-11-11"]) expect(on(p, d).some((x) => x.title === "Countdown: Eye check-up camp")).toBe(true);
    expect(on(p, "2026-11-12").some((x) => x.title === "Live from Eye check-up camp")).toBe(true);
    expect(on(p, "2026-11-13").some((x) => x.templateId === "HR15")).toBe(true);
    expect(on(p, "2026-11-14").some((x) => x.templateId === "HP10")).toBe(true);
  });

  it("hospital doctor launch: reel and post on the day, teaser the day before", () => {
    const p = generateHospitalPlan(hospital);
    expect(on(p, "2026-11-24").map((x) => x.templateId)).toEqual(expect.arrayContaining(["HR13", "HP11"]));
    expect(on(p, "2026-11-23").some((x) => x.title === "Coming tomorrow: Dr. Test joins Eye care")).toBe(true);
    const offCamera = generateHospitalPlan({ ...hospital, onCamera: "none" });
    expect(on(offCamera, "2026-11-24").some((x) => x.templateId === "HR13")).toBe(false);
    expect(on(offCamera, "2026-11-24").some((x) => x.templateId === "HP11")).toBe(true);
  });

  it("doctor talk: announcement 4 days before and takeaways the day after", () => {
    const p = generateDoctorPlan(doctor);
    expect(on(p, "2026-11-06").some((x) => x.templateId === "DP13")).toBe(true);
    expect(on(p, "2026-11-11").some((x) => x.templateId === "DR21")).toBe(true);
  });

  it("awareness days land on their fixed date, matched to the specialities", () => {
    const p = generateHospitalPlan({ ...hospital, specialities: ["cardiology"], startDate: "2026-09-14", events: [] });
    expect(on(p, "2026-09-29").some((x) => x.templateId === "HP08" && x.title.includes("World Heart Day"))).toBe(true);
    expect(on(p, "2026-09-29").some((x) => x.title === "Quiz: World Heart Day")).toBe(true);
    expect(on(p, "2026-10-10").some((x) => x.title.includes("World Mental Health Day"))).toBe(false);
    const chosen = generateHospitalPlan({ ...hospital, specialities: ["cardiology"], startDate: "2026-09-14", events: [], awarenessDays: ["doctors"] });
    expect(JSON.stringify(chosen.days)).not.toContain("World Heart Day");
  });

  it("awareness days work across the new year", () => {
    const p = generateDoctorPlan({ ...doctor, specialities: ["oncology"], startDate: "2027-01-20", events: [] });
    expect(on(p, "2027-02-04").some((x) => x.title.includes("World Cancer Day"))).toBe(true);
  });

  it("festival greetings never take a day that already has a pinned post", () => {
    const p = generateHospitalPlan({ ...hospital, specialities: ["diabetes"], events: [], startDate: "2026-11-01" });
    const day = on(p, "2026-11-14").filter((x) => x.platform === "instagram" && x.format === "post");
    expect(day.some((x) => x.title.includes("World Diabetes Day"))).toBe(true);
    expect(day.some((x) => x.title.includes("Children's Day"))).toBe(false);
    const greeting = generateHospitalPlan({ ...hospital, specialities: ["eye"], events: [], startDate: "2026-11-01" });
    expect(on(greeting, "2026-11-14").some((x) => x.templateId === "HP07" && x.title.includes("Children's Day"))).toBe(true);
  });

  it("puts the GBP review and hours tasks in every plan with Google Business Profile", () => {
    for (const p of [generateHospitalPlan(hospital), generateDoctorPlan(doctor)]) {
      const gbp = items(p).filter((x) => x.platform === "gbp").map((x) => x.templateId);
      expect(gbp).toEqual(expect.arrayContaining(["GBP-H", "GBP-R", "GBP-Q", "GBP-PH"]));
      expect(items(p).find((x) => x.templateId === "GBP-R")!.title).toMatch(/never paid, scripted/);
    }
  });
});
