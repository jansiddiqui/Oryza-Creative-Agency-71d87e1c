/** School category config for the shared plan engine (behaviour identical to the original school engine). */
import { schoolMonthThemes } from "@/data/calendar-india";
import { schoolOptions, schoolPlaybook } from "@/data/playbooks/school";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig } from "../core";

export type Board = "cbse" | "icse" | "state" | "intl" | "play";
export type Level = "preprimary" | "primary" | "10" | "12";
export type Goal = "admissions" | "reputation" | "engagement" | "hiring";
export type EventKind = "annual" | "sports" | "results" | "ptm" | "openday" | "trip" | "other";

export interface SchoolAnswers extends BaseAnswers {
  board: Board;
  level: Level;
  goals: Goal[];
  admissionOpen?: string;
  admissionClose?: string;
  events: { kind: EventKind; date: string; label?: string }[];
  usps: string[];
  achievements: string[];
}

const SUBJECTS = ["Maths", "Science", "English", "Hindi", "Art", "Computer"];

const PILLAR_MIX: Record<Goal, Record<string, number>> = {
  admissions: { campus: 20, teachers: 15, proof: 20, guidance: 15, admissions: 30 },
  reputation: { campus: 20, teachers: 30, proof: 30, guidance: 15, admissions: 5 },
  engagement: { campus: 35, teachers: 15, proof: 15, guidance: 25, admissions: 10 },
  hiring: { campus: 25, teachers: 35, proof: 20, guidance: 10, admissions: 10 },
};

const label = <T extends { id: string; label: string }>(list: readonly T[], id: string) => list.find((x) => x.id === id);
const level = (a: SchoolAnswers) => label(schoolOptions.levels, a.level)!;
const board = (a: SchoolAnswers) => label(schoolOptions.boards, a.board)!;

