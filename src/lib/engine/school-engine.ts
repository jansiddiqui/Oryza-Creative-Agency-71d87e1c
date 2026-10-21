/**
 * Oryza Plan Engine — schools. Thin wrapper over the shared core (./core) with the school config
 * (./categories/school). Kept so existing imports and tests keep working unchanged.
 */
import { buildTags as coreTags, generatePlan, packages, type PackageId } from "./core";
import { schoolConfig, type Board, type EventKind, type Goal, type Level, type SchoolAnswers } from "./categories/school";
import type { Plan } from "./types";

export { packages };
export type { Board, EventKind, Goal, Level, PackageId, SchoolAnswers };

export const buildTags = (a: SchoolAnswers): Set<string> => coreTags(schoolConfig, a);

export function generateSchoolPlan(a: SchoolAnswers): Plan {
  return generatePlan(schoolConfig, a);
}
