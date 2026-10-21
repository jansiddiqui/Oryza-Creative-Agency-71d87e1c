/** Oryza Plan Engine — Political leaders (non-partisan), on the shared core. */
import { generatePlan } from "./core";
import { politicalConfig, type PoliticalAnswers } from "./categories/political";
import type { Plan } from "./types";

export type { PoliticalAnswers };

export const generatePoliticalPlan = (a: PoliticalAnswers): Plan => generatePlan(politicalConfig, a);
