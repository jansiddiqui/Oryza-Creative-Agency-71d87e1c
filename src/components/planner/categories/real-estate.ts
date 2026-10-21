/** Planner questions for real estate. */
import { realEstateOptions } from "@/data/playbooks/real-estate";
import { generateRealEstatePlan, type RealEstateAnswers } from "@/lib/engine/real-estate-engine";
import { corePlatforms, stageQ, shootOptions, platformsQ, optimizeQ, packageStep, yesNo, withDates, consent3, cameraQ } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyProject = { name: "", type: "apartments", location: "", stage: "uc", rera: "", units: "", price: "", possession: "", launch: "", booking: "", handover: "", sample: "no" };

export const config: PlannerConfig = {
  slug: "real-estate",
  label: "Real estate",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", role: "builder", goals: ["visits"], projects: [{ ...emptyProject }], reraSite: "", agentRera: "",
    amenities: [], visit: "", siteAccess: "yes", banks: "", distances: ["", ""], offer: "", onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("real-estate"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your business",
      questions: [
        { kind: "text", key: "name", label: "Company or brand name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "role", label: "You are a", name: "Role", options: realEstateOptions.roles },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: realEstateOptions.goals, star: true },
      ],
    },
    {
      id: "projects",
      title: "Your projects and RERA",
      questions: [
        {
          kind: "group", key: "projects", label: "Projects", itemLabel: "Project", max: 4, empty: emptyProject,
          hint: "A project without a RERA number gets brand and educational content only — no selling or booking content. Type every detail exactly as you want it shown.",
          fields: [
            { key: "name", label: "Project name", type: "text" },
            { key: "type", label: "Type", type: "choice", options: realEstateOptions.types },
            { key: "location", label: "Location", type: "text" },
            { key: "stage", label: "Stage", type: "choice", options: realEstateOptions.stages },
            { key: "rera", label: "RERA registration number (exactly as issued)", type: "text", wide: true },
            { key: "units", label: "Home types and sizes (optional)", type: "text", placeholder: "e.g. 2 and 3 BHK" },
            { key: "price", label: "Price as you want it shown (optional)", type: "text", placeholder: "e.g. Starting from ₹45 lakh" },
            { key: "possession", label: "Possession date as declared to RERA", type: "text", placeholder: "e.g. December 2028" },
            { key: "sample", label: "Sample flat ready?", type: "choice", options: yesNo("Yes", "No") },
            { key: "launch", label: "Launch date (if in the next 60 days)", type: "date" },
            { key: "booking", label: "Bookings open (if in the next 60 days)", type: "date" },
            { key: "handover", label: "Possession or handover starts (if in the next 60 days)", type: "date", wide: true },
          ],
        },
        { kind: "text", key: "reraSite", label: "RERA website shown in posts", hint: "Exactly as on your registration certificate.", placeholder: "e.g. the UP RERA portal address" },
        { kind: "text", key: "agentRera", label: "Your RERA agent registration number", hint: "Needed for listing posts — exactly as issued.", when: (a) => a.role === "broker" },
      ],
    },
    {
      id: "homes",
      title: "Amenities, visits and location",
      questions: [
        { kind: "multi", key: "amenities", label: "Key amenities", hint: "Under-construction amenities are shown only as renders labelled “Artist's impression”.", options: realEstateOptions.amenities },
        { kind: "text", key: "visit", label: "Site-visit days and timings", placeholder: "e.g. Sat–Sun, 10 am – 6 pm" },
        { kind: "list", key: "distances", label: "Location advantages, with distances", itemLabel: "Location advantage", hint: "As you have measured them — we show them word for word.", placeholder: "e.g. Kanpur Central: 8 km", max: 5 },
        { kind: "text", key: "banks", label: "Home-loan partner banks (optional)", hint: "Names exactly as you want them shown; we never mention interest rates." },
        { kind: "text", key: "offer", label: "Festive offer (optional)", hint: "Only an offer you have approved, exactly as worded, with its terms. Leave empty and we never mention offers." },
      ],
    },
    {
      id: "events",
      title: "Events in the next 60 days",
      questions: [
        { kind: "events", key: "events", label: "Site-visit weekends, expos and handovers", hint: "Festival buying days change every year — add one only with a date you have verified.", options: realEstateOptions.events, defaultKind: "visitday", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Is the founder or sales head comfortable on camera?"),
        { kind: "choice", key: "siteAccess", label: "Can we film construction on site?", name: "Site access", options: yesNo("Yes", "No") },
        consent3("Written consent from buyers to appear?", "Without it, no buyer faces or testimonials appear in the plan."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("real estate"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => generateRealEstatePlan({ ...withDates(raw as unknown as RealEstateAnswers), distances: ((raw.distances as string[]) ?? []).filter((d) => d.trim()), startDate }),
};
