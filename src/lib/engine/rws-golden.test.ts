import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/rws-golden.json";
import { generateRetailPlan } from "./retail-engine";
import { generateStylePlan } from "./style-engine";
import { generateWellnessPlan } from "./wellness-engine";
import { retailVariants, styleVariants, wellnessVariants } from "./rws-variants";

/** Retail, gyms/salons and interiors/fashion/jewellery plans must not change (fingerprints recorded from Phase 2E). */
const fingerprints = () => {
  const out: Record<string, string> = {};
  const h = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
  for (const [k, v] of Object.entries(retailVariants)) out[`retail:${k}`] = h(generateRetailPlan(v));
  for (const [k, v] of Object.entries(wellnessVariants)) out[`wellness:${k}`] = h(generateWellnessPlan(v));
  for (const [k, v] of Object.entries(styleVariants)) out[`style:${k}`] = h(generateStylePlan(v));
  return out;
};

describe("retail, wellness and style plans are unchanged", () => {
  const now = fingerprints();
  it("covers every recorded variant", () => expect(Object.keys(now).sort()).toEqual(Object.keys(golden).sort()));
  it.each(Object.keys(now))("%s", (k) => expect(now[k]).toBe((golden as Record<string, string>)[k]));
});
