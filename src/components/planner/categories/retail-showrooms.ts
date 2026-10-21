/** Planner questions for retail & showrooms. */
import { retailOptions } from "@/data/playbooks/retail";
import { generateRetailPlan, type RetailAnswers } from "@/lib/engine/retail-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { PlannerConfig } from "../questions";

const emptySale = { name: "", start: "", end: "", offer: "", earlierPriceConfirmed: "no" };

export const config: PlannerConfig = {
  slug: "retail-showrooms",
  label: "Retail & showrooms",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "clothing", goals: ["footfall"], categories: ["", ""], brands: "", priceRange: "", emi: "", exchange: "", warranty: "",
    delivery: "", timings: "", branches: "", sales: [], onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("retail-showrooms"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your store",
      questions: [
        { kind: "text", key: "name", label: "Store name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "Store type", name: "Store type", options: retailOptions.types },
        { kind: "list", key: "categories", label: "What do you sell?", itemLabel: "Category", placeholder: "e.g. Sarees, LED TVs, sofas", max: 6 },
        { kind: "text", key: "brands", label: "Brands you sell (optional)", hint: "Only brands you actually sell, as you want them named. We never use brand logos." },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: retailOptions.goals, star: true },
      ],
    },
    {
      id: "terms",
      title: "Prices, EMI and services",
      questions: [
        { kind: "text", key: "priceRange", label: "Price range (optional)", hint: "Exactly as you want it shown." },
        { kind: "text", key: "emi", label: "EMI options (optional)", hint: "Terms exactly as your bank or finance partner states them." },
        { kind: "text", key: "exchange", label: "Exchange offer (optional)", hint: "Exactly as you want it worded." },
        { kind: "text", key: "warranty", label: "Warranty and after-sales (optional)", hint: "Exactly as provided by you or the manufacturer." },
        { kind: "text", key: "delivery", label: "Home delivery or demo (optional)", placeholder: "e.g. Delivery and installation within city limits" },
        { kind: "text", key: "timings", label: "Store timings", placeholder: "e.g. Daily, 10 am – 9 pm", half: true },
        { kind: "text", key: "branches", label: "Branches (optional)", placeholder: "e.g. Swaroop Nagar and Kidwai Nagar", half: true },
      ],
    },
    {
      id: "sales",
      title: "Sales, launches and festive dates",
      questions: [
        {
          kind: "group", key: "sales", label: "Sales in the next 60 days (optional)", itemLabel: "Sale", max: 4, empty: emptySale,
          hint: "An offer that quotes an earlier price (“was ₹X, now ₹Y”) is shown only if you confirm that price was real.",
          fields: [
            { key: "name", label: "Sale name", type: "text" },
            { key: "offer", label: "Offer, exactly as you want it shown", type: "text" },
            { key: "start", label: "Starts", type: "date" },
            { key: "end", label: "Ends", type: "date" },
            { key: "earlierPriceConfirmed", label: "If the offer quotes an earlier price, was that price real?", type: "choice", options: yesNo("Yes, it was the real price", "No / not applicable"), wide: true },
          ],
        },
        { kind: "events", key: "events", label: "Launches and other dates", hint: "Festive seasons change every year — add one only with a date you have verified.", options: retailOptions.events.filter((e) => e.id !== "sale"), defaultKind: "launch", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Is your team comfortable on camera?"),
        consent3("Written consent from customers to appear?", "Without it, no customer faces or testimonials appear in the plan."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("retail stores"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as RetailAnswers;
    return generateRetailPlan({ ...withDates(a), categories: a.categories.filter((c) => c.trim()), sales: a.sales.filter((s) => s.name.trim() && s.start), startDate });
  },
};
