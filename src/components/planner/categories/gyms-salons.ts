/** Planner questions for gyms, salons & spas. */
import { wellnessOptions } from "@/data/playbooks/wellness";
import { generateWellnessPlan, type WellnessAnswers } from "@/lib/engine/wellness-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyClass = { name: "", days: "", time: "" };
const emptyOffer = { name: "", start: "", end: "", offer: "" };

export const config: PlannerConfig = {
  slug: "gyms-salons",
  label: "Gyms, salons & spas",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "gym", goals: ["members"], services: ["", ""], timings: "", packages: "", classes: [], womenSlots: "",
    certifications: "", offers: [], onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("gyms-salons"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your place",
      questions: [
        { kind: "text", key: "name", label: "Name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "Type", name: "Type", options: wellnessOptions.types },
        { kind: "list", key: "services", label: "Services you offer", itemLabel: "Service", placeholder: "e.g. Strength training, hair colour, bridal make-up", max: 8 },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: wellnessOptions.goals, star: true },
      ],
    },
    {
      id: "schedule",
      title: "Timings, classes and packages",
      questions: [
        { kind: "text", key: "timings", label: "Timings", placeholder: "e.g. 6 am – 10 pm, closed Tuesday" },
        {
          kind: "group", key: "classes", label: "Classes (optional)", itemLabel: "Class", max: 6, empty: emptyClass,
          fields: [
            { key: "name", label: "Class", type: "text" },
            { key: "days", label: "Days", type: "text", placeholder: "e.g. Mon/Wed/Fri" },
            { key: "time", label: "Time", type: "text", placeholder: "e.g. 7 am" },
          ],
        },
        { kind: "text", key: "womenSlots", label: "Women-only slots (optional)", placeholder: "e.g. 11 am – 1 pm daily" },
        { kind: "text", key: "packages", label: "Memberships or packages (optional)", hint: "Exactly as you want them shown, with prices if you want them shown." },
        { kind: "text", key: "certifications", label: "Certifications (optional)", hint: "Exactly as on your certificates." },
      ],
    },
    {
      id: "events",
      title: "Offers, launches and events",
      questions: [
        {
          kind: "group", key: "offers", label: "Offers in the next 60 days (optional)", itemLabel: "Offer", max: 3, empty: emptyOffer,
          hint: "Exactly as you want it worded. No “guaranteed results” or urgency — we'll leave those out.",
          fields: [
            { key: "name", label: "Offer name", type: "text" },
            { key: "offer", label: "Offer, exactly as you want it shown", type: "text" },
            { key: "start", label: "Starts", type: "date" },
            { key: "end", label: "Ends", type: "date" },
          ],
        },
        { kind: "events", key: "events", label: "Launches, classes and other dates", hint: "Wedding season changes every year — add its start only with a date you have verified.", options: wellnessOptions.events.filter((e) => e.id !== "offer"), defaultKind: "launch", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Are your trainers or stylists comfortable on camera?"),
        consent3("Written consent from clients to appear?", "Needed for client photos, testimonials and any before / after (real, unedited, “Results vary”)."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("gyms, salons and spas"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as WellnessAnswers;
    return generateWellnessPlan({
      ...withDates(a),
      services: a.services.filter((s) => s.trim()),
      classes: a.classes.filter((c) => c.name.trim()),
      offers: a.offers.filter((o) => o.name.trim() && o.start),
      startDate,
    });
  },
};