export const schoolConfig: CategoryConfig<SchoolAnswers> = {
  slug: "schools",
  version: "school-v1",
  playbook: schoolPlaybook,
  defaultGoal: "admissions",

  pillarMix: (primary, has) => {
    const mix = { ...PILLAR_MIX[primary as Goal] };
    if (!has("season:open")) {
      const moved = mix.admissions - 5;
      mix.admissions = 5;
      mix.guidance += Math.ceil(moved / 2);
      mix.campus += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a, { end }) => {
    const t = [`board:${a.board}`, `level:${a.level}`];
    a.usps.forEach((u) => t.push(`usp:${u}`));
    if (a.achievements.filter((x) => x.trim()).length) t.push("has:proof");
    if (a.events.length) t.push("has:event");
    const open = a.admissionOpen && a.admissionOpen <= end && (!a.admissionClose || a.admissionClose >= a.startDate);
    t.push(open ? "season:open" : "season:closed");
    const m = Number(a.startDate.slice(5, 7));
    if ([2, 3, 9].includes(m)) t.push("month:exam");
    return t;
  },

  vars: (a) => ({
    school: a.name.trim() || "your school",
    city: a.city.trim() || "your city",
    board: board(a).label,
    classes: level(a).classes,
    admission_open: a.admissionOpen ? fmtDate(a.admissionOpen) : "",
    admission_last_date: a.admissionClose ? fmtDate(a.admissionClose) : "",
  }),

  eventName: (e) => e.label?.trim() || label(schoolOptions.events, e.kind)?.label || "Event",

  templateLists: (a) => ({
    P02: { key: "achievement", list: a.achievements.map((x) => x.trim()).filter(Boolean), mode: "consume" },
    R02: { key: "subject", list: SUBJECTS, mode: "cycle" },
  }),

  facesAllowed: (a) => a.consent === "yes",

  pins: ({ a, inWindow, valid, firstReelDay, eventDays, pin, occasions }) => {
    const openDay = inWindow(a.admissionOpen);
    const closeDay = inWindow(a.admissionClose);
    if (a.stage === "new") pin("post", 2, "P15", "New account: introduce the school first");
    if (valid(openDay)) {
      pin("reel", Math.max(openDay, firstReelDay), "R07", "Admissions open");
      pin("post", openDay, "P04", "Admissions open");
    }
    if (valid(closeDay)) pin("post", Math.max(1, closeDay - 3), "P13", "3 days before the last date");
    for (const e of eventDays) {
      pin("reel", e.day + 1, "R10", `Day after ${e.name}`, { event: e.name });
      pin("post", e.day + 2, "P14", `Two days after ${e.name}`, { event: e.name });
    }
    for (const o of occasions()) pin("post", o.day, "P10", o.name, { event: o.name });
  },

  shootStory: { id: "S03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, inWindow, valid, eventDays, story, vars }) => {
    const openDay = inWindow(a.admissionOpen);
    const closeDay = inWindow(a.admissionClose);
    if (valid(openDay)) {
      story(openDay - 2, "S04", "Countdown: admissions open", "Countdown sticker", "Before admissions open");
      story(openDay - 1, "S04", "Countdown: admissions open", "Countdown sticker", "Before admissions open");
    }
    if (valid(closeDay)) for (let k = 3; k >= 1; k--) story(closeDay - k, "S04", `Countdown: last date ${vars.admission_last_date}`, "Countdown sticker", "Before the last date");
    for (const e of eventDays) {
      story(e.day - 3, "S04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "S03", `Live from ${e.name}`, "6–8 stories through the event", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for parents",
    whatsappStatus: (v) => `Status: this week at ${v.school}`,
    whatsappDeliverable: "Admission quick replies kept up to date",
    youtubeVideo: (v) => `Campus tour of ${v.school} (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days, chaptered for parents",
    websiteBlog: ({ has, vars, a }) =>
      has("season:open")
        ? `Documents needed for admission in a ${board(a).label} school in ${vars.city}`
        : `How to choose the right school in ${vars.city}: a parent's checklist`,
    linkedin: ({ has, vars }) => [
      { day: 9, title: has("goal:hiring") ? "Teacher openings at " + vars.school : `Leadership note from the principal of ${vars.school}` },
      { day: 23, title: `Life at ${vars.school}: our teachers` },
    ],
    pinterest: "5 campus and activity pins",
    x: "School news update",
  },

  facebookAfterEvents: ({ a, inWindow, valid, add }) => {
    const openDay = inWindow(a.admissionOpen);
    if (valid(openDay)) add(openDay, { templateId: "FB-EVENT", platform: "facebook", format: "event", title: "Facebook event: admission open day", who: "Oryza", time: "11:00 am", pinnedReason: "Admissions open" });
  },

  whatsappBeforeReminders: ({ a, inWindow, valid, add, vars }) => {
    const openDay = inWindow(a.admissionOpen);
    const closeDay = inWindow(a.admissionClose);
    if (valid(openDay)) add(openDay, { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: "Broadcast to parent list: admissions open", who: "Oryza", time: "10:00 am", pinnedReason: "Admissions open" });
    if (valid(closeDay)) add(Math.max(1, closeDay - 3), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: last date ${vars.admission_last_date}`, who: "Oryza", time: "10:00 am", pinnedReason: "3 days before the last date" });
  },

  websiteExtra: ({ a, inWindow, valid, add }) => {
    const openDay = inWindow(a.admissionOpen);
    if (valid(openDay)) add(openDay, { templateId: "WEB-A", platform: "website", format: "blog", title: "Admissions page update and homepage banner", who: "Oryza", time: "9:00 am", pinnedReason: "Admissions open" });
  },

  firstShootLabel: "Shoot day: campus, teachers and facilities",

  clientPart: ({ a, shootCount, shoots, usesWho }) => {
    const part = [
      "Give Oryza access to the selected accounts in week 1.",
      "Approve each week's content within 24 hours.",
      shootCount ? `Make the campus, principal and 3–4 teachers available on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send photos and short videos every week using our media checklist.",
      a.consent === "yes" ? "Keep written photo consent records up to date." : "Collect written photo consent from parents — until then we avoid children's faces.",
      "Share achievements, notices and event dates as soon as you have them.",
    ];
    if (a.shoot !== "own" && usesWho("Client arranges")) part.push("Arrange one alumnus for a short interview.");
    return part;
  },

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item in the calendar.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; admission inquiries passed to your WhatsApp.",
    "A monthly report: reach, followers, inquiries and the top content.",
  ],

  monthThemes: (m, { a, vars }) => {
    const themes = [...(schoolMonthThemes[m] ?? [])];
    if (a.admissionClose && Number(a.admissionClose.slice(5, 7)) === m) themes.unshift(`Admissions closing on ${vars.admission_last_date}`);
    return themes;
  },

  snapshot: ({ a, vars, primary }) => [
    { label: "School", value: `${vars.school}, ${vars.city}` },
    { label: "Board and classes", value: `${board(a).label} · ${level(a).classes}` },
    { label: "Main goal", value: schoolOptions.goals.find((g) => g.id === primary)?.label ?? "" },
    { label: "Strengths", value: a.usps.map((u) => schoolOptions.usps.find((x) => x.id === u)?.label).filter(Boolean).join(", ") || "To be discovered in the audit" },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],
};
