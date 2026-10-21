/**
 * Medical category configs (Hospitals & clinics, Doctors) for the shared plan engine.
 * Both share the compliance layer: banned wording, consent-gated faces, doctor approval notes,
 * the emergency line and awareness days from a verified fixed-date list.
 */
import { doctorOptions, doctorPlaybook } from "@/data/playbooks/doctor";
import { hospitalOptions, hospitalPlaybook } from "@/data/playbooks/hospital";
import {
  EMERGENCY_LINE,
  MEDICAL_BANNED_WORDING,
  healthDaysFor,
  healthDaysVarying,
  medicalSeasonThemes,
  specialityLabel,
  type HealthDay,
} from "@/data/medical";
import type { Playbook } from "../types";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, BuildContext, CategoryConfig, PinContext, SummaryContext } from "../core";

export type HospitalPractice = "multi" | "single" | "clinic";
export type DoctorPractice = "own" | "hospital" | "both";
export type OnCamera = "all" | "some" | "none";
export type HospitalGoal = "footfall" | "trust" | "awareness" | "launch" | "camps";
export type DoctorGoal = "trust" | "authority" | "discovery" | "footfall" | "online";

export interface MedicalAnswers extends BaseAnswers {
  practice: HospitalPractice | DoctorPractice;
  /** First one is the main speciality. */
  specialities: string[];
  /** Hospitals: how many doctors ("1" | "few" | "many"). Doctors: always "1". */
  doctors: "1" | "few" | "many";
  onCamera: OnCamera;
  /** Exactly as the client typed it; never written by Oryza. */
  qualifications: string;
  /** OPD / clinic timings as typed ("Mon–Sat 10 am – 2 pm"). */
  opd: string;
  emergency: "yes" | "no";
  online: "yes" | "no";
  /** Chosen awareness day ids. Empty = every day relevant to the specialities. */
  awarenessDays: string[];
}

export type HospitalAnswers = MedicalAnswers & { practice: HospitalPractice; goals: HospitalGoal[] };
export type DoctorAnswers = MedicalAnswers & { practice: DoctorPractice; goals: DoctorGoal[] };

const HOSPITAL_MIX: Record<HospitalGoal, Record<string, number>> = {
  footfall: { doctors: 20, awareness: 20, facility: 15, access: 35, community: 10 },
  trust: { doctors: 30, awareness: 20, facility: 25, access: 10, community: 15 },
  awareness: { doctors: 15, awareness: 45, facility: 10, access: 10, community: 20 },
  launch: { doctors: 35, awareness: 15, facility: 15, access: 25, community: 10 },
  camps: { doctors: 15, awareness: 25, facility: 10, access: 15, community: 35 },
};

const DOCTOR_MIX: Record<DoctorGoal, Record<string, number>> = {
  trust: { expertise: 20, awareness: 15, person: 25, clinic: 10, trust: 30 },
  authority: { expertise: 40, awareness: 20, person: 15, clinic: 5, trust: 20 },
  discovery: { expertise: 20, awareness: 20, person: 10, clinic: 35, trust: 15 },
  footfall: { expertise: 20, awareness: 25, person: 10, clinic: 30, trust: 15 },
  online: { expertise: 25, awareness: 15, person: 10, clinic: 35, trust: 15 },
};

export const practiceOptions = {
  hospital: [
    { id: "multi", label: "Multi-speciality hospital" },
    { id: "single", label: "Single-speciality hospital" },
    { id: "clinic", label: "Clinic or polyclinic" },
  ],
  doctor: [
    { id: "own", label: "My own clinic" },
    { id: "hospital", label: "Consultant at a hospital" },
    { id: "both", label: "Both" },
  ],
} as const;

const season = (m: number) => (m >= 4 && m <= 6 ? "summer" : m >= 7 && m <= 9 ? "monsoon" : m >= 11 || m <= 2 ? "winter" : "spring");
const clean = (s: string) => s.trim();
const breaks = (s: string) => MEDICAL_BANNED_WORDING.test(s);

/** Qualifications appear verbatim — unless they contain wording we never publish, in which case they are left out. */
const quals = (a: MedicalAnswers) => (clean(a.qualifications) && !breaks(a.qualifications) ? clean(a.qualifications) : "");

