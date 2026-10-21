/**
 * Political leaders category config for the shared plan engine. Non-partisan.
 * Model Code of Conduct mode (from the MCC start date to polling day) and the silence period
 * (the two days before polling day and polling day itself) are enforced per day.
 */
import { politicalOptions, politicalPlaybook, POLITICAL_BANNED_WORDING } from "@/data/playbooks/political";
import { addDays, dayOf, fmtDate } from "../dates";
import { PLAN_DAYS, type BaseAnswers, type CategoryConfig, type TemplateList } from "../core";

export type PoliticalRole = "mla" | "mp" | "councillor" | "aspirant" | "office";
export type PoliticalGoal = "connect" | "work" | "grievance" | "events" | "youth" | "campaign";

export interface PoliticalAnswers extends BaseAnswers {
  role: PoliticalRole;
  goals: PoliticalGoal[];
  /** Party name exactly as provided, or empty for independents (never used in templates). */
  party: string;
  /** Constituency or ward. */
  area: string;
  district: string;
  languages: string[];
  /** Top local issues, as the client wrote them. */
  issues: string[];
  /** Weekday of the regular public meeting ("0"–"6", or "none"), with time and place as typed. */
  meetingDay: string;
  meetingTime: string;
  election: "none" | "upcoming";
  /** ISO dates (only when an election is upcoming). */
  mccStart: string;
  pollingDate: string;
  /** Post a neutral voting reminder on polling day? Off unless the election team confirms. */
  pollReminder: "yes" | "no";
  resultDate: string;
  onCamera: "all" | "some" | "none";
  team: "none" | "small" | "large";
  grievance: "office" | "whatsapp" | "both";
  /** Office address or WhatsApp number exactly as provided. */
  grievanceContact: string;
  /** Work done: facts provided by the client. */
  work: { work: string; date: string; place: string }[];
}

