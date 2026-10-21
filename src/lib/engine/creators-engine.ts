/** Oryza Plan Engine — Creators & personal brands, on the shared core. */
import { generatePlan } from "./core";
import { creatorsConfig, type Collab, type CreatorAnswers, type Launch, type Series } from "./categories/creators";
import type { Plan } from "./types";

export type { Collab, CreatorAnswers, Launch, Series };

export const generateCreatorsPlan = (a: CreatorAnswers): Plan => generatePlan(creatorsConfig, a);
