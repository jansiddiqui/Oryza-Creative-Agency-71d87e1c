import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POLITICAL_BANNED_WORDING, politicalPlaybook } from "@/data/playbooks/political";
import { buildTags, packages } from "./core";
import { politicalConfig } from "./categories/political";
import { generatePoliticalPlan, type PoliticalAnswers } from "./political-engine";
import type { Plan } from "./types";

const base: PoliticalAnswers = {
  name: "Test Leader", city: "Kanpur", role: "mla", goals: ["connect", "work"], stage: "active", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "x"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "youth", date: "2026-11-06", label: "Youth cricket meet" }, { kind: "inauguration", date: "2026-11-15", label: "Road opening" }],
  party: "", area: "Test Nagar", district: "Kanpur Nagar", languages: ["hindi"], issues: ["Drainage", "Street lights", ""],
  meetingDay: "1", meetingTime: "10 am – 1 pm at the office", election: "upcoming", mccStart: "2026-11-10", pollingDate: "2026-11-25", resultDate: "2026-11-28", pollReminder: "no",
  onCamera: "all", team: "small", grievance: "both", grievanceContact: "Office, Main Road", work: [{ work: "Community hall repaired", date: "2026-09-12", place: "Ward 4" }],
};
const gen = (over: Partial<PoliticalAnswers> = {}) => generatePoliticalPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const noElection = { election: "none" as const, mccStart: "", pollingDate: "", resultDate: "" };

