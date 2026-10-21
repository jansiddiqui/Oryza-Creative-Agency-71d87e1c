import { generateRetailPlan } from "../engine/retail-engine";

/** A fictional electronics store — always labelled “sample”, never presented as client work. No brands, prices or offers are invented. */
export const sampleRetailPlan = generateRetailPlan({
  name: "Sample Electronics",
  city: "Kanpur",
  type: "electronics",
  goals: ["footfall", "trust"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "launch", date: "2026-11-06", label: "New TV range" }],
  categories: ["LED TVs", "Washing machines", "Refrigerators"],
  brands: "",
  priceRange: "",
  emi: "",
  exchange: "",
  warranty: "",
  delivery: "Delivery and installation within city limits (sample wording)",
  timings: "Daily, 10 am – 9 pm",
  branches: "",
  sales: [],
  onCamera: "some",
});
