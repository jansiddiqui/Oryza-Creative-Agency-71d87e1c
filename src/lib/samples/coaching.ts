import { generateCoachingPlan } from "../engine/coaching-engine";

/**
 * A fictional coaching institute — always labelled “sample”, never presented as client work. It has no
 * results: the sample never shows a student, a score or a rank.
 */
export const sampleCoachingPlan = generateCoachingPlan({
  name: "Sample Academy",
  city: "Kanpur",
  type: "jee",
  goals: ["admissions", "demo"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "seminar", date: "2026-11-01", label: "Parent orientation" }],
  courses: ["JEE Main Physics", "JEE Main Maths"],
  age: "school",
  mode: "offline",
  batches: [{ name: "New JEE batch", course: "JEE Main", start: "2026-11-09", timing: "Mon–Sat, 4–7 pm", mode: "offline" }],
  demo: "Every Saturday, 11 am",
  onCamera: "some",
  results: [],
  fees: "",
  scholarship: "",
  material: "yes",
  testSeries: "yes",
  exams: [],
});
