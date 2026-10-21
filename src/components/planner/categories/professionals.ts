/** Planner questions for professionals — the profession switch changes which questions and rules apply. */
import { professionalOptions } from "@/data/playbooks/professionals";
import { generateProfessionalsPlan, type ProfessionalAnswers } from "@/lib/engine/professionals-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { Answers, PlannerConfig } from "../questions";

const emptyDeadline = { name: "", date: "" };
const emptyClient = { name: "", permission: "" };
const strict = (a: Answers) => a.profession !== "consultant";
const isCa = (a: Answers) => a.profession === "ca" || a.profession === "cs";

export const config: PlannerConfig = {
  slug: "professionals",
  label: "Professionals",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", profession: "ca", goals: ["awareness"], areas: ["", ""], experience: "", credentials: "", team: "solo", languages: "Hindi, English",
    deadlines: [], clients: [], onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "1", pkg: "growth", platforms: corePlatforms("professionals"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About you",
      questions: [
        { kind: "text", key: "name", label: "Your name or firm name, as you want it shown", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        {
          kind: "choice", key: "profession", label: "Your profession", name: "Profession", options: professionalOptions.professions,
          hint: "Lawyers, CAs and CSs get strict rules (Bar Council / ICAI / ICSI): educational content only, no solicitation, testimonials, results or fees.",
        },
        { kind: "list", key: "areas", label: "Specialisations or areas of practice", itemLabel: "Area", placeholder: "e.g. GST, property law, leadership coaching", max: 6 },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: professionalOptions.goals, star: true },
      ],
    },
    {
      id: "profile",
      title: "Profile details",
      questions: [
        { kind: "text", key: "experience", label: "Experience (optional)", placeholder: "e.g. Practising since 2012", hint: "Exactly as you want it shown." },
        { kind: "text", key: "credentials", label: "Enrolment, membership and qualifications (optional)", hint: "Exactly as you want them shown — we never write them ourselves." },
        { kind: "choice", key: "team", label: "Team size", name: "Team size", options: professionalOptions.team },
        { kind: "text", key: "languages", label: "Languages you work in" },
      ],
    },
    {
      id: "dates",
      title: "Deadlines, webinars and events",
      questions: [
        {
          kind: "group", key: "deadlines", label: "Deadlines relevant to your clients (optional)", itemLabel: "Deadline", max: 6, empty: emptyDeadline,
          hint: "Exactly as notified — every reminder is marked “verify on the official portal”. We never auto-fill statutory dates.",
          fields: [
            { key: "name", label: "Deadline", type: "text", placeholder: "e.g. GSTR-3B for the month" },
            { key: "date", label: "Due date", type: "date" },
          ],
          when: isCa,
        },
        { kind: "events", key: "events", label: "Webinars, talks and events", options: professionalOptions.events, defaultKind: "webinar", withLabel: "Name (optional)" },
        {
          kind: "group", key: "clients", label: "Clients you may name in case studies (optional)", itemLabel: "Client", max: 4, empty: emptyClient,
          hint: "Only with their written permission.",
          fields: [
            { key: "name", label: "Client", type: "text" },
            { key: "permission", label: "Written permission?", type: "choice", options: [{ id: "", label: "Choose" }, ...yesNo("Yes", "No")] },
          ],
          when: (a) => !strict(a),
        },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Are you comfortable on camera?"),
        { ...consent3("Written consent from clients for testimonials?", "Testimonials appear only from real clients with consent."), when: (a) => !strict(a) },
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("I'll send my own photos") },
        platformsQ("professionals"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as ProfessionalAnswers;
    return generateProfessionalsPlan({
      ...withDates(a),
      areas: a.areas.filter((x) => x.trim()),
      deadlines: a.deadlines.filter((d) => d.name.trim() && d.date),
      clients: a.clients.filter((c) => c.name.trim()),
      startDate,
    });
  },
};
