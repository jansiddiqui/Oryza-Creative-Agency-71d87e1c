/** Oryza Plan Engine — Retail & showrooms, on the shared core. */
import { generatePlan } from "./core";
import { retailConfig, type RetailAnswers, type Sale } from "./categories/retail";
import type { Plan } from "./types";

export type { RetailAnswers, Sale };

export const generateRetailPlan = (a: RetailAnswers): Plan => generatePlan(retailConfig, a);
