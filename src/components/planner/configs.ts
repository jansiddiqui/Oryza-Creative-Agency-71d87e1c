/**
 * Planner question definitions per category. The plan builder renders its steps from these — no category's
 * form is hard-coded. Each config also says how to turn the answers into a plan with the shared engine.
 */
import { categoryBySlug } from "@/data/categories";
import { healthDaysFor, specialities } from "@/data/medical";
import type { PlatformId } from "@/data/platforms";
import { doctorOptions } from "@/data/playbooks/doctor";
import { hospitalOptions } from "@/data/playbooks/hospital";
import { schoolOptions } from "@/data/playbooks/school";
import { practiceOptions } from "@/lib/engine/categories/medical";
import { generateDoctorPlan, generateHospitalPlan, type DoctorAnswers, type HospitalAnswers } from "@/lib/engine/medical-engine";
import { generateSchoolPlan, type SchoolAnswers } from "@/lib/engine/school-engine";
import type { Plan } from "@/lib/engine/types";

export type Answers = Record<string, unknown>;
export interface Opt { id: string; label: string }
type Options = readonly Opt[] | ((a: Answers) => readonly Opt[]);

interface QBase {
  key: string;
  label: string;
  hint?: string;
  /** Shown only when this returns true. */
  when?: (a: Answers) => boolean;
  /** Half-width: consecutive half questions share a two-column row. */
  half?: boolean;
}

export type Question =
  | (QBase & { kind: "text"; required?: boolean; placeholder?: string })
  | (QBase & { kind: "date" })
  | (QBase & { kind: "choice"; name: string; options: Options })
  | (QBase & { kind: "multi"; options: Options; max?: number; /** The first pick is starred as the main one. */ star?: boolean })
  | (QBase & { kind: "events"; options: readonly Opt[]; defaultKind: string; withLabel?: string; max?: number })
  | (QBase & { kind: "list"; itemLabel: string; placeholder?: string })
  | (QBase & { kind: "platforms" })
  | (QBase & { kind: "optimize" })
  | (QBase & { kind: "package" });

export interface PlannerStep {
  id: string;
  title: string;
  questions: Question[];
}

export interface PlannerConfig {
  slug: string;
  /** Short name used in the progress label ("Schools · step 1 of 5"). */
  label: string;
  initial: Answers;
  steps: PlannerStep[];
  /** Key of the required name field. */
  nameKey: string;
  generate: (a: Answers, startDate: string) => Plan;
}

const corePlatforms = (slug: string) => (Object.keys(categoryBySlug[slug].fit) as PlatformId[]).filter((p) => categoryBySlug[slug].fit[p] === "core");

const stageQ: Question = { kind: "choice", key: "stage", label: "Your social media today", name: "Stage", options: [{ id: "new", label: "Not started" }, { id: "revive", label: "Page exists, rarely posts" }, { id: "active", label: "Posting regularly" }] };
const shootOptions = (own: string) => [{ id: "1", label: "1 shoot day a month" }, { id: "2", label: "2 shoot days" }, { id: "weekly", label: "Weekly access" }, { id: "own", label: own }];
const platformsQ = (who: string): Question => ({ kind: "platforms", key: "platforms", label: "Which platforms should we manage?", hint: `Core platforms for ${who} are pre-selected.` });
const optimizeQ: Question = { kind: "optimize", key: "optimize", label: "Optimize these profiles first? (one-time, extra cost)" };
const packageStep: PlannerStep = { id: "package", title: "How much content each month?", questions: [{ kind: "package", key: "pkg", label: "Package" }] };
const yesNo = (yes: string, no: string) => [{ id: "yes", label: yes }, { id: "no", label: no }];
const withDates = <T extends { events: { date: string }[] }>(a: T) => ({ ...a, events: a.events.filter((e) => e.date) });

