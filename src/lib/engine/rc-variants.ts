import type { CoachingAnswers, VerifiedResult } from "./coaching-engine";
import type { RestaurantAnswers } from "./restaurant-engine";

/** Fixed answer sets whose plans are fingerprinted in __fixtures__/rc-golden.json (recorded from Phase 2D). */
const rest: RestaurantAnswers = {
  name: "Golden Rasoi", city: "Kanpur", type: "restaurant", goals: ["footfall", "orders"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-10-05",
  events: [{ kind: "menu", date: "2026-10-14", label: "Winter menu launch" }, { kind: "festive", date: "2026-10-24", label: "Sharad Purnima" }],
  cuisine: "North Indian", food: "both",
  dishes: [{ name: "Dal makhani", mark: "veg", allergens: "Dairy" }, { name: "Butter chicken", mark: "nonveg", allergens: "Dairy, nuts" }, { name: "Egg curry", mark: "egg", allergens: "Egg" }],
  timings: "Daily, 11 am – 11 pm", service: ["dinein", "delivery", "whatsapp"], deliveryApps: "Zomato and Swiggy", whatsappOrder: "90000 00000",
  party: "yes", catering: "yes", fssai: "12345678901234", showFssai: "yes", price: "₹300–₹600 for two", special: "", allergenNotes: "yes", kitchen: "yes", onCamera: "some",
};
const result = (over: Partial<VerifiedResult> = {}): VerifiedResult => ({
  student: "A. Student", exam: "JEE Main 2026", score: "98.2 percentile", course: "Two-year classroom programme", duration: "2 years", paid: "yes", consent: "yes", ...over,
});
const coach: CoachingAnswers = {
  name: "Golden Academy", city: "Kanpur", type: "jee", goals: ["admissions", "demo"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "seminar", date: "2026-11-08", label: "Parent orientation" }, { kind: "results", date: "2026-11-20", label: "" }],
  courses: ["JEE Main Physics", "JEE Main Maths"], age: "school", mode: "hybrid",
  batches: [{ name: "Target batch", course: "JEE Main", start: "2026-11-16", timing: "Mon–Sat 4–7 pm", mode: "offline" }],
  demo: "Every Saturday, 11 am", onCamera: "all", results: [result(), result({ student: "B. Student", score: "" })],
  fees: "₹60,000 per year (as provided)", scholarship: "", material: "yes", testSeries: "yes", exams: [{ name: "JEE Main Session 1", date: "2026-11-28" }],
};
const all = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] as RestaurantAnswers["platforms"];

export const restaurantVariants: Record<string, RestaurantAnswers> = {
  base: rest,
  premium: { ...rest, pkg: "premium", consent: "yes", special: "Festive thali, ₹349" },
  starter: { ...rest, pkg: "starter", kitchen: "no", onCamera: "none", shoot: "own" },
  cafe: { ...rest, type: "cafe", food: "veg", startDate: "2026-09-28", platforms: all },
  cloud: { ...rest, type: "cloud", service: ["delivery"], party: "no" },
  minimal: { ...rest, name: "", city: "", goals: [], events: [], dishes: [], cuisine: "", timings: "", service: [], deliveryApps: "", whatsappOrder: "", fssai: "", price: "", platforms: [], optimize: [] },
};
export const coachingVariants: Record<string, CoachingAnswers> = {
  base: coach,
  premium: { ...coach, pkg: "premium", consent: "yes" },
  noResults: { ...coach, results: [], pkg: "starter" },
  boards: { ...coach, type: "boards", goals: ["trust"], onCamera: "none", mode: "offline", startDate: "2026-08-31" },
  govt: { ...coach, type: "govt", age: "college", mode: "online", goals: ["results"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
  minimal: { ...coach, name: "", city: "", goals: [], events: [], courses: [], batches: [], demo: "", results: [], fees: "", exams: [], platforms: [], optimize: [] },
};
