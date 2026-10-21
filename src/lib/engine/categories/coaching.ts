/**
 * Coaching institutes category config (JEE/NEET, boards tuition, government exams, skill, language and
 * computer courses) for the shared plan engine.
 * Result gate: a result is used only when every disclosure is present — written consent, the verified score or
 * rank, the exam, the course actually taken, its duration and whether it was paid.
 */
import { coachingDays, coachingOptions, coachingPlaybook, COACHING_BANNED_WORDING } from "@/data/playbooks/coaching";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig, TemplateList } from "../core";

export type CoachingType = "jee" | "boards" | "govt" | "skill" | "language" | "computer";
export type CoachingGoal = "admissions" | "demo" | "trust" | "results" | "launch";

export interface Batch {
  name: string;
  course: string;
  /** ISO start date (optional). */
  start: string;
  timing: string;
  mode: "offline" | "online" | "hybrid";
}

export interface VerifiedResult {
  student: string;
  exam: string;
  /** Score or rank exactly as verified by the institute. */
  score: string;
  /** The course the student actually took. */
  course: string;
  duration: string;
  paid: "yes" | "no" | "";
  /** Written consent (a parent's for a minor). */
  consent: "yes" | "no" | "";
}

export interface CoachingAnswers extends BaseAnswers {
  type: CoachingType;
  goals: CoachingGoal[];
  courses: string[];
  age: "school" | "college" | "mixed";
  mode: "offline" | "online" | "hybrid";
  batches: Batch[];
  /** Demo-class days and times as typed. */
  demo: string;
  onCamera: "all" | "some" | "none";
  results: VerifiedResult[];
  fees: string;
  scholarship: string;
  material: "yes" | "no";
  testSeries: "yes" | "no";
  /** Upcoming exam dates provided by the client. */
  exams: { name: string; date: string }[];
}

