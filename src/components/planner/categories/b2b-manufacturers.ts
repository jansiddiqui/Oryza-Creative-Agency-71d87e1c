/** Planner questions for B2B & manufacturers. */
import { b2bOptions } from "@/data/playbooks/b2b";
import { generateB2bPlan, type B2bAnswers } from "@/lib/engine/b2b-engine";
import { cameraQ, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyCert = { name: "", number: "", validTill: "" };
const emptyCustomer = { name: "", permission: "" };

export const config: PlannerConfig = {
  slug: "b2b-manufacturers",
  label: "B2B & manufacturers",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "manufacturer", goals: ["enquiries"], products: ["", ""], industries: ["", ""], certifications: [], capacity: "", moq: "", leadTime: "",
    markets: "", years: "", sustainability: "", customers: [], factory: "yes", staffConsent: "no", onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("b2b-manufacturers"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your business",
      questions: [
        { kind: "text", key: "name", label: "Company name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "Business type", name: "Business type", options: b2bOptions.types },
        { kind: "list", key: "products", label: "Products or services", itemLabel: "Product", placeholder: "e.g. Leather safety gloves", max: 6 },
        { kind: "list", key: "industries", label: "Industries you serve", itemLabel: "Industry", placeholder: "e.g. Construction", max: 6 },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: b2bOptions.goals, star: true },
      ],
    },
    {
      id: "facts",
      title: "Certifications and figures",
      questions: [
        {
          kind: "group", key: "certifications", label: "Certifications (optional)", itemLabel: "Certification", max: 6, empty: emptyCert,
          hint: "Shown exactly as you type them — name, number and validity.",
          fields: [
            { key: "name", label: "Certification", type: "text", placeholder: "e.g. ISO 9001:2015" },
            { key: "number", label: "Certificate number", type: "text" },
            { key: "validTill", label: "Valid till", type: "text", placeholder: "e.g. March 2028" },
          ],
        },
        { kind: "text", key: "capacity", label: "Capacity (optional)", hint: "Exactly as you want it shown." },
        { kind: "text", key: "moq", label: "Minimum order quantity (optional)", half: true },
        { kind: "text", key: "leadTime", label: "Lead time (optional)", half: true },
        { kind: "text", key: "markets", label: "Export markets (optional)", hint: "Only countries you actually export to." },
        { kind: "text", key: "years", label: "Years in business (optional)", placeholder: "e.g. 25 years" },
        { kind: "text", key: "sustainability", label: "Sustainability practices (optional)", hint: "Only practices you actually follow." },
      ],
    },
    {
      id: "customers",
      title: "Customers, trade fairs and launches",
      questions: [
        {
          kind: "group", key: "customers", label: "Customers you may name (optional)", itemLabel: "Customer", max: 6, empty: emptyCustomer,
          hint: "Named only with their written permission. Without it they are left out entirely — we don't describe them either.",
          fields: [
            { key: "name", label: "Customer", type: "text" },
            { key: "permission", label: "Written permission to name them?", type: "choice", options: [{ id: "", label: "Choose" }, ...yesNo("Yes", "No")] },
          ],
        },
        { kind: "events", key: "events", label: "Trade fairs, launches and dealer greetings", hint: "Festival greetings only on dates you have verified.", options: b2bOptions.events, defaultKind: "fair", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        { kind: "choice", key: "factory", label: "Can we film the factory or work floor?", name: "Factory filming", options: yesNo("Yes", "No") },
        { kind: "choice", key: "staffConsent", label: "Do staff consent to appear on camera?", name: "Staff consent", options: yesNo("Yes, written", "No") },
        cameraQ("Is the founder comfortable on camera?"),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("B2B businesses"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as B2bAnswers;
    return generateB2bPlan({
      ...withDates(a),
      products: a.products.filter((p) => p.trim()),
      industries: a.industries.filter((p) => p.trim()),
      certifications: a.certifications.filter((c) => c.name.trim()),
      customers: a.customers.filter((c) => c.name.trim()),
      startDate,
    });
  },
};
