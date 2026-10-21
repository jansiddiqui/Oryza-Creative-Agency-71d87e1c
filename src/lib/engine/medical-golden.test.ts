import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/medical-golden.json";
import { generateDoctorPlan, generateHospitalPlan } from "./medical-engine";
import { doctorVariants, hospitalVariants } from "./medical-variants";

/** Hospital and doctor plans must not change when the shared core grows for new categories. */
const fingerprints = () => {
  const out: Record<string, string> = {};
  const h = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
  for (const [k, v] of Object.entries(hospitalVariants)) out[`hospital:${k}`] = h(generateHospitalPlan(v));
  for (const [k, v] of Object.entries(doctorVariants)) out[`doctor:${k}`] = h(generateDoctorPlan(v));
  return out;
};

describe("hospital and doctor plans are unchanged", () => {
  const now = fingerprints();
  it("covers every recorded variant", () => expect(Object.keys(now).sort()).toEqual(Object.keys(golden).sort()));
  it.each(Object.keys(now))("%s", (k) => expect(now[k]).toBe((golden as Record<string, string>)[k]));
});
