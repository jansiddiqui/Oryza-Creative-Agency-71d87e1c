/** Oryza Plan Engine — Coaching institutes, on the shared core. */
import { generatePlan } from "./core";
import { coachingConfig, type Batch, type CoachingAnswers, type VerifiedResult } from "./categories/coaching";
import type { Plan } from "./types";

export type { Batch, CoachingAnswers, VerifiedResult };

export const generateCoachingPlan = (a: CoachingAnswers): Plan => generatePlan(coachingConfig, a);