const MIX: Record<PoliticalGoal, Record<string, number>> = {
  connect: { connect: 35, work: 15, voice: 20, info: 15, people: 15 },
  work: { connect: 20, work: 40, voice: 15, info: 10, people: 15 },
  grievance: { connect: 20, work: 15, voice: 40, info: 15, people: 10 },
  events: { connect: 45, work: 15, voice: 10, info: 10, people: 20 },
  youth: { connect: 30, work: 10, voice: 20, info: 25, people: 15 },
  campaign: { connect: 35, work: 20, voice: 25, info: 5, people: 15 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => POLITICAL_BANNED_WORDING.test(s);
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";

const issues = (a: PoliticalAnswers) => a.issues.map(clean).filter((x) => x && !breaks(x));
const facts = (a: PoliticalAnswers) =>
  a.work
    .map((w) => ({ work: clean(w.work), work_date: clean(w.date) ? (/^\d{4}-\d{2}-\d{2}$/.test(clean(w.date)) ? fmtDate(clean(w.date)) + " " + clean(w.date).slice(0, 4) : clean(w.date)) : "", work_place: clean(w.place) }))
    .filter((w) => w.work && w.work_date && w.work_place && ![w.work, w.work_place].some(breaks));
const election = (a: PoliticalAnswers) => a.election === "upcoming" && Boolean(clean(a.pollingDate));

/** Plan-day windows for the election. */
export function electionDays(a: PoliticalAnswers) {
  if (!election(a)) return { mcc: [] as number[], silence: [] as number[], poll: 0, result: 0 };
  const poll = dayOf(a.startDate, a.pollingDate);
  const mccStart = clean(a.mccStart) ? dayOf(a.startDate, a.mccStart) : poll;
  const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i).filter((d) => d >= 1 && d <= PLAN_DAYS);
  return {
    mcc: range(Math.max(1, mccStart), Math.min(PLAN_DAYS, poll)),
    silence: range(poll - 2, poll),
    poll,
    result: clean(a.resultDate) ? dayOf(a.startDate, a.resultDate) : 0,
  };
}

const grievanceLine = (a: PoliticalAnswers) => {
  const c = clean(a.grievanceContact);
  if (!c) return "";
  return a.grievance === "whatsapp" ? `WhatsApp the office: ${c}` : a.grievance === "both" ? `Visit or WhatsApp the office: ${c}` : `Visit the office: ${c}`;
};

/** Full note, kept in the compliance section. */
const MCC_NOTE = "Model Code of Conduct in force: no new schemes or projects announced, no government offices or resources in frame; paid promotion needs MCMC pre-certification; record the expense.";
/** Shown once per MCC day in the calendar. */
export const MCC_DAY_NOTICE = "Model Code of Conduct in force — check the compliance notes before publishing.";
/** Items allowed on silence days: the neutral polling-day message, only when the client turned it on. */
const SILENCE_OK = new Set(["LP11", "LR13"]);
const reminderOn = (a: PoliticalAnswers) => a.pollReminder === "yes";

export const politicalConfig: CategoryConfig<PoliticalAnswers> = {
  slug: "political-leaders",
  version: "political-v1",
  playbook: politicalPlaybook,
  defaultGoal: "connect",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as PoliticalGoal] ?? MIX.connect) };
    if (!has("has:work")) {
      // No facts provided: work-done share moves to connect and voice.
      const moved = mix.work - 5;
      mix.work = 5;
      mix.connect += Math.ceil(moved / 2);
      mix.voice += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a) => {
    const t = [`role:${a.role}`, `cam:${a.onCamera}`, `team:${a.team}`];
    if (issues(a).length) t.push("has:issues");
    if (facts(a).length) t.push("has:work");
    if (a.meetingDay !== "none" && clean(a.meetingTime)) t.push("has:meeting");
    if (grievanceLine(a)) t.push("has:grievance");
    if (election(a)) t.push("election:yes");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => {
    const is = issues(a);
    const day = label(politicalOptions.weekdays, a.meetingDay);
    return {
      leader: clean(a.name) || "your representative",
      area: clean(a.area) || clean(a.city) || "our area",
      district: clean(a.district) || clean(a.city) || "",
      city: clean(a.city) || clean(a.district) || "",
      issue: is[0] ?? "",
      issues_list: is.join(" · "),
      meeting: a.meetingDay !== "none" && clean(a.meetingTime) ? `every ${day}, ${clean(a.meetingTime)}` : "",
      grievance_line: grievanceLine(a),
    };
  },

  eventName: (e) => (e.label && clean(e.label) && !breaks(e.label) ? clean(e.label) : label(politicalOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const is = issues(a);
    const f = facts(a);
    const out: Record<string, TemplateList> = {};
    for (const t of politicalPlaybook.templates) {
      if (t.pinnedOnly || t.format === "story") continue;
      const text = `${t.title} ${t.hook}`;
      // Each fact at most twice a month, in different formats; other templates fill the rest.
      if (/\{work\}/.test(text)) out[t.id] = { key: "work", list: f, mode: "cycle", shared: { pool: "work", maxUses: 2 } };
      else if (/\{issue\}/.test(text)) out[t.id] = { key: "issue", list: is, mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: POLITICAL_BANNED_WORDING,

  dayTags: (a) => {
    const el = electionDays(a);
    return (day) => {
      const t = new Set<string>();
      if (el.mcc.includes(day)) t.add("day:mcc");
      if (el.silence.includes(day)) t.add("day:silence");
      if (day === el.poll) t.add("day:poll");
      return t;
    };
  },
  closedDays: (a) => electionDays(a).silence,
  // Not promoted at all: events in the silence period, and inaugurations during the MCC (no new projects announced).
  keepEvent: (a, e) => {
    const el = electionDays(a);
    return !el.silence.includes(e.day) && !(e.kind === "inauguration" && el.mcc.includes(e.day));
  },

  pins: ({ a, valid, firstReelDay, eventDays, pin, pinned, occasions }) => {
    const el = electionDays(a);
    const closed = new Set(el.silence);
    const open = (d: number) => valid(d) && !closed.has(d);
    const mcc = new Set(el.mcc);
    if (a.stage === "new") pin("post", 2, "LP13", "New account: introduce the leader first");
    if (valid(el.poll) && reminderOn(a)) {
      pin("post", el.poll, "LP11", "Polling day: neutral message only");
      if (el.poll >= firstReelDay) pin("reel", el.poll, "LR13", "Polling day: neutral message only");
    }
    if (open(el.result)) {
      pin("post", el.result, "LP12", "Result day: neutral thank-you for any outcome");
      if (el.result >= firstReelDay) pin("reel", el.result, "LR14", "Result day: neutral thank-you for any outcome");
    }
    // Weekly public meeting: highlights after the first two meetings in the plan.
    if (a.meetingDay !== "none" && clean(a.meetingTime)) {
      const wd = Number(a.meetingDay);
      const meetingDays = Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).filter((d) => new Date(addDays(a.startDate, d - 1) + "T00:00:00Z").getUTCDay() === wd && open(d));
      meetingDays.filter((d) => open(d + 1) && d + 1 >= firstReelDay).slice(0, 2).forEach((d) => pin("reel", d + 1, "LR01", "Day after the public meeting", { event: `public meeting, ${fmtDate(addDays(a.startDate, d - 1))}` }));
    }
    for (const e of eventDays) {
      const v = { event: e.name };
      if (closed.has(e.day)) continue;
      if (e.kind === "inauguration" && mcc.has(e.day)) continue; // no new projects announced during the MCC
      if (e.kind === "festival") {
        if (!pinned("post", e.day)) pin("post", e.day, "LP04", e.name, v);
        continue;
      }
      if (open(e.day - 3)) pin("post", Math.max(1, e.day - 3), "LP05", `3 days before ${e.name}`, v);
      if (open(e.day + 1)) pin("reel", e.day + 1, e.kind === "youth" ? "LR09" : "LR15", `Day after ${e.name}`, v);
      if (open(e.day + 2)) pin("post", e.day + 2, "LP06", `Two days after ${e.name}`, v);
    }
    for (const o of occasions()) if (open(o.day) && !breaks(o.name) && !pinned("post", o.day)) pin("post", o.day, "LP04", o.name, { event: o.name });
  },

  shootStory: { id: "LS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, eventDays, story, valid }) => {
    const el = electionDays(a);
    const closed = new Set(el.silence);
    for (const e of eventDays) {
      if (closed.has(e.day) || (e.kind === "inauguration" && el.mcc.includes(e.day))) continue;
      if (e.kind !== "festival") for (let k = 2; k >= 1; k--) if (!closed.has(e.day - k)) story(e.day - k, "LS04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "LS08", `Live from ${e.name}`, "6–8 stories through the day — adults only, with consent", e.name);
    }
    if (a.meetingDay !== "none" && clean(a.meetingTime)) {
      const wd = Number(a.meetingDay);
      for (let d = 1; d <= PLAN_DAYS; d++)
        if (valid(d) && !closed.has(d) && new Date(addDays(a.startDate, d - 1) + "T00:00:00Z").getUTCDay() === wd)
          story(d, "LS05", `Public meeting today: ${clean(a.meetingTime)}`, "Bring your issue in writing", "Weekly public meeting");
    }
  },

  platformText: {
    facebookCaption: "Longer caption in the chosen languages for residents",
    whatsappStatus: (v) => `Status: this week in ${v.area}`,
    whatsappDeliverable: "Grievance quick replies with office timings and how to follow up",
    youtubeVideo: (v) => `A month in ${v.area}: meetings, visits and follow-ups (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days, chaptered by area — facts as provided",
    websiteBlog: ({ vars }) => `How to raise an issue with your representative in ${vars.area}`,
    linkedin: ({ vars }) => [
      { day: 9, title: `${vars.leader}: notes from the field in ${vars.area}` },
      { day: 23, title: "Monthly update: meetings held and issues followed up (facts as provided)" },
    ],
    pinterest: "5 civic-information pins",
    x: "Update from the area (facts as provided)",
  },

  gbpExtra: ({ add }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: "Check office hours, public-meeting timings and the location pin", who: "Oryza", time: "12:00 pm" });
  },

  finalize: ({ a, days, has }) => {
    const el = electionDays(a);
    const silence = new Set(el.silence);
    const mcc = new Set(el.mcc);
    for (const d of days) {
      if (silence.has(d.day)) {
        d.items = d.items.filter((x) => reminderOn(a) && SILENCE_OK.has(x.templateId) && (x.platform === "instagram" || x.platform === "facebook"));
        d.shoot = undefined;
      }
      if (mcc.has(d.day) && has("election:yes")) d.notice = MCC_DAY_NOTICE;
    }
  },

  firstShootLabel: "Shoot day: the leader, the office and the area",

  clientPart: ({ a, shootCount, shoots, has }) => {
    const part = [
      "Give Oryza access to the selected accounts in week 1.",
      "Approve each week's content within 24 hours; your legal or election team confirms anything sensitive.",
      shootCount ? `Be available for filming on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send photos and short videos every week using our media checklist.",
      "Send work-done facts (what, where, when) with real photos — we never write claims ourselves.",
      "Send party names, symbols or colours only if you want them used, as approved files.",
      a.consent === "yes" ? "Keep written consent on file for every citizen who appears; no minors." : "Citizens will not appear in close-up until written consent is in place.",
    ];
    if (has("election:yes")) part.push("Share the official MCC and polling dates as soon as they are announced, and keep an expense record for all paid promotion.");
    return part;
  },

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item — non-partisan templates, your facts only.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times, with nothing scheduled in the silence period.",
    "Replies to comments and DMs in working hours; grievances passed to your office.",
    "A monthly report: reach, followers, messages, grievances received and the top content.",
  ],

  monthThemes: (m, { a, has, vars }) => {
    const themes = [`Monthly work update for ${vars.area} (facts you provide)`, "Public meetings and grievance follow-ups"];
    if (has("has:issues")) themes.unshift(`Listening series: ${vars.issues_list}`);
    if (has("election:yes") && [a.mccStart, a.pollingDate].some((d) => clean(d) && Number(d.slice(5, 7)) === m)) themes.push("Election period: MCC rules apply — no new announcements");
    if (m === 1) themes.push("Republic Day and National Voters' Day (25 Jan)");
    if (m === 8) themes.push("Independence Day");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => {
    const el = electionDays(a);
    return [
      { label: "Leader", value: `${vars.leader} · ${label(politicalOptions.roles, a.role)}` },
      { label: "Area", value: [vars.area, clean(a.district)].filter(Boolean).join(", ") },
      { label: "Main goal", value: label(politicalOptions.goals, primary) },
      { label: "Languages", value: a.languages.map((l) => label(politicalOptions.languages, l)).filter(Boolean).join(", ") || "Hindi" },
      { label: "Election", value: election(a) ? `Polling ${fmtDate(a.pollingDate)}${el.mcc.length ? ` · MCC mode on plan days ${el.mcc[0]}–${el.mcc[el.mcc.length - 1]}` : ""}` : "No election in this plan" },
      { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
    ];
  },

  compliance: ({ a, has, days }) => {
    const el = electionDays(a);
    const out = [
      "This is guidance, not legal advice — your legal or election team must confirm before anything is published.",
      "Non-partisan templates: no party name, symbol or colour appears unless you provide the assets.",
      "Templates with religion or caste appeals, attacks on opponents, hate, defence-forces imagery, children, deepfakes or unverifiable superlatives are never scheduled.",
    ];
    if (has("has:work")) out.push("Every work-done item is marked “client-provided fact — verify before posting” and uses only the facts you entered.");
    else out.push("No work-done posts are scheduled until you provide facts (what, where, when).");
    out.push(a.consent === "yes" ? "Citizens appear only where written consent is on file; no minors." : "No citizen close-ups or testimonials are scheduled — written consent is not in place.");
    if (election(a)) {
      const span = (xs: number[]) => (xs.length ? `${fmtDate(days[xs[0] - 1].date)} – ${fmtDate(days[xs[xs.length - 1] - 1].date)}` : "");
      if (el.mcc.length) out.push(`Model Code of Conduct mode on ${span(el.mcc)}: scheme explainers and resolved-complaint stories are switched off and each of these days is marked in the calendar. ${MCC_NOTE}`);
      if (el.silence.length)
        out.push(
          reminderOn(a)
            ? `Silence period ${span(el.silence)}: no campaign content is scheduled; polling day carries only the neutral voting reminder you turned on.`
            : `Silence period ${span(el.silence)}: nothing is scheduled on polling day or in the 48 hours before it.`,
        );
      if (a.events.some((e) => e.kind === "inauguration" && el.mcc.includes(dayOf(a.startDate, e.date)))) out.push("An inauguration falls inside the MCC period, so it is not promoted.");
      if (el.result) out.push("Result day has a neutral thank-you that works for any outcome — approve the final words on the day.");
    }
    const dropped = [a.issues.some((x) => clean(x) && breaks(x)), a.events.some((e) => e.label && breaks(e.label)), a.work.some((w) => [w.work, w.place].some((x) => clean(x) && breaks(x)))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish, so it was left out or replaced with a neutral name.");
    if (clean(a.party) && breaks(a.party)) out.push("The party name contains wording we can't publish and is left out.");
    return out;
  },
};
