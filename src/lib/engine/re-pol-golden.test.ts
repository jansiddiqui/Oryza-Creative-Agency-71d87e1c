import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/re-pol-golden.json";
import { generatePoliticalPlan } from "./political-engine";
import { generateRealEstatePlan } from "./real-estate-engine";
import { politicalVariants, realEstateVariants } from "./re-pol-variants";

/** Real estate and political plans must not change as the shared core grows (fingerprints recorded from Phase 2C). */
const fingerprints = () => {
  const out: Record<string, string> = {};
  const h = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
  for (const [k, v] of Object.entries(realEstateVariants)) out[`real-estate:${k}`] = h(generateRealEstatePlan(v));
  for (const [k, v] of Object.entries(politicalVariants)) out[`political:${k}`] = h(generatePoliticalPlan(v));
  return out;
};

describe("real estate and political plans are unchanged", () => {
  const now = fingerprints();
  it("covers every recorded variant", () => expect(Object.keys(now).sort()).toEqual(Object.keys(golden).sort()));
  it.each(Object.keys(now))("%s", (k) => expect(now[k]).toBe((golden as Record<string, string>)[k]));
});
