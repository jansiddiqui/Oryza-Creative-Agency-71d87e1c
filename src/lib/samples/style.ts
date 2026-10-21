import { generateStylePlan } from "../engine/style-engine";

/**
 * A fictional jeweller — always labelled “sample”, never presented as client work. It shows no hallmark or
 * purity details, prices, rates or offers (none were provided).
 */
export const sampleStylePlan = generateStylePlan({
  name: "Sample Jewellers",
  city: "Kanpur",
  type: "jeweller",
  goals: ["launch", "bridal"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "pinterest"],
  optimize: ["instagram", "pinterest"],
  startDate: "2026-10-26",
  events: [],
  specialities: ["Bridal sets", "Gold bangles", "Everyday earrings"],
  collections: [{ name: "Winter bridal collection", launch: "2026-11-07" }],
  projects: [],
  hallmark: "",
  fabric: "",
  prices: "request",
  priceText: "",
  making: "",
  rateStories: "no",
  offers: [],
  workshop: "yes",
  onCamera: "some",
});