/** Awareness days used by the plan: the chosen ones, or every day relevant to the specialities. */
export const awarenessDaysFor = (a: Pick<MedicalAnswers, "awarenessDays" | "specialities">): HealthDay[] => {
  const relevant = healthDaysFor(a.specialities);
  return a.awarenessDays.length ? relevant.filter((d) => a.awarenessDays.includes(d.id)) : relevant;
};

/** Awareness days inside the plan window, with their plan day. */
const awarenessInWindow = (a: MedicalAnswers, inWindow: (iso?: string) => number, valid: (d: number) => boolean) => {
  const year = Number(a.startDate.slice(0, 4));
  const out: { day: number; name: string }[] = [];
  for (const h of awarenessDaysFor(a))
    for (const y of [year, year + 1]) {
      const day = inWindow(`${y}-${h.md}`);
      if (valid(day)) out.push({ day, name: h.name });
    }
  return out.sort((x, y) => x.day - y.day);
};

interface Ids {
  intro: string;
  greeting: string;
  awareness: string;
  campPost: string;
  campThanks: string;
  highlightsReel: string;
  launchReel: string;
  launchPost: string;
  doctorReel?: string;
  doctorPost?: string;
  talkPost: string;
  talkReel: string;
  countdown: string;
  live: string;
  quiz: string;
}

interface MedicalSpec<A extends MedicalAnswers> {
  slug: string;
  version: string;
  playbook: Playbook;
  defaultGoal: string;
  mix: Record<string, Record<string, number>>;
  events: readonly { id: string; label: string }[];
  ids: Ids;
  /** Event kinds that launch something (doctor, speciality, clinic, service, facility). */
  launchKinds: string[];
  nameVar: "name" | "doctor";
  platformText: CategoryConfig<A>["platformText"];
  firstShootLabel: string;
  clientExtra: (ctx: SummaryContext<A>) => string[];
  oryzaPart: (ctx: SummaryContext<A>) => string[];
  snapshot: (ctx: SummaryContext<A>) => { label: string; value: string }[];
}

