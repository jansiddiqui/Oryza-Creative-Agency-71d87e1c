/** Oryza Plan Engine — Professionals (lawyers, CAs, CSs, consultants and coaches), on the shared core. */
import { generatePlan } from "./core";
import { professionalsConfig, modeOf, type ClientCase, type Deadline, type Profession, type ProfessionalAnswers } from "./categories/professionals";
import type { Plan } from "./types";

export type { ClientCase, Deadline, Profession, ProfessionalAnswers };
export { modeOf };

export const generateProfessionalsPlan = (a: ProfessionalAnswers): Plan => generatePlan(professionalsConfig, a);
