/** Planner questions for schools. */
import { schoolOptions } from "@/data/playbooks/school";
import { generateSchoolPlan, type SchoolAnswers } from "@/lib/engine/school-engine";
import { corePlatforms, stageQ, shootOptions, platformsQ, optimizeQ, packageStep, withDates } from "../questions";
import type { PlannerConfig } from "../questions";

export const config: PlannerConfig = {
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