const MIX: Record<CoachingGoal, Record<string, number>> = {
  admissions: { learning: 30, faculty: 15, admissions: 30, results: 10, campus: 10, wellbeing: 5 },
  demo: { learning: 35, faculty: 15, admissions: 30, results: 5, campus: 10, wellbeing: 5 },
  trust: { learning: 30, faculty: 25, admissions: 10, results: 10, campus: 10, wellbeing: 15 },
  results: { learning: 30, faculty: 15, admissions: 15, results: 25, campus: 5, wellbeing: 10 },
  launch: { learning: 30, faculty: 20, admissions: 30, results: 5, campus: 10, wellbeing: 5 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => COACHING_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";

/** Results with every disclosure present and publishable wording; anything missing blocks the result. */
export const verifiedResults = (a: Pick<CoachingAnswers, "results">) =>
  a.results.filter((r) => [r.student, r.exam, r.score, r.course, r.duration].every((x) => safe(x)) && (r.paid === "yes" || r.paid === "no") && r.consent === "yes");

const resultVars = (r: VerifiedResult) => ({
  student: safe(r.student),
  r_exam: safe(r.exam),
  score: safe(r.score),
  r_course: safe(r.course),
  duration: safe(r.duration),
  paid_line: r.paid === "yes" ? "paid course" : "not a paid course",
});

const courses = (a: CoachingAnswers) => {
  const list = a.courses.map(safe).filter(Boolean);
  return list.length ? list : [label(coachingOptions.types, a.type)];
};
const batchesWithName = (a: CoachingAnswers) => a.batches.filter((b) => safe(b.name));
const examsFor = (a: CoachingAnswers) => a.exams.filter((e) => safe(e.name) && clean(e.date));

export const coachingConfig: CategoryConfig<CoachingAnswers> = {
  slug: "coaching-institutes",
  version: "coaching-v1",
  playbook: coachingPlaybook,
  defaultGoal: "admissions",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as CoachingGoal] ?? MIX.admissions) };
    if (!has("has:results")) {
      // No verified results: their share goes to teaching content.
      mix.learning += mix.results;
      mix.results = 0;
    }
    return mix;
  },

  tags: (a) => {
    const t = [`type:${a.type}`, `age:${a.age === "college" ? "adult" : "minor"}`, `cam:${a.onCamera}`];
    if (safe(a.demo)) t.push("has:demo");
    if (batchesWithName(a).length) t.push("has:batch");
    if (safe(a.fees)) t.push("has:fees");
    if (safe(a.scholarship)) t.push("has:scholarship");
    if (a.material === "yes") t.push("has:material");
    if (a.testSeries === "yes") t.push("has:testseries");
    if (verifiedResults(a).length) t.push("has:results");
    if (a.mode !== "online") t.push("has:offline");
    if (a.mode !== "offline") t.push("has:online");
    if (examsFor(a).length) t.push("has:exam");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our institute",
    city: clean(a.city) || "your city",
    course: courses(a)[0],
    courses_list: courses(a).join(" · "),
    demo: safe(a.demo),
    fees: safe(a.fees),
    scholarship: safe(a.scholarship),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : e.kind === "results" ? "Result day" : label(coachingOptions.events, e.kind) || "Event"),

  // A result day is promoted (Facebook event, broadcast, pins) only when a fully disclosed result exists.
  keepEvent: (a, e) => e.kind !== "results" || verifiedResults(a).length > 0,

  templateLists: (a) => {
    const results = verifiedResults(a).map(resultVars);
    const out: Record<string, TemplateList> = {};
    for (const t of coachingPlaybook.templates) {
      if (t.pinnedOnly) continue;
      const text = t.title + t.hook;
      // Each verified result at most twice a month, in different formats.
      if (/\{student\}/.test(text)) out[t.id] = { key: "student", list: results, mode: "cycle", shared: { pool: "result", maxUses: 2 } };
      else if (/\{course\}/.test(text)) out[t.id] = { key: "course", list: courses(a), mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: COACHING_BANNED_WORDING,

  pins: ({ a, has, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "CP01", "New account: courses first");
    for (const b of batchesWithName(a)) {
      const d = inWindow(clean(b.start));
      if (!valid(d)) continue;
      const name = `${safe(b.name)}${safe(b.course) ? ` (${safe(b.course)})` : ""}, ${fmtDate(clean(b.start))}`;
      const v = { event: name };
      if (has("has:demo")) pin("post", Math.max(1, d - 7), "CP15", `A week before ${safe(b.name)}: demo classes`, v);
      pin("reel", Math.max(d - 3, firstReelDay), "CR24", `Before ${safe(b.name)} starts`, v);
      pin("post", d, "CP14", `${safe(b.name)} starts`, v);
    }
    for (const x of examsFor(a)) {
      const d = inWindow(clean(x.date));
      const v = { exam: safe(x.name), event: safe(x.name) };
      if (valid(d - 10)) pin("post", d - 10, "CP16", `10 days before ${safe(x.name)}: calm revision plan`, v);
      if (valid(d - 1)) pin("post", d - 1, "CP17", `Day before ${safe(x.name)}`, v);
    }
    const results = verifiedResults(a);
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "results") {
        // Result days are promoted only with a verified, fully disclosed result.
        if (results.length) pin("post", e.day, "CP12", `${e.name}: verified result`, { ...v, ...resultVars(results[0]) });
      } else {
        pin("post", Math.max(1, e.day - 3), "CP18", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "CR25", `Day after ${e.name}`, v);
      }
    }
    const year = Number(a.startDate.slice(0, 4));
    for (const f of coachingDays)
      for (const y of [year, year + 1]) {
        const d = inWindow(`${y}-${f.md}`);
        if (valid(d) && !pinned("post", d)) pin("post", d, "CP13", f.name, { event: f.name });
      }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "CP13", o.name, { event: o.name });
  },

  shootStory: { id: "CS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film — students from behind or with consent" },

  pinnedStories: ({ a, inWindow, valid, eventDays, story }) => {
    for (const b of batchesWithName(a)) {
      const d = inWindow(clean(b.start));
      if (valid(d)) for (let k = 3; k >= 1; k--) story(d - k, "CS04", `Countdown: ${safe(b.name)} starts`, "Countdown sticker", `Before ${safe(b.name)}`);
    }
    for (const x of examsFor(a)) {
      const d = inWindow(clean(x.date));
      for (let k = 3; k >= 2; k--) story(d - k, "CS10", `${safe(x.name)} in ${k} days`, "Sleep well, revise light — you've prepared", `Before ${safe(x.name)}`);
      story(d, "CS10", `${safe(x.name)} today: good luck`, "Breathe, read each question carefully, and take it one step at a time", safe(x.name));
    }
    for (const e of eventDays.filter((x) => x.kind !== "results")) {
      story(e.day - 1, "CS04", `Tomorrow: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "CS03", `Live from ${e.name}`, "Stories through the day — students only with consent", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for parents and students",
    whatsappStatus: (v) => `Status: this week's tip and batch timings at ${v.brand}`,
    whatsappDeliverable: "Enquiry quick replies with courses, batch timings, fees (as provided) and demo-class booking",
    youtubeVideo: (v) => `${v.course} at ${v.brand}: a full concept class (20–30 min)`,
    youtubeVideoHook: "Filmed across shoot days — a complete lesson, chaptered by topic",
    websiteBlog: ({ vars }) => `${vars.course} in ${vars.city}: how to choose a coaching institute (a checklist for parents)`,
    linkedin: ({ vars }) => [
      { day: 9, title: `Teaching at ${vars.brand}: our approach` },
      { day: 23, title: `Faculty openings and guest lectures at ${vars.brand}` },
    ],
    pinterest: "5 study-tip and formula-card pins",
    x: "Exam tip and batch update",
  },

  whatsappBeforeReminders: ({ a, add, inWindow, valid, has }) => {
    for (const b of batchesWithName(a)) {
      const d = inWindow(clean(b.start));
      if (valid(d) && has("has:demo")) add(Math.max(1, d - 7), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: demo classes before ${safe(b.name)} starts`, who: "Oryza", time: "6:00 pm", pinnedReason: `A week before ${safe(b.name)}` });
    }
  },

  gbpExtra: ({ add }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: "Check office hours, courses list and enquiry link", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real students and parents — honest reviews only, never paid, scripted or in exchange for a discount", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-Q", platform: "gbp", format: "gpost", title: "Answer the 3 most common parent questions in Q&A (fees only as provided)", who: "Oryza", time: "12:00 pm" });
  },

  firstShootLabel: "Shoot day: faculty, classrooms and concept explainers",

  clientPart: ({ a, shootCount, shoots }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours; your team confirms every claim, fee and date before publishing.",
    shootCount ? `Make faculty and a class available on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send class photos and short concept videos every week using our media checklist.",
    "For any result you want shared, keep the student's written consent (a parent's for a minor) and send the verified score, exam, course taken, duration and whether it was paid.",
    a.consent === "yes" ? "Keep written consent on file for every student who appears." : "Students will not appear in close-up until written consent is in place.",
    "Send fees, scholarships, batch dates and exam dates exactly as you want them shown.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item — teaching content checked by your faculty.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list (faculty, classes, concept explainers).` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; enquiries passed to your counsellor on WhatsApp.",
    "A monthly report: reach, followers, enquiries, demo bookings and the top content.",
  ],

  monthThemes: (m, { a, has }) => {
    const themes: string[] = [];
    for (const x of examsFor(a)) if (Number(clean(x.date).slice(5, 7)) === m) themes.push(`${safe(x.name)}: calm revision and exam-day tips`);
    if (m === 1) themes.push("National Youth Day (12 Jan)");
    if (m === 9) themes.push("Teachers' Day (5 Sep)");
    themes.push(has("has:batch") ? "Next batch: demo classes and batch timings" : "Concept explainers and study routines");
    themes.push("Wellbeing: sleep, breaks and parent guidance");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: "Institute", value: `${vars.brand}, ${vars.city}` },
    { label: "Courses", value: vars.courses_list },
    { label: "Students", value: `${label(coachingOptions.ages, a.age)} · ${label(coachingOptions.modes, a.mode)}` },
    { label: "Main goal", value: label(coachingOptions.goals, primary) },
    { label: "Verified results to share", value: String(verifiedResults(a).length) },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a, eventDays }) => {
    const out = [
      "This is guidance, not legal advice — it follows the CCPA guidelines on misleading advertisements in the coaching sector; you must confirm every claim before publishing.",
      "Templates with guaranteed selection, rank, marks or jobs, “100% results”, “best”, “No.1”, “India's top”, fake seat scarcity or fear and pressure wording are never scheduled.",
    ];
    const ok = verifiedResults(a);
    const blocked = a.results.filter((r) => clean(r.student) && !ok.includes(r));
    if (ok.length) out.push(`${ok.length} verified result${ok.length === 1 ? "" : "s"} will be shared, each with the full disclosure: consent, verified score or rank, exam, course taken, duration and whether it was paid.`);
    if (blocked.length) out.push(`${blocked.length} result${blocked.length === 1 ? " was" : "s were"} left out because a disclosure was missing (consent, verified score, exam, course taken, duration or paid / not paid) or the wording can't be published.`);
    if (!ok.length) out.push("No result posts are scheduled until a result has every disclosure.");
    if (eventDays.some((e) => e.kind === "results") && !ok.length) out.push("The result day is not promoted because there is no verified result with full disclosures.");
    out.push("A calm, mental-health-friendly tone throughout: exam countdowns carry rest and revision tips, never pressure, and no student is ever shamed.");
    out.push("Fees and scholarships appear only exactly as you provided them; no seat-scarcity claims.");
    out.push(a.consent === "yes" ? "Students appear only where written consent is on file (a parent's for minors)." : "No student close-ups or testimonials are scheduled — written consent is not in place.");
    const dropped = [a.courses.some((c) => clean(c) && breaks(c)), clean(a.fees) && breaks(a.fees), clean(a.scholarship) && breaks(a.scholarship), clean(a.demo) && breaks(a.demo), a.events.some((e) => e.label && breaks(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (guarantees, “best”, seat scarcity or pressure), so it was left out or replaced with a neutral name.");
    return out;
  },
};
