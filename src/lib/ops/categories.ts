/**
 * Planner categories for the admin screens. The same list as components/planner/configs.ts, kept as a separate
 * module so the admin's browser code never shares a chunk with the public plan builder (a test keeps them equal).
 */
import type { PlannerConfig } from "@/components/planner/questions";

export const CATEGORY_LABELS: Record<string, string> = {
  schools: "Schools",
  "hospitals-clinics": "Hospitals & clinics",
  doctors: "Doctors",
  "real-estate": "Real estate",
  "political-leaders": "Political leaders",
  "restaurants-cafes": "Restaurants & cafés",
  "coaching-institutes": "Coaching institutes",
  "retail-showrooms": "Retail & showrooms",
  "gyms-salons": "Gyms, salons & spas",
  "interiors-fashion-jewellery": "Interiors, fashion & jewellery",
  "b2b-manufacturers": "B2B & manufacturers",
  professionals: "Professionals",
  creators: "Creators & personal brands",
};

/** Loads a category's planner (questions + engine) in the admin browser. */
export const opsPlannerLoaders: Record<string, () => Promise<PlannerConfig>> = {
  schools: () => import("@/components/planner/categories/schools").then((m) => m.config),
  "hospitals-clinics": () => import("@/components/planner/categories/medical").then((m) => m.hospital),
  doctors: () => import("@/components/planner/categories/medical").then((m) => m.doctor),
  "real-estate": () => import("@/components/planner/categories/real-estate").then((m) => m.config),
  "political-leaders": () => import("@/components/planner/categories/political-leaders").then((m) => m.config),
  "restaurants-cafes": () => import("@/components/planner/categories/restaurants-cafes").then((m) => m.config),
  "coaching-institutes": () => import("@/components/planner/categories/coaching-institutes").then((m) => m.config),
  "retail-showrooms": () => import("@/components/planner/categories/retail-showrooms").then((m) => m.config),
  "gyms-salons": () => import("@/components/planner/categories/gyms-salons").then((m) => m.config),
  "interiors-fashion-jewellery": () => import("@/components/planner/categories/interiors-fashion-jewellery").then((m) => m.config),
  "b2b-manufacturers": () => import("@/components/planner/categories/b2b-manufacturers").then((m) => m.config),
  professionals: () => import("@/components/planner/categories/professionals").then((m) => m.config),
  creators: () => import("@/components/planner/categories/creators").then((m) => m.config),
};
