/** Planner questions for political leaders. */
import { politicalOptions } from "@/data/playbooks/political";
import { generatePoliticalPlan, type PoliticalAnswers } from "@/lib/engine/political-engine";
import { corePlatforms, stageQ, shootOptions, platformsQ, optimizeQ, packageStep, withDates, consent3, cameraQ } from "../questions";
import type { PlannerConfig } from "../questions";

export const config: PlannerConfig = {
  slug: "political-leaders",
  label: "Political leaders",
  nameKey: "name",
  initial: {
    name: "", city: "", role: "mla", goals: ["connect"], party: "", area: "", district: "Kanpur Nagar", languages: ["hindi"], issues: ["", "", ""],
    meetingDay: "none", meetingTime: "", election: "none", mccStart: "", pollingDate: "", resultDate: "", pollReminder: "no", onCamera: "all", team: "small",
    grievance: "office", grievanceContact: "", work: [], events: [], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
    platforms: corePlatforms("political-leaders"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About you",
      questions: [
        { kind: "text", key: "name", label: "Your name, as you want it shown", required: true },
        { kind: "choice", key: "role", label: "Your role", name: "Role", options: politicalOptions.roles },
        { kind: "text", key: "party", label: "Party (optional — leave empty if independent)", hint: "For our records only. Our templates are non-partisan; send logos and colours as files if you want them used." },
        { kind: "text", key: "area", label: "Constituency or ward", half: true },
        { kind: "text", key: "district", label: "District", half: true },
        { kind: "multi", key: "languages", label: "Languages for captions", options: politicalOptions.languages },
      ],
    },
    {
      id: "goals",
      title: "Goals and local issues",
      questions: [
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: politicalOptions.goals, star: true },
        { kind: "list", key: "issues", label: "Top 3 local issues", itemLabel: "Issue", hint: "In your words. We listen and ask for suggestions — no statistics unless you give the source.", placeholder: "e.g. Drainage in the old market" },
      ],
    },
    {
      id: "work",
      title: "Meetings, events and work done",
      questions: [
        { kind: "choice", key: "meetingDay", label: "Regular public meeting (janta darbar)", name: "Meeting day", options: politicalOptions.weekdays },
        { kind: "text", key: "meetingTime", label: "Meeting time and place", placeholder: "e.g. 10 am – 1 pm at the area office", when: (a) => a.meetingDay !== "none" },
        { kind: "events", key: "events", label: "Events in the next 60 days", options: politicalOptions.events, defaultKind: "visit", withLabel: "Name (optional)" },
        {
          kind: "group", key: "work", label: "Work done you can show", itemLabel: "Work done", max: 5, empty: { work: "", date: "", place: "" },
          hint: "Only real, completed work with real photos. Each item is marked “client-provided fact — verify before posting”.",
          fields: [
            { key: "work", label: "What was done", type: "text", wide: true, placeholder: "e.g. Community hall repaired" },
            { key: "date", label: "When", type: "date" },
            { key: "place", label: "Where", type: "text", placeholder: "e.g. Ward 4" },
          ],
        },
      ],
    },
    {
      id: "election",
      title: "Election",
      questions: [
        { kind: "choice", key: "election", label: "Is an election coming up?", name: "Election", hint: "With dates, the plan switches to Model Code of Conduct mode and keeps the silence period clear. This is guidance — your legal or election team must confirm.", options: [{ id: "none", label: "No election in the next 60 days" }, { id: "upcoming", label: "Yes, dates announced" }] },
        { kind: "date", key: "mccStart", label: "Model Code of Conduct starts", half: true, when: (a) => a.election === "upcoming" },
        { kind: "date", key: "pollingDate", label: "Polling day in your constituency", half: true, when: (a) => a.election === "upcoming" },
        { kind: "date", key: "resultDate", label: "Result day (optional)", half: true, when: (a) => a.election === "upcoming" },
        { kind: "choice", key: "pollReminder", label: "Post a neutral voting reminder on polling day", name: "Polling-day reminder", hint: "Turn on only after your election team confirms. When off, polling day and the 48 hours before it stay completely empty.", options: [{ id: "no", label: "Off" }, { id: "yes", label: "On" }], when: (a) => a.election === "upcoming" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Are you comfortable on camera?"),
        { kind: "choice", key: "team", label: "Team available for shoots", name: "Team", options: [{ id: "none", label: "Just me" }, { id: "small", label: "1–2 people" }, { id: "large", label: "3 or more" }] },
        { kind: "choice", key: "grievance", label: "How do citizens reach you?", name: "Grievance channel", options: [{ id: "office", label: "Office visit" }, { id: "whatsapp", label: "WhatsApp" }, { id: "both", label: "Both" }] },
        { kind: "text", key: "grievanceContact", label: "Office address or WhatsApp number to show", hint: "Exactly as you want it published." },
        consent3("Written consent from citizens to appear?", "Without it, no citizen close-ups or testimonials appear. Minors never appear."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("I'll send my own photos") },
        platformsQ("political leaders"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as PoliticalAnswers;
    return generatePoliticalPlan({ ...withDates(a), city: a.district, work: a.work.filter((w) => w.work.trim()), startDate });
  },
};
