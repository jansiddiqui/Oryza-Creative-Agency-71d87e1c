/** Oryza Plan Engine — B2B & manufacturers, on the shared core. */
import { generatePlan } from "./core";
import { b2bConfig, type B2bAnswers, type Certification, type NamedCustomer } from "./categories/b2b";
import type { Plan } from "./types";

export type { B2bAnswers, Certification, NamedCustomer };

export const generateB2bPlan = (a: B2bAnswers): Plan => generatePlan(b2bConfig, a);
