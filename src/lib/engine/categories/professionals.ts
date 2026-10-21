/**
 * Professionals category config for the shared plan engine, with a profession switch that changes the rules:
 * lawyers (strict, Bar Council of India), CAs and CSs (strict, ICAI / ICSI), consultants and coaches (standard).
 * In strict modes solicitation, testimonials, results, fees and client names are blocked, every call-to-action is
 * replaced with a permitted one and the required note is added to every item.
 */
import {
  CA_CTA,
  CA_NOTE,
  LAW_CTA,
  LAW_NOTE,
  PRO_BANNED_WORDING,
  STRICT_BLOCKED,
  professionDays,
  professionalOptions,
  professionalRules,
  professionalsPlaybook,
} from "@/data/playbooks/professionals";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig, TemplateList } from "../core";

export type Profession = "lawyer" | "ca" | "cs" | "consultant";
export type ProGoal = "awareness" | "authority" | "visibility" | "clients" | "hiring";
export type ProMode = "law" | "ca" | "std";

export interface Deadline {
  name: string;
  /** ISO date as provided by the client. */
  date: string;
}

export interface ClientCase {
  name: string;
  permission: "yes" | "no" | "";
}

export interface ProfessionalAnswers extends BaseAnswers {
  profession: Profession;
  goals: ProGoal[];
  /** Specialisations / areas of practice, as typed. */
  areas: string[];
  /** Experience exactly as provided (e.g. "Practising since 2012"). */
  experience: string;
  /** Enrolment / membership details and qualifications exactly as provided. */
  credentials: string;
  team: "solo" | "small" | "large";
  languages: string;
  /** Deadlines relevant to their clients (CA / CS), as provided. */
  deadlines: Deadline[];
  /** Standard mode only: clients who gave written permission to be named. */
  clients: ClientCase[];
  onCamera: "all" | "some" | "none";
}

export const modeOf = (p: Profession): ProMode => (p === "lawyer" ? "law" : p === "ca" || p === "cs" ? "ca" : "std");

const MIX: Record<ProMode, Record<string, number>> = {
  law: { explain: 55, updates: 10, profile: 10, people: 20, events: 5, proof: 0, offer: 0 },
  ca: { explain: 40, updates: 30, profile: 10, people: 15, events: 5, proof: 0, offer: 0 },
  std: { explain: 35, updates: 10, profile: 10, people: 15, events: 5, proof: 15, offer: 10 },
};

const clean = (s?: string) => (s ?? "").trim();
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
/** Client text is checked against the mode's rules: strict modes also block solicitation, results and fees. */
const breaksFor = (mode: ProMode) => (s: string) => PRO_BANNED_WORDING.test(s) || (mode !== "std" && STRICT_BLOCKED.test(s));
const safeFor = (mode: ProMode) => (s?: string) => (clean(s) && !breaksFor(mode)(clean(s)) ? clean(s) : "");

const areas = (a: ProfessionalAnswers) => a.areas.map(safeFor(modeOf(a.profession))).filter(Boolean);
const deadlines = (a: ProfessionalAnswers) => (modeOf(a.profession) === "ca" ? a.deadlines.filter((d) => safeFor("ca")(d.name) && clean(d.date)) : []);
/** Clients the plan may name: standard mode only, with written permission. */
export const namedClients = (a: ProfessionalAnswers) => (modeOf(a.profession) === "std" ? a.clients.filter((c) => safeFor("std")(c.name) && c.permission === "yes").map((c) => clean(c.name)) : []);
const profileLine = (a: ProfessionalAnswers) => {
  const s = safeFor(modeOf(a.profession));
  return [label(professionalOptions.professions, a.profession), areas(a).length ? `Areas: ${areas(a).join(", ")}` : "", s(a.experience), s(a.credentials), clean(a.city)].filter(Boolean).join(" · ");
};

