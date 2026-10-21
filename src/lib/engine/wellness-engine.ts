/** Oryza Plan Engine — Gyms, salons & spas, on the shared core. */
import { generatePlan } from "./core";
import { wellnessConfig, type WellnessAnswers, type WellnessClass, type WellnessOffer } from "./categories/wellness";
import type { Plan } from "./types";

export type { WellnessAnswers, WellnessClass, WellnessOffer };

export const generateWellnessPlan = (a: WellnessAnswers): Plan => generatePlan(wellnessConfig, a);
