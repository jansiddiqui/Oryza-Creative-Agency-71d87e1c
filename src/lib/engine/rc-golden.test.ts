import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/rc-golden.json";
import { generateCoachingPlan } from "./coaching-engine";
import { generateRestaurantPlan } from "./restaurant-engine";
import { coachingVariants, restaurantVariants } from "./rc-variants";

/** Restaurant and coaching plans must not change as the shared core grows (fingerprints recorded from Phase 2D). */
const fingerprints = () => {
  const out: Record<string, string> = {};
  const h = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
  for (const [k, v] of Object.entries(restaurantVariants)) out[`restaurant:${k}`] = h(generateRestaurantPlan(v));
  for (const [k, v] of Object.entries(coachingVariants)) out[`coaching:${k}`] = h(generateCoachingPlan(v));
  return out;
};

describe("restaurant and coaching plans are unchanged", () => {
  const now = fingerprints();
  it("covers every recorded variant", () => expect(Object.keys(now).sort()).toEqual(Object.keys(golden).sort()));
  it.each(Object.keys(now))("%s", (k) => expect(now[k]).toBe((golden as Record<string, string>)[k]));
});