export const professionalsConfig: CategoryConfig<ProfessionalAnswers> = {
  slug: "professionals",
  version: "professionals-v1",
  playbook: professionalsPlaybook,
  defaultGoal: "awareness",
  pillarMix: (_primary, has) => {
    const mode: ProMode = has("mode:law") ? "law" : has("mode:ca") ? "ca" : "std";
    const mix = { ...MIX[mode] };
    if (mode === "std" && !has("has:clients") && !has("consent:yes")) {
      mix.explain += mix.proof;
      mix.proof = 0;
    }
    return mix;
  },

  tags: (a) => {
    const mode = modeOf(a.profession);
    const t = [`mode:${mode}`, `profession:${a.profession}`, `cam:${a.onCamera}`, `team:${a.team}`];
    if (areas(a).length) t.push("has:areas");
    if (a.team !== "solo") t.push("has:team");
    if (clean(a.languages)) t.push("has:languages");
    if (deadlines(a).length) t.push("has:deadlines");
    if (namedClients(a).length) t.push("has:clients");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    name: safeFor(modeOf(a.profession))(a.name) || "the practice",
    city: clean(a.city) || "your city",
    area: areas(a)[0] ?? "",
    areas_list: areas(a).join(" · "),
    experience: safeFor(modeOf(a.profession))(a.experience),
    profile_line: profileLine(a) || "Profile details as you provide them",
    languages: clean(a.languages),
  }),

  eventName: (e) => {
    const l = e.label ? clean(e.label) : "";
    return l && !PRO_BANNED_WORDING.test(l) && !STRICT_BLOCKED.test(l) ? l : label(professionalOptions.events, e.kind) || "Event";
  },

  templateLists: (a) => {
    const out: Record<string, TemplateList> = {};
    for (const t of professionalsPlaybook.templates) {
      if (t.pinnedOnly) continue;
      const text = t.title + t.hook;
      if (/\{client\}/.test(text)) out[t.id] = { key: "client", list: namedClients(a), mode: "cycle", shared: { pool: "client", maxUses: 2 } };
      else if (/\{area\}/.test(text)) out[t.id] = { key: "area", list: areas(a), mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => modeOf(a.profession) === "std" && a.consent === "yes",
  bannedWording: PRO_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "PP01", "New account: profile first");
    for (const d of deadlines(a)) {
      const day = inWindow(clean(d.date));
      const v = { deadline: safeFor("ca")(d.name), deadline_date: fmtDate(clean(d.date)) };
      if (valid(day - 7)) pin("post", day - 7, "PP05", `7 days before ${v.deadline}`, v);
      if (valid(day - 3) && day - 3 >= firstReelDay) pin("reel", day - 3, "PR08", `3 days before ${v.deadline}`, v);
      if (valid(day)) pin("post", day, "PP06", `${v.deadline} due today`, v);
    }
    for (const e of eventDays) {
      const v = { event: e.name };
      pin("post", Math.max(1, e.day - 4), "PP07", `4 days before ${e.name}`, v);
      if (e.day - 1 >= firstReelDay) pin("reel", e.day - 1, "PR10", `Day before ${e.name}`, v);
      pin("reel", e.day + 1, "PR11", `Day after ${e.name}`, v);
    }
    const year = Number(a.startDate.slice(0, 4));
    for (const f of professionDays.filter((x) => x.professions.includes(a.profession)))
      for (const y of [year, year + 1]) {
        const d = inWindow(`${y}-${f.md}`);
        if (!valid(d)) continue;
        if (f.template === "PR21") {
          if (d >= firstReelDay) pin("reel", d, "PR21", f.name, { event: f.name });
        } else if (!pinned("post", d)) pin("post", d, f.template, f.name, { event: f.name });
      }
    for (const o of occasions()) if (!pinned("post", o.day) && !PRO_BANNED_WORDING.test(o.name)) pin("post", o.day, "PP08", `${o.name}`, { event: o.name });
  },

  shootStory: { id: "PS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, inWindow, eventDays, story }) => {
    for (const d of deadlines(a)) {
      const day = inWindow(clean(d.date));
      for (let k = 3; k >= 1; k--) story(day - k, "PS04", `${safeFor("ca")(d.name)} — due ${fmtDate(clean(d.date))}`, "Countdown sticker · verify on the official portal", `Before ${safeFor("ca")(d.name)}`);
    }
    for (const e of eventDays) for (let k = 2; k >= 1; k--) story(e.day - k, "PS04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
  },

  platformText: {
    facebookCaption: "Longer caption with the same general information",
    whatsappStatus: (v) => `Status: this week's explainer from ${v.name}`,
    whatsappDeliverable: "Quick replies with office hours and profile information (as permitted)",
    youtubeVideo: (v) => `${v.area || "Your questions"}, explained: a longer guide (8–12 min)`,
    youtubeVideoHook: "General information, chaptered by question",
    websiteBlog: ({ vars }) => `${vars.area || "A common question"}: a plain-language guide`,
    linkedin: ({ vars }) => [
      { day: 3, title: `Explainer: ${vars.area || "a common question"}` },
      { day: 10, title: "Update: what changed this month (sources cited)" },
      { day: 17, title: `FAQ: ${vars.area || "questions we hear often"}` },
      { day: 24, title: `Inside the practice: how ${vars.name} works` },
    ],
    pinterest: "5 explainer pins",
    x: "Short explainer thread",
  },

  gbpExtra: ({ add, has }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: "Check office hours, address and profile information (as permitted)", who: "Oryza", time: "12:00 pm" });
    // Review requests are a form of solicitation in strict modes, so they are added only in standard mode.
    if (has("mode:std")) add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real clients — honest reviews only, never paid or scripted", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-Q", platform: "gbp", format: "gpost", title: "Answer common questions in Q&A — general information only", who: "Oryza", time: "12:00 pm" });
  },

  finalize: ({ a, days }) => {
    const mode = modeOf(a.profession);
    if (mode === "std") return;
    const note = mode === "law" ? LAW_NOTE : CA_NOTE;
    const cta = mode === "law" ? LAW_CTA : CA_CTA;
    for (const d of days)
      for (const x of d.items) {
        if (x.cta) x.cta = cta;
        x.note = x.note ? `${x.note} ${note}` : note;
      }
  },

  firstShootLabel: "Shoot day: explainers to camera and the office",

  clientPart: ({ a, shootCount, shoots }) => {
    const mode = modeOf(a.profession);
    const part = [
      "Give Oryza access to the selected accounts in week 1.",
      "Approve each week's content within 24 hours — you check every statement of law, tax or fact before publishing.",
      shootCount ? `Keep time free for explainers to camera on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send topics and short notes each week; we turn them into designed explainers.",
      "Send profile details (experience, enrolment or membership, qualifications) exactly as you want them shown.",
    ];
    if (mode === "law") part.push("Confirm with your State Bar Council before posting.");
    if (mode === "ca") part.push("Send deadlines exactly as notified, and follow current ICAI / ICSI guidelines — confirm before posting.");
    if (mode === "std") part.push("Name a client or share a testimonial only with their written permission.");
    return part;
  },

  oryzaPart: ({ a, shootCount }) => [
    modeOf(a.profession) === "std" ? "Strategy, scripts, captions and designs for every item." : "Educational scripts, captions and designs for every item — no solicitation.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Designed explainers from your notes.",
    "Scheduling and publishing at the planned times — LinkedIn articles included.",
    "Replies to comments in working hours with general information only; anything specific is directed to your office.",
    "A monthly report: reach, followers, profile visits and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes: string[] = [];
    for (const f of professionDays.filter((x) => x.professions.includes(a.profession) && Number(x.md.slice(0, 2)) === m)) themes.push(f.name);
    for (const d of deadlines(a)) if (Number(clean(d.date).slice(5, 7)) === m) themes.push(`${safeFor("ca")(d.name)} (as provided — verify)`);
    themes.push(areas(a)[0] ? `Explainer series: ${areas(a)[0]}` : "Explainer series");
    themes.push("FAQs and myth vs fact");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: "Professional", value: `${vars.name}, ${vars.city}` },
    { label: "Profession and rules", value: `${label(professionalOptions.professions, a.profession)} · ${modeOf(a.profession) === "std" ? "standard rules" : "strict rules"}` },
    { label: "Areas", value: vars.areas_list || "To be confirmed in the audit" },
    { label: "Main goal", value: label(professionalOptions.goals, primary) },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const mode = modeOf(a.profession);
    const out = ["This is guidance, not legal advice — confirm with your professional body or legal team.", ...professionalRules[mode]];
    if (mode === "ca") out.push("We never auto-fill statutory dates: only deadlines you provided appear, each marked “verify on the official portal”.");
    if (mode === "std") {
      const named = namedClients(a);
      if (named.length) out.push(`Clients named with written permission: ${named.join(", ")}.`);
      out.push(a.consent === "yes" ? "Testimonials appear only from real clients with consent." : "No testimonials are scheduled — written consent is not in place.");
    }
    if (mode !== "std" && a.clients.some((c) => clean(c.name))) out.push("Client names are never used in this profession's mode, so the names you entered are left out.");
    const b = breaksFor(mode);
    const dropped = [a.areas.some((x) => clean(x) && b(x)), clean(a.experience) && b(a.experience), clean(a.credentials) && b(a.credentials), a.events.some((e) => e.label && b(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording these rules don't allow (superlatives, guarantees, fees, results or solicitation), so it was left out or replaced with a neutral name.");
    return out;
  },
};