function medicalConfig<A extends MedicalAnswers>(spec: MedicalSpec<A>): CategoryConfig<A> {
  const { ids } = spec;
  const eventLabel = (kind: string) => spec.events.find((e) => e.id === kind)?.label ?? "Event";
  const pinsFor = (ctx: PinContext<A>) => {
    const { a, has, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions } = ctx;
    if (a.stage === "new") pin("post", 2, ids.intro, "New account: introduce the practice first");
    const camOk = !has("cam:none");
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "camp") {
        pin("post", Math.max(1, e.day - 5), ids.campPost, `5 days before ${e.name}: registration`, v);
        pin("reel", e.day + 1, ids.highlightsReel, `Day after ${e.name}`, v);
        pin("post", e.day + 2, ids.campThanks, `Two days after ${e.name}`, v);
      } else if (e.kind === "doctor" && ids.doctorPost) {
        if (camOk && ids.doctorReel) pin("reel", Math.max(e.day, firstReelDay), ids.doctorReel, `${e.name}: launch day`, v);
        pin("post", e.day, ids.doctorPost, `${e.name}: launch day`, v);
      } else if (spec.launchKinds.includes(e.kind)) {
        if (camOk) pin("reel", Math.max(e.day, firstReelDay), ids.launchReel, `${e.name}: launch day`, v);
        pin("post", e.day, ids.launchPost, `${e.name}: launch day`, v);
      } else if (e.kind === "talk") {
        pin("post", Math.max(1, e.day - 4), ids.talkPost, `4 days before ${e.name}`, v);
        pin("reel", e.day + 1, ids.talkReel, `Day after ${e.name}`, v);
      } else {
        pin("reel", e.day + 1, ids.highlightsReel, `Day after ${e.name}`, v);
        pin("post", e.day + 2, ids.campThanks, `Two days after ${e.name}`, v);
      }
    }
    const health = awarenessInWindow(a, inWindow, valid);
    for (const h of health) pin("post", h.day, ids.awareness, h.name, { event: h.name });
    // Festival and national-day greetings: never on a day that already carries a pinned post.
    for (const o of occasions()) if (!pinned("post", o.day)) pin("post", o.day, ids.greeting, o.name, { event: o.name });
  };

  return {
    slug: spec.slug,
    version: spec.version,
    playbook: spec.playbook,
    defaultGoal: spec.defaultGoal,
    pillarMix: (primary) => ({ ...(spec.mix[primary] ?? spec.mix[spec.defaultGoal]) }),

    tags: (a) => {
      const t = [`practice:${a.practice}`, `doctors:${a.doctors}`, `cam:${a.onCamera}`, `season:${season(Number(a.startDate.slice(5, 7)))}`];
      a.specialities.forEach((s) => t.push(`spec:${s}`));
      if (clean(a.opd)) t.push("has:opd");
      if (a.emergency === "yes") t.push("has:emergency");
      if (a.online === "yes") t.push("has:online");
      if (a.events.length) t.push("has:event");
      return t;
    },

    vars: (a) => {
      const name = clean(a.name) || (spec.nameVar === "doctor" ? "the doctor" : "our hospital");
      const q = quals(a);
      return {
        [spec.nameVar]: name,
        city: clean(a.city) || "your city",
        speciality: specialityLabel(a.specialities[0] ?? "general"),
        opd: clean(a.opd),
        quals: q ? `, ${q}` : "",
      };
    },

    // Event names typed by the client are used only if they pass the wording rules.
    eventName: (e) => (e.label && clean(e.label) && !breaks(e.label) ? clean(e.label) : eventLabel(e.kind)),

    templateLists: (a) => {
      const list = (a.specialities.length ? a.specialities : ["general"]).map(specialityLabel);
      const cycled = spec.playbook.templates.filter((t) => !t.pinnedOnly && /\{speciality\}/.test(t.title));
      return Object.fromEntries(cycled.map((t) => [t.id, { key: "speciality", list, mode: "cycle" as const }]));
    },

    facesAllowed: (a) => a.consent === "yes",
    bannedWording: MEDICAL_BANNED_WORDING,
    pins: pinsFor,

    shootStory: { id: ids.live, title: "Behind the scenes of today's shoot", hook: "Quick clips while we film — no patients" },

    pinnedStories: ({ a, eventDays, story, inWindow, valid }: BuildContext<A>) => {
      for (const e of eventDays) {
        if (e.kind === "camp" || e.kind === "talk") {
          for (let k = 3; k >= 1; k--) story(e.day - k, ids.countdown, `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
          story(e.day, ids.live, `Live from ${e.name}`, "6–8 stories through the day — no identifiable patients", e.name);
        } else if (spec.launchKinds.includes(e.kind) || e.kind === "doctor") {
          story(e.day - 1, ids.countdown, `Coming tomorrow: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
        } else {
          story(e.day, ids.live, `Live from ${e.name}`, "6–8 stories through the day — no identifiable patients", e.name);
        }
      }
      for (const h of awarenessInWindow(a, inWindow, valid)) story(h.day, ids.quiz, `Quiz: ${h.name}`, "True-or-false sticker, answer in the next story", h.name);
    },

    platformText: spec.platformText,

    whatsappBeforeReminders: ({ eventDays, add }) => {
      for (const e of eventDays.filter((x) => x.kind === "camp"))
        add(Math.max(1, e.day - 5), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: ${e.name} — date, place and how to register`, who: "Oryza", time: "10:00 am", pinnedReason: `5 days before ${e.name}` });
    },

    gbpExtra: ({ add, has }) => {
      add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: has("has:opd") ? "Check opening hours, holiday hours, services and booking link" : "Add opening hours, services and booking link", who: "Oryza", time: "12:00 pm" });
      add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with patients after their visit — honest reviews only, never paid, scripted or in exchange for anything", who: "Oryza", time: "12:00 pm" });
      add(20, { templateId: "GBP-Q", platform: "gbp", format: "gpost", title: "Answer the 3 most common patient questions in Q&A (doctor-approved)", who: "Oryza", time: "12:00 pm" });
    },

    websiteExtra: ({ add, has }) => {
      if (has("has:emergency")) add(2, { templateId: "WEB-E", platform: "website", format: "blog", title: "Emergency contact block on every page: call 112 (108 for an ambulance) plus the emergency desk number", who: "Oryza", time: "9:00 am" });
      if (has("has:online")) add(6, { templateId: "WEB-O", platform: "website", format: "blog", title: "Online consultation page: how to book, what to keep ready, when to come in person", who: "Oryza", time: "9:00 am" });
    },

    firstShootLabel: spec.firstShootLabel,

    clientPart: (ctx) => {
      const { a, shootCount, shoots, has } = ctx;
      return [
        "Give Oryza access to the selected accounts in week 1.",
        "Doctors approve every medical fact within 24 hours — nothing medical is published without approval.",
        shootCount
          ? has("cam:none")
            ? `Make the facility and team available on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}); doctors stay off camera.`
            : `Make the facility and on-camera doctors available on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).`
          : "Send photos and short videos every week using our media checklist — no patients in frame.",
        a.consent === "yes"
          ? "Keep a written consent form on file for every patient who appears (a guardian's for minors)."
          : "Patients will not appear — no faces, names, case photos or testimonials — until written consent is in place.",
        quals(a) ? "Tell us at once if any qualification or registration detail changes." : "Send qualifications and registrations exactly as you want them shown — we never write them ourselves.",
        ...spec.clientExtra(ctx),
      ];
    },

    oryzaPart: spec.oryzaPart,

    monthThemes: (m, { a }) => {
      const days = awarenessDaysFor(a).filter((h) => Number(h.md.slice(0, 2)) === m).map((h) => h.name);
      return [...days, ...(medicalSeasonThemes[m] ?? [])].slice(0, 4);
    },

    snapshot: spec.snapshot,

    compliance: ({ a, has, sel, eventDays }) => {
      const out = [
        "Every item marked “Doctor approves” is drafted by Oryza and approved by the doctor before it is published.",
        a.consent === "yes"
          ? "Patient stories appear only for patients whose written consent is on file (a guardian's for minors)."
          : "No patient faces, names, case photos or testimonials are scheduled — written consent is not in place.",
        "Templates with cure, guarantee, “best”, comparison, offer or fear-based wording are never scheduled.",
      ];
      if (has("cam:none")) out.push("Doctors stay off camera: reels use the facility, the team's hands and designed explainers with the doctor's voice-over.");
      if (has("has:emergency")) out.push(`Every emergency item carries: “${EMERGENCY_LINE}”`);
      if (quals(a)) out.push(`Qualifications are shown exactly as provided: “${quals(a)}”.`);
      else if (clean(a.qualifications)) out.push("The qualifications text contained wording we can't publish, so it is left out — please send it exactly as registered.");
      else out.push("No qualifications are shown until you send them exactly as registered.");
      const renamed = a.events.filter((e) => e.label && clean(e.label) && breaks(e.label));
      if (renamed.length) out.push(`${renamed.length === 1 ? "One event name was" : `${renamed.length} event names were`} replaced with a neutral name because it used wording we can't publish.`);
      if (sel.has("gbp")) out.push("Reviews: we only invite genuine patients to share honest feedback — never paid, scripted or incentivised, and never fake.");
      out.push(`Awareness days with changing dates (${healthDaysVarying.map((d) => d.name).join(", ")}) are not auto-scheduled — we verify the date each year first.`);
      if (eventDays.some((e) => e.kind === "camp")) out.push("Health camps: no prices, offers or “free” promotion — date, place, who should come and how to register only.");
      return out;
    },
  };
}

