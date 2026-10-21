/** Oryza Plan Engine — Interiors, fashion & jewellery, on the shared core. */
import { generatePlan } from "./core";
import { styleConfig, type Collection, type StyleAnswers, type StyleOffer, type StyleProject } from "./categories/style";
import type { Plan } from "./types";

export type { Collection, StyleAnswers, StyleOffer, StyleProject };

export const generateStylePlan = (a: StyleAnswers): Plan => generatePlan(styleConfig, a);
