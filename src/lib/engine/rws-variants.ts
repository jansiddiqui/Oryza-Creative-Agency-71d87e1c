import type { RetailAnswers, Sale } from "./retail-engine";
import type { StyleAnswers } from "./style-engine";
import type { WellnessAnswers } from "./wellness-engine";

/** Fixed answer sets whose plans are fingerprinted in __fixtures__/rws-golden.json (recorded from Phase 2E). */
const sale = (over: Partial<Sale> = {}): Sale => ({ name: "Winter sale", start: "2026-11-20", end: "2026-11-25", offer: "Up to 20% off on select models", earlierPriceConfirmed: "no", ...over });
const retail: RetailAnswers = {
  name: "Golden Store", city: "Kanpur", type: "electronics", goals: ["sales", "footfall"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "launch", date: "2026-11-12", label: "New TV range" }],
  categories: ["LED TVs", "Washing machines", "Refrigerators"], brands: "Brand A, Brand B", priceRange: "₹8,000 – ₹1,50,000", emi: "No-cost EMI on select cards",
  exchange: "Exchange your old TV", warranty: "Manufacturer warranty", delivery: "Delivery and installation within city limits",
  timings: "Daily 10 am – 9 pm", branches: "Two branches", sales: [sale(), sale({ name: "Clearance", start: "2026-11-27", end: "", offer: "Was ₹40,000, now ₹32,000" })], onCamera: "some",
};
const wellness: WellnessAnswers = {
  name: "Golden Fitness", city: "Kanpur", type: "gym", goals: ["members"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-12-21",
  events: [{ kind: "launch", date: "2027-01-05", label: "New strength zone" }],
  services: ["Strength training", "Yoga", "Zumba"], timings: "5 am – 10 pm", packages: "Monthly ₹1,500",
  classes: [{ name: "Yoga", days: "Mon/Wed/Fri", time: "7 am" }], womenSlots: "11 am – 1 pm daily", certifications: "Certified trainers (as provided)",
  offers: [{ name: "New Year offer", start: "2027-01-02", end: "2027-01-10", offer: "Joining fee waived" }], onCamera: "all",
};
const style: StyleAnswers = {
  name: "Golden Jewellers", city: "Kanpur", type: "jeweller", goals: ["launch", "bridal"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "pinterest"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "festive", date: "2026-11-06", label: "Dhanteras" }],
  specialities: ["Bridal sets", "Gold bangles"], collections: [{ name: "Winter bridal collection", launch: "2026-11-14" }], projects: [],
  hallmark: "BIS hallmarked with HUID", fabric: "", prices: "request", priceText: "", making: "", rateStories: "yes",
  offers: [{ name: "Wedding offer", start: "2026-11-20", offer: "Was ₹50,000, now ₹45,000", earlierPriceConfirmed: "no" }], workshop: "yes", onCamera: "some",
};
const all = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] as RetailAnswers["platforms"];

export const retailVariants: Record<string, RetailAnswers> = {
  base: retail,
  premium: { ...retail, pkg: "premium", consent: "yes" },
  clothing: { ...retail, type: "clothing", categories: ["Sarees"], brands: "", sales: [], platforms: all },
  minimal: { ...retail, name: "", city: "", goals: [], events: [], categories: [], brands: "", priceRange: "", emi: "", exchange: "", warranty: "", delivery: "", timings: "", branches: "", sales: [], platforms: [], optimize: [] },
};
export const wellnessVariants: Record<string, WellnessAnswers> = {
  base: wellness,
  premium: { ...wellness, pkg: "premium", consent: "yes" },
  spa: { ...wellness, type: "spa", services: ["Swedish massage"], classes: [], startDate: "2027-06-07" },
  minimal: { ...wellness, name: "", city: "", goals: [], events: [], services: [], timings: "", packages: "", classes: [], womenSlots: "", certifications: "", offers: [], platforms: [], optimize: [] },
};
export const styleVariants: Record<string, StyleAnswers> = {
  base: style,
  premium: { ...style, pkg: "premium", consent: "yes", prices: "show", priceText: "From ₹2,40,000 (as on 2 Nov, 10 am)" },
  interior: { ...style, type: "interior", specialities: ["Modular kitchens"], collections: [], hallmark: "", rateStories: "no", projects: [{ name: "Golden Residence", kind: "3 BHK", timeline: "10 weeks", budget: "₹12 lakh", showBudget: "yes", consent: "yes" }] },
  minimal: { ...style, name: "", city: "", goals: [], events: [], specialities: [], collections: [], hallmark: "", offers: [], platforms: [], optimize: [] },
};