const variants: Partial<PoliticalAnswers>[] = [
  {},
  noElection,
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { onCamera: "none", shoot: "own" },
  { goals: ["campaign"] },
  { goals: ["youth"], ...noElection },
  { goals: ["grievance"], work: [] },
  { mccStart: "2026-11-02", pollingDate: "2026-11-04", resultDate: "" },
  { mccStart: "2026-10-20", pollingDate: "2026-12-10", resultDate: "" },
  { pollingDate: "2026-12-01", mccStart: "2026-11-20" },
  { meetingDay: "none", issues: [], work: [], events: [] },
  { stage: "new", platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
  { goals: [] },
  { pollReminder: "yes" },
  { pollReminder: "yes", mccStart: "2026-11-02", pollingDate: "2026-11-04", resultDate: "" },
];
const SCHEME = ["LR05", "LP07", "LP20"];

describe("political playbook", () => {
  const T = politicalPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("is non-partisan and never uses banned wording", () => {
    for (const t of T) {
      const text = [t.title, t.hook, t.cta ?? ""].join(" | ");
      expect(text, t.id).not.toMatch(POLITICAL_BANNED_WORDING);
      expect(`${text} ${t.note ?? ""}`, t.id).not.toMatch(/\{party\}|\b(BJP|Congress|SP|BSP|AAP)\b/);
    }
  });
  it("marks work-done facts, switches schemes off in the MCC and gates campaign content", () => {
    for (const t of T.filter((x) => /\{work\}/.test(x.title + x.hook))) expect(t.note, t.id).toMatch(/Client-provided fact — verify before posting/);
    for (const id of SCHEME) expect(T.find((t) => t.id === id)!.blockedBy).toContain("day:mcc");
    for (const t of T.filter((x) => /Campaign content/.test(x.note ?? ""))) expect(t.requires, t.id).toContain("election:yes");
    for (const t of T.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe("political plan engine", () => {
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

  it("never schedules banned wording and replaces client text that breaks it", () => {
    const p = gen({ issues: ["Caste census", "Drainage"], events: [{ kind: "visit", date: "2026-11-06", label: "Answering opponents" }], work: [{ work: "Best road in the district", date: "2026-09-01", place: "Ward 2" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Caste census|opponents|Best road/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(POLITICAL_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });

  it("never greets on a day whose name breaks the rules (e.g. Children's Day)", () => {
    const p = gen({ ...noElection, startDate: "2026-11-02" });
    expect(on(p, "2026-11-14").items.some((x) => x.title.includes("Children's Day"))).toBe(false);
  });

  it("only schedules templates whose tag rules pass", () => {
    for (const v of variants) {
      const a = { ...base, ...v };
      const tags = buildTags(politicalConfig, a);
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = politicalPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.filter((r) => !r.startsWith("day:")).every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.filter((b) => !b.startsWith("day:")).some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });

  it("marks every work-done item as a client-provided fact", () => {
    const work = items(gen({ pkg: "premium" })).filter((x) => x.platform === "instagram" && x.title.includes("Community hall repaired"));
    expect(work.length).toBeGreaterThan(0);
    for (const x of work.filter((i) => i.platform === "instagram")) expect(x.note).toMatch(/Client-provided fact — verify before posting: Community hall repaired \(12 Sep 2026, Ward 4\)/);
    expect(JSON.stringify(gen({ work: [] }).days)).not.toMatch(/Work update|Done:/);
  });

  it("uses each work-done fact at most twice a month, in different formats, and fills the rest with other templates", () => {
    const facts = [
      { work: "Community hall repaired", date: "2026-09-12", place: "Ward 4" },
      { work: "Park lights fixed", date: "2026-10-01", place: "Ward 2" },
    ];
    for (const v of [{}, { pkg: "premium" as const }, { pkg: "premium" as const, goals: ["work" as const], work: facts }, { goals: ["work" as const] }]) {
      const p = gen(v);
      const workIds = new Set(politicalPlaybook.templates.filter((t) => /\{work\}/.test(t.title + t.hook)).map((t) => t.id));
      const used = ig(p, "reel").concat(ig(p, "post")).filter((x) => workIds.has(x.templateId));
      for (const f of (v as { work?: typeof facts }).work ?? base.work) {
        const uses = used.filter((x) => x.title.includes(f.work));
        expect(uses.length, f.work).toBeLessThanOrEqual(2);
        expect(new Set(uses.map((x) => x.format)).size, f.work).toBe(uses.length);
      }
      const pk = v.pkg ?? "growth";
      expect(ig(p, "reel").length).toBe(packages[pk].reels);
      expect(ig(p, "post").length).toBe(packages[pk].posts);
    }
  });

  it("shows citizens only with consent", () => {
    const faceIds = new Set(politicalPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });
});

describe("Model Code of Conduct mode", () => {
  const p = gen({ pkg: "premium", consent: "yes" });
  const mccDays = p.days.filter((d) => d.date >= "2026-11-10" && d.date <= "2026-11-25");

  it("switches on from the MCC start date: one notice per day, not on every item, full note in compliance", () => {
    for (const d of mccDays) expect(d.notice, d.date).toMatch(/Model Code of Conduct in force/);
    for (const d of p.days.filter((x) => x.date < "2026-11-10" || x.date > "2026-11-25")) expect(d.notice, d.date).toBeUndefined();
    for (const x of items(p)) expect(x.note ?? "").not.toMatch(/Model Code of Conduct in force/);
    const compliance = p.compliance?.join(" ") ?? "";
    expect(compliance).toMatch(/Model Code of Conduct mode on 10 Nov – 25 Nov/);
    expect(compliance).toMatch(/MCMC pre-certification; record the expense/);
  });

  it("switches off scheme explainers and resolved-complaint stories during the MCC", () => {
    for (const d of mccDays) expect(d.items.filter((x) => [...SCHEME, "LR04", "LP15"].includes(x.templateId))).toEqual([]);
    const before = gen({ pkg: "premium", mccStart: "2026-11-28", pollingDate: "2026-12-10", resultDate: "" });
    expect(items(before).some((x) => SCHEME.includes(x.templateId))).toBe(true);
  });

  it("does not promote an inauguration that falls inside the MCC", () => {
    const text = JSON.stringify(p.days);
    expect(text).not.toContain("Road opening");
    expect(p.compliance?.join(" ")).toMatch(/inauguration falls inside the MCC/);
    expect(JSON.stringify(gen(noElection).days)).toContain("Road opening");
  });

  it("has no MCC mode without an election", () => {
    const q = gen(noElection);
    expect(JSON.stringify(q)).not.toMatch(/Model Code of Conduct in force|Polling day/);
  });
});

describe("silence period and polling day", () => {
  it("keeps polling day and the 48 hours before completely empty by default", () => {
    for (const v of variants.filter((x) => x.election !== "none" && x.pollReminder !== "yes")) {
      const a = { ...base, ...v };
      const p = gen(v);
      const poll = p.days.find((d) => d.date === a.pollingDate);
      if (!poll) continue;
      for (const d of p.days.filter((x) => x.day >= poll.day - 2 && x.day <= poll.day)) {
        expect(d.shoot, d.date).toBeUndefined();
        expect(d.items, d.date).toEqual([]);
      }
      expect(p.compliance?.join(" ")).toMatch(/nothing is scheduled on polling day or in the 48 hours before it/);
    }
  });

  it("with the reminder turned on, allows only the neutral polling-day message in the window", () => {
    for (const v of variants.filter((x) => x.pollReminder === "yes")) {
      const a = { ...base, ...v };
      const p = gen(v);
      const poll = p.days.find((d) => d.date === a.pollingDate)!;
      for (const d of p.days.filter((x) => x.day >= poll.day - 2 && x.day <= poll.day)) {
        expect(d.shoot, d.date).toBeUndefined();
        for (const x of d.items) expect(["LP11", "LR13"], `${d.date} ${x.templateId}`).toContain(x.templateId);
        if (d.day < poll.day) expect(d.items, d.date).toEqual([]);
      }
      expect(poll.items.some((x) => x.templateId === "LP11")).toBe(true);
    }
  });

  it("keeps polling-day and result-day messages neutral", () => {
    const p = gen({ pollReminder: "yes" });
    for (const x of [...on(p, "2026-11-25").items, ...on(p, "2026-11-28").items.filter((i) => ["LP12", "LR14"].includes(i.templateId))]) {
      expect(`${x.title} ${x.hook}`).not.toMatch(/\bvote for\b|party|symbol/i);
      if (x.platform === "instagram") expect(x.note).toMatch(/Neutral/);
    }
    expect(on(p, "2026-11-28").items.some((x) => x.templateId === "LP12")).toBe(true);
  });
});

describe("political pinned dates", () => {
  it("weekly public meeting: a story every meeting day and highlights after the first two", () => {
    const p = gen(noElection);
    const mondays = p.days.filter((d) => d.weekday === "Mon");
    for (const d of mondays) expect(d.items.some((x) => x.templateId === "LS05" && x.pinnedReason === "Weekly public meeting")).toBe(true);
    expect(items(p).filter((x) => x.templateId === "LR01")).toHaveLength(2);
  });

  it("events: invite 3 days before, highlights the day after, thank-you two days after", () => {
    const p = gen(noElection);
    expect(on(p, "2026-11-03").items.some((x) => x.templateId === "LP05")).toBe(true);
    expect(on(p, "2026-11-07").items.some((x) => x.templateId === "LR09")).toBe(true);
    expect(on(p, "2026-11-08").items.some((x) => x.templateId === "LP06")).toBe(true);
  });

  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", area: "", district: "", city: "", goals: [], events: [], issues: [], work: [], meetingDay: "none", meetingTime: "", grievanceContact: "", platforms: [], optimize: [], ...noElection });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
