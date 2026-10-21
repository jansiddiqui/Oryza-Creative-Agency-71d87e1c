import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/school-golden.json";
import { generateSchoolPlan } from "./school-engine";
import { schoolVariants } from "./school-variants";

/**
 * Proves the shared-core refactor changed nothing for schools: each fingerprint was recorded from the
 * original school engine (before the refactor) for the same answers. Any difference in any plan fails.
 */
describe("school plans are identical before and after the shared-core refactor", () => {
  it("covers every recorded variant", () => {
    expect(Object.keys(schoolVariants).sort()).toEqual(Object.keys(golden).sort());
  });

  it.each(Object.keys(schoolVariants))("%s", (key) => {
    const json = JSON.stringify(generateSchoolPlan(schoolVariants[key]));
    expect(createHash("sha256").update(json).digest("hex")).toBe((golden as Record<string, string>)[key]);
  });
});
