import { generateSchoolPlan } from "./engine/school-engine";

/**
 * A fictional example school used to show what the planner produces.
 * Always labelled “sample” wherever it appears — it is not client work.
 */
export const samplePlan = generateSchoolPlan({
  name: "Sample Public School",
  city: "Kanpur",
  board: "cbse",
  level: "12",
  goals: ["admissions"],
  admissionOpen: "2026-11-02",
  admissionClose: "2026-11-20",
  events: [{ kind: "sports", date: "2026-11-05" }],
  usps: ["sports", "safety"],
  achievements: ["State-level chess winner", "Inter-school science fair winner"],
  stage: "revive",
  consent: "some",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "website"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
});
