/** Oryza Plan Engine — Real estate (builders, developers, brokers), on the shared core. */
import { generatePlan } from "./core";
import { realEstateConfig, type Project, type RealEstateAnswers } from "./categories/real-estate";
import type { Plan } from "./types";

export type { Project, RealEstateAnswers };

export const generateRealEstatePlan = (a: RealEstateAnswers): Plan => generatePlan(realEstateConfig, a);