const practiceLabel = (list: readonly { id: string; label: string }[], id: string) => list.find((p) => p.id === id)?.label ?? "";
const period = (a: MedicalAnswers) => `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}`;
const yesNo = (v: "yes" | "no") => (v === "yes" ? "Yes" : "No");

export const hospitalConfig: CategoryConfig<HospitalAnswers> = medicalConfig<HospitalAnswers>({
  slug: "hospitals-clinics",
  version: "hospital-v1",
  playbook: hospitalPlaybook,
  defaultGoal: "footfall",
  mix: HOSPITAL_MIX,
  events: hospitalOptions.events,
  ids: {
    intro: "HP14",
    greeting: "HP07",
    awareness: "HP08",
    campPost: "HP09",
    campThanks: "HP10",
    highlightsReel: "HR15",
    launchReel: "HR14",
    launchPost: "HP12",
    doctorReel: "HR13",
    doctorPost: "HP11",
    talkPost: "HP13",
    talkReel: "HR16",
    countdown: "HS04",
    live: "HS03",
    quiz: "HS06",
  },
  launchKinds: ["speciality", "facility"],
  nameVar: "name",
  platformText: {
    facebookCaption: "Longer Hindi–English caption for families",
    whatsappStatus: (v) => `Status: OPD timings and this week at ${v.name}`,
    whatsappDeliverable: "Appointment quick replies with OPD timings and the emergency line",
    youtubeVideo: (v) => `Inside ${v.name}: departments and how to book (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days, chaptered by department",
    websiteBlog: ({ vars }) => `When to see a ${vars.speciality} doctor in ${vars.city}: a simple guide (doctor-approved)`,
    linkedin: ({ vars }) => [
      { day: 9, title: `Meet the ${vars.speciality} team at ${vars.name}` },
      { day: 23, title: `Careers at ${vars.name}: our nurses and staff` },
    ],
    pinterest: "5 health-tip pins (doctor-approved)",
    x: "Health update and OPD notice",
  },
  firstShootLabel: "Shoot day: departments, doctors and facilities",
  clientExtra: () => ["Share camp, launch and event dates as early as possible."],
  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item — medical content drafted by Oryza, approved by your doctors.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list and no patients in frame.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; appointment requests passed to your front desk, and every emergency message answered with the emergency line.",
    "A monthly report: reach, followers, calls, direction requests and the top content.",
  ],
  snapshot: ({ a, vars, primary }) => [
    { label: "Hospital or clinic", value: `${vars.name}, ${vars.city}` },
    { label: "Type and specialities", value: `${practiceLabel(practiceOptions.hospital, a.practice)} · ${(a.specialities.length ? a.specialities : ["general"]).map(specialityLabel).join(", ")}` },
    { label: "Main goal", value: hospitalOptions.goals.find((g) => g.id === primary)?.label ?? "" },
    { label: "OPD timings", value: vars.opd || "To be confirmed in the audit" },
    { label: "Emergency / online consultation", value: `${yesNo(a.emergency)} / ${yesNo(a.online)}` },
    { label: "Plan period", value: period(a) },
  ],
});

export const doctorConfig: CategoryConfig<DoctorAnswers> = medicalConfig<DoctorAnswers>({
  slug: "doctors",
  version: "doctor-v1",
  playbook: doctorPlaybook,
  defaultGoal: "trust",
  mix: DOCTOR_MIX,
  events: doctorOptions.events,
  ids: {
    intro: "DP14",
    greeting: "DP08",
    awareness: "DP09",
    campPost: "DP10",
    campThanks: "DP11",
    highlightsReel: "DR21",
    launchReel: "DR22",
    launchPost: "DP12",
    talkPost: "DP13",
    talkReel: "DR21",
    countdown: "DS04",
    live: "DS03",
    quiz: "DS06",
  },
  launchKinds: ["clinic", "service"],
  nameVar: "doctor",
  platformText: {
    facebookCaption: "Longer Hindi–English caption for patients and families",
    whatsappStatus: (v) => `Status: clinic timings and this week's tip from ${v.doctor}`,
    whatsappDeliverable: "Appointment quick replies with clinic timings and the emergency line",
    youtubeVideo: (v) => `${v.doctor} answers common ${v.speciality} questions (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days, chaptered by question",
    websiteBlog: ({ vars }) => `${vars.speciality} in ${vars.city}: questions to ask at your first visit`,
    linkedin: ({ vars }) => [
      { day: 9, title: `A note for referring doctors: when to refer to ${vars.speciality}` },
      { day: 23, title: `${vars.doctor}: learning and teaching this month` },
    ],
    pinterest: "5 health-tip pins (doctor-approved)",
    x: "Clinic update and a health tip",
  },
  firstShootLabel: "Shoot day: the doctor, the clinic and explainers",
  clientExtra: () => ["Share talks, camps and clinic changes as early as possible.", "Follow your medical council's guidance on publicity — we flag anything that may conflict before it goes out."],
  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item — medical content drafted by Oryza, approved by you.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list and no patients in frame.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; appointment requests passed to your clinic, and every emergency message answered with the emergency line.",
    "A monthly report: reach, followers, calls, direction requests and the top content.",
  ],
  snapshot: ({ a, vars, primary }) => [
    { label: "Doctor", value: `${vars.doctor}${vars.quals}, ${vars.city}` },
    { label: "Speciality and practice", value: `${(a.specialities.length ? a.specialities : ["general"]).map(specialityLabel).join(", ")} · ${practiceLabel(practiceOptions.doctor, a.practice)}` },
    { label: "Main goal", value: doctorOptions.goals.find((g) => g.id === primary)?.label ?? "" },
    { label: "Clinic timings", value: vars.opd || "To be confirmed in the audit" },
    { label: "Online consultation", value: yesNo(a.online) },
    { label: "Plan period", value: period(a) },
  ],
});
