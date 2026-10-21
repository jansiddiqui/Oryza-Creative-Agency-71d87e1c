/** Planner questions for interiors, fashion & jewellery. */
import { styleOptions } from "@/data/playbooks/style";
import { generateStylePlan, type StyleAnswers } from "@/lib/engine/style-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { Answers, PlannerConfig } from "../questions";

const emptyCollection = { name: "", launch: "" };
const emptyProject = { name: "", kind: "", timeline: "", budget: "", showBudget: "no", consent: "" };
const emptyOffer = { name: "", start: "", offer: "", earlierPriceConfirmed: "no" };
const isType = (...t: string[]) => (a: Answers) => t.includes(String(a.type));

export const config: PlannerConfig = {
  slug: "interiors-fashion-jewellery",
  label: "Interiors, fashion & jewellery",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "jeweller", goals: ["launch"], specialities: ["", ""], collections: [], projects: [], hallmark: "", fabric: "",
    prices: "request", priceText: "", making: "", rateStories: "no", offers: [], workshop: "yes", onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("interiors-fashion-jewellery"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your business",
      questions: [
        { kind: "text", key: "name", label: "Business name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "You are a", name: "Business type", options: styleOptions.types },
        { kind: "list", key: "specialities", label: "Specialities", itemLabel: "Speciality", placeholder: "e.g. Bridal sets, lehengas, modular kitchens", max: 6 },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: styleOptions.goals, star: true },
      ],
    },
    {
      id: "details",
      title: "Details you want shown",
      questions: [
        { kind: "text", key: "hallmark", label: "Hallmark, BIS, HUID and purity details", hint: "Exactly as on your certificates — we never write these ourselves.", when: isType("jeweller") },
        { kind: "text", key: "making", label: "Making charges (optional)", hint: "Exactly as you want them shown.", when: isType("jeweller") },
        { kind: "choice", key: "rateStories", label: "Post your gold rate as a daily story?", name: "Rate stories", hint: "You send the rate each morning with the date and time — we never fill rates automatically.", options: yesNo("Yes", "No"), when: isType("jeweller") },
        { kind: "text", key: "fabric", label: "Fabric and craft details", hint: "Only claims you can verify (e.g. handloom, pure silk) — exactly as you want them shown.", when: isType("boutique", "designer") },
        { kind: "choice", key: "prices", label: "Show prices?", name: "Prices", options: styleOptions.prices },
        { kind: "text", key: "priceText", label: "Prices, exactly as you want them shown", when: (a) => a.prices === "show" },
        { kind: "choice", key: "workshop", label: "Can we film your workshop or how pieces are made?", name: "Workshop filming", options: yesNo("Yes", "No") },
      ],
    },
    {
      id: "launches",
      title: "Collections, projects and dates",
      questions: [
        {
          kind: "group", key: "collections", label: "Collection launches (optional)", itemLabel: "Collection", max: 3, empty: emptyCollection,
          fields: [
            { key: "name", label: "Collection name", type: "text" },
            { key: "launch", label: "Launch date", type: "date" },
          ],
          when: isType("jeweller", "boutique", "designer"),
        },
        {
          kind: "group", key: "projects", label: "Real projects to show (optional)", itemLabel: "Project", max: 4, empty: emptyProject,
          hint: "Shown only with the client's written consent. Timelines and costs exactly as you provide them.",
          fields: [
            { key: "name", label: "Project name", type: "text" },
            { key: "kind", label: "Type of space", type: "text", placeholder: "e.g. 3 BHK apartment" },
            { key: "timeline", label: "Timeline", type: "text", placeholder: "e.g. 10 weeks" },
            { key: "budget", label: "Cost (optional)", type: "text" },
            { key: "showBudget", label: "Show the cost?", type: "choice", options: yesNo("Yes", "No") },
            { key: "consent", label: "Client's written consent?", type: "choice", options: [{ id: "", label: "Choose" }, ...yesNo("Yes", "No")] },
          ],
          when: isType("interior"),
        },
        {
          kind: "group", key: "offers", label: "Offers (optional)", itemLabel: "Offer", max: 3, empty: emptyOffer,
          hint: "An offer that quotes an earlier price is shown only if you confirm that price was real.",
          fields: [
            { key: "name", label: "Offer name", type: "text" },
            { key: "offer", label: "Offer, exactly as you want it shown", type: "text" },
            { key: "start", label: "Starts", type: "date" },
            { key: "earlierPriceConfirmed", label: "If it quotes an earlier price, was that price real?", type: "choice", options: yesNo("Yes, it was the real price", "No / not applicable") },
          ],
        },
        { kind: "events", key: "events", label: "Festive days, exhibitions and wedding season", hint: "Dhanteras, Akshaya Tritiya and wedding season change every year — add them only with dates you have verified.", options: styleOptions.events, defaultKind: "festive", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Is the designer or owner comfortable on camera?"),
        consent3("Written consent from customers to appear?", "Without it, no customer faces or testimonials appear in the plan."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("interiors, fashion and jewellery"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as StyleAnswers;
    return generateStylePlan({
      ...withDates(a),
      specialities: a.specialities.filter((s) => s.trim()),
      collections: a.collections.filter((c) => c.name.trim()),
      projects: a.projects.filter((p) => p.name.trim()),
      offers: a.offers.filter((o) => o.name.trim() && o.start),
      startDate,
    });
  },
};