const school: PlannerConfig = {
  slug: "schools",
  label: "Schools",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", board: "cbse", level: "12", goals: ["admissions"],
    admissionOpen: "", admissionClose: "", events: [], usps: [], achievements: ["", "", ""],
    stage: "revive", consent: "some", shoot: "2", pkg: "growth", platforms: corePlatforms("schools"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your school",
      questions: [
        { kind: "text", key: "name", label: "School name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "board", label: "Board", name: "Board", options: schoolOptions.boards },
        { kind: "choice", key: "level", label: "Classes offered", name: "Classes", options: schoolOptions.levels },
      ],
    },
    {
      id: "goals",
      title: "Goals and admission dates",
      questions: [
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: schoolOptions.goals, star: true },
        { kind: "date", key: "admissionOpen", label: "Admissions open on", hint: "Leave empty if not decided.", half: true },
        { kind: "date", key: "admissionClose", label: "Last date for admission", half: true },
      ],
    },
    {
      id: "details",
      title: "Events, strengths and achievements",
      questions: [
        { kind: "events", key: "events", label: "Events in the next 60 days", options: schoolOptions.events, defaultKind: "sports" },
        { kind: "multi", key: "usps", label: "What makes you different?", hint: "Pick up to 3.", options: schoolOptions.usps, max: 3 },
        { kind: "list", key: "achievements", label: "Recent achievements", itemLabel: "Achievement", hint: "Toppers, competitions, awards — only real ones. Each becomes a post.", placeholder: "e.g. District science fair winner" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        { kind: "choice", key: "consent", label: "Written parent consent for student photos?", name: "Consent", options: [{ id: "yes", label: "Yes, written" }, { id: "some", label: "Some" }, { id: "no", label: "No" }] },
        { kind: "choice", key: "shoot", label: "How much time can the school give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("schools"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as Omit<SchoolAnswers, "startDate">;
    return generateSchoolPlan({ ...withDates(a), admissionOpen: a.admissionOpen || undefined, admissionClose: a.admissionClose || undefined, startDate });
  },
};

const specialityOptions: readonly Opt[] = specialities;
const awarenessOptions = (a: Answers) => healthDaysFor((a.specialities as string[]) ?? []).map((d) => ({ id: d.id, label: d.name }));
const awarenessHint = "Picked from your specialities. Leave all unselected to include every relevant day. Days whose date changes each year are checked by us first and never auto-scheduled.";
const consentQ = (label: string): Question => ({ kind: "choice", key: "consent", label, name: "Consent", hint: "Without it, no patient faces, names, case photos or testimonials appear in the plan.", options: [{ id: "yes", label: "Yes, written" }, { id: "some", label: "Some" }, { id: "no", label: "No" }] });

const medicalInitial = (slug: string, extra: Answers): Answers => ({
  name: "", city: "Kanpur", specialities: ["general"], onCamera: "some", qualifications: "", opd: "",
  emergency: "no", online: "no", awarenessDays: [], events: [], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: corePlatforms(slug), optimize: [], ...extra,
});

const hospital: PlannerConfig = {
  slug: "hospitals-clinics",
  label: "Hospitals & clinics",
  nameKey: "name",
  initial: medicalInitial("hospitals-clinics", { practice: "multi", doctors: "few", goals: ["footfall"] }),
  steps: [
    {
      id: "basics",
      title: "About your hospital or clinic",
      questions: [
        { kind: "text", key: "name", label: "Hospital or clinic name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "practice", label: "Type", name: "Type", options: practiceOptions.hospital },
        { kind: "multi", key: "specialities", label: "Specialities", hint: "Pick up to 6. The first one you pick is your main speciality.", options: specialityOptions, max: 6, star: true },
        { kind: "choice", key: "doctors", label: "How many doctors?", name: "Doctors", options: [{ id: "1", label: "1" }, { id: "few", label: "2–5" }, { id: "many", label: "6 or more" }] },
      ],
    },
    {
      id: "goals",
      title: "Goals",
      questions: [
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: hospitalOptions.goals, star: true },
      ],
    },
    {
      id: "doctors",
      title: "Doctors, timings and services",
      questions: [
        { kind: "choice", key: "onCamera", label: "Who is comfortable on camera?", name: "On camera", hint: "If no one, reels use the facility, the team's hands and designed explainers with a doctor's voice-over.", options: [{ id: "all", label: "Most doctors" }, { id: "some", label: "One or two doctors" }, { id: "none", label: "No one — keep doctors off camera" }] },
        { kind: "text", key: "qualifications", label: "Accreditations and registrations to show", hint: "Type them exactly as issued — we show them word for word and never write them ourselves. Leave empty if unsure.", placeholder: "Exactly as on your certificate" },
        { kind: "text", key: "opd", label: "OPD timings", placeholder: "e.g. Mon–Sat, 9 am – 2 pm and 5 – 8 pm" },
        { kind: "choice", key: "emergency", label: "Do you run a 24×7 emergency service?", name: "Emergency", options: yesNo("Yes, 24×7", "No") },
        { kind: "choice", key: "online", label: "Do you offer online consultations?", name: "Online consultations", options: yesNo("Yes", "No") },
      ],
    },
    {
      id: "events",
      title: "Camps, launches and awareness days",
      questions: [
        { kind: "events", key: "events", label: "Camps, launches and events in the next 60 days", hint: "Add a name if you like (e.g. the camp or the new doctor's name) — never a patient's.", options: hospitalOptions.events, defaultKind: "camp", withLabel: "Name (optional)" },
        { kind: "multi", key: "awarenessDays", label: "Health awareness days to mark", hint: awarenessHint, options: awarenessOptions },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        consentQ("Written patient consent for photos, videos or testimonials?"),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("hospitals and clinics"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => generateHospitalPlan({ ...withDates(raw as unknown as HospitalAnswers), startDate }),
};

const doctor: PlannerConfig = {
  slug: "doctors",
  label: "Doctors",
  nameKey: "name",
  initial: medicalInitial("doctors", { practice: "own", doctors: "1", goals: ["trust"] }),
  steps: [
    {
      id: "basics",
      title: "About you and your practice",
      questions: [
        { kind: "text", key: "name", label: "Your name, as you want it shown", required: true, placeholder: "e.g. Dr. A. Sharma", half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "multi", key: "specialities", label: "Your speciality", hint: "Pick up to 3. The first one you pick is your main speciality.", options: specialityOptions, max: 3, star: true },
        { kind: "choice", key: "practice", label: "Where do you practise?", name: "Practice", options: practiceOptions.doctor },
        { kind: "text", key: "qualifications", label: "Your qualifications", hint: "Type them exactly as registered — we show them word for word and never write them ourselves. Leave empty if unsure.", placeholder: "Exactly as registered" },
      ],
    },
    {
      id: "goals",
      title: "Goals",
      questions: [
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: doctorOptions.goals, star: true },
      ],
    },
    {
      id: "clinic",
      title: "Camera, timings and services",
      questions: [
        { kind: "choice", key: "onCamera", label: "Are you comfortable on camera?", name: "On camera", options: [{ id: "all", label: "Yes" }, { id: "some", label: "Short clips only" }, { id: "none", label: "No — designs and voice-over" }] },
        { kind: "text", key: "opd", label: "Clinic timings", placeholder: "e.g. Mon–Sat, 6 – 9 pm" },
        { kind: "choice", key: "online", label: "Do you offer online consultations?", name: "Online consultations", options: yesNo("Yes", "No") },
        { kind: "choice", key: "emergency", label: "Do you see emergency cases?", name: "Emergency", options: yesNo("Yes", "No") },
      ],
    },
    {
      id: "events",
      title: "Camps, talks and awareness days",
      questions: [
        { kind: "events", key: "events", label: "Camps, talks and launches in the next 60 days", hint: "Add a name if you like — never a patient's.", options: doctorOptions.events, defaultKind: "talk", withLabel: "Name (optional)" },
        { kind: "multi", key: "awarenessDays", label: "Health awareness days to mark", hint: awarenessHint, options: awarenessOptions },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        consentQ("Written patient consent for photos, videos or testimonials?"),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("I'll send my own photos") },
        platformsQ("doctors"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => generateDoctorPlan({ ...withDates(raw as unknown as DoctorAnswers), startDate }),
};

export const plannerConfigs: Record<string, PlannerConfig> = { schools: school, "hospitals-clinics": hospital, doctors: doctor };

export const resolveOptions = (o: Options, a: Answers) => (typeof o === "function" ? o(a) : o);
