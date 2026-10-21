/**
 * Which categories have an instant planner, and how to load each one. A category's questions, playbook and
 * engine are fetched only when a visitor chooses it, so no page ships other categories' code.
 */
import type { PlannerConfig } from "./questions";

export const plannerLoaders: Record<string, () => Promise<PlannerConfig>> = {
  schools: () => import("./categories/schools").then((m) => m.config),
  "hospitals-clinics": () => import("./categories/medical").then((m) => m.hospital),
  doctors: () => import("./categories/medical").then((m) => m.doctor),
  "real-estate": () => import("./categories/real-estate").then((m) => m.config),
  "political-leaders": () => import("./categories/political-leaders").then((m) => m.config),
  "restaurants-cafes": () => import("./categories/restaurants-cafes").then((m) => m.config),
  "coaching-institutes": () => import("./categories/coaching-institutes").then((m) => m.config),
};

/** Short labels for the categories with a live planner (for copy that lists them). */
export const plannerLabels: Record<string, string> = {
  schools: "Schools",
  "hospitals-clinics": "Hospitals & clinics",
  doctors: "Doctors",
  "real-estate": "Real estate",
  "political-leaders": "Political leaders",
  "restaurants-cafes": "Restaurants & cafés",
  "coaching-institutes": "Coaching institutes",
};
