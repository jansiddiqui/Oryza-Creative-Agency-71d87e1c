import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Bundle boundaries: a category's questions, playbook and engine load only when that category is chosen in the
 * planner, and an industry page imports only its own category's sample and playbook.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");
const staticImports = (src: string) => [...src.matchAll(/^import\s[^;]*?from\s+"([^"]+)"/gm)].map((m) => m[1]);

const ENGINES = ["school-engine", "medical-engine", "real-estate-engine", "political-engine", "restaurant-engine", "coaching-engine", "retail-engine", "wellness-engine", "style-engine"];
const PLAYBOOKS = ["school", "hospital", "doctor", "real-estate", "political", "restaurant", "coaching", "retail", "wellness", "style"];

describe("planner bundle boundaries", () => {
  it("the planner registry loads every category with a dynamic import only", () => {
    const src = read("src/components/planner/configs.ts");
    for (const i of staticImports(src)) expect(i, i).not.toMatch(/engine|playbooks|categories\//);
    expect(src.match(/import\("\.\/categories\//g)?.length).toBeGreaterThanOrEqual(10);
  });

  it("the plan builder and plan view never import an engine or a playbook statically", () => {
    for (const f of ["src/components/planner/PlanBuilder.tsx", "src/components/planner/PlanView.tsx", "src/components/planner/questions.ts"])
      for (const i of staticImports(read(f))) {
        expect(i, `${f}: ${i}`).not.toMatch(/-engine$|\/core$|playbooks|engine\/categories/);
      }
  });

  it("each planner category module imports only its own engine", () => {
    const own: Record<string, string[]> = {
      "schools.ts": ["school-engine"],
      "medical.ts": ["medical-engine"],
      "real-estate.ts": ["real-estate-engine"],
      "political-leaders.ts": ["political-engine"],
      "restaurants-cafes.ts": ["restaurant-engine"],
      "coaching-institutes.ts": ["coaching-engine"],
      "retail-showrooms.ts": ["retail-engine"],
      "gyms-salons.ts": ["wellness-engine"],
      "interiors-fashion-jewellery.ts": ["style-engine"],
    };
    const dir = "src/components/planner/categories";
    for (const f of readdirSync(join(root, dir))) {
      const used = staticImports(read(`${dir}/${f}`)).filter((i) => ENGINES.some((e) => i.endsWith(e))).map((i) => i.split("/").pop());
      expect(used, f).toEqual(own[f]);
    }
  });
});

describe("industry page boundaries", () => {
  const pages: Record<string, { samples: string; playbooks: string[] }> = {
    schools: { samples: "school", playbooks: ["school"] },
    "hospitals-clinics": { samples: "medical", playbooks: ["hospital"] },
    doctors: { samples: "medical", playbooks: ["doctor"] },
    "real-estate": { samples: "real-estate", playbooks: ["real-estate"] },
    "political-leaders": { samples: "political", playbooks: ["political"] },
    "restaurants-cafes": { samples: "restaurant", playbooks: ["restaurant"] },
    "coaching-institutes": { samples: "coaching", playbooks: ["coaching"] },
    "retail-showrooms": { samples: "retail", playbooks: ["retail"] },
    "gyms-salons": { samples: "wellness", playbooks: ["wellness"] },
    "interiors-fashion-jewellery": { samples: "style", playbooks: ["style"] },
  };
  it.each(Object.entries(pages))("/industries/%s imports only its own sample and playbook", (slug, own) => {
    const imports = staticImports(read(`src/app/(site)/industries/${slug}/page.tsx`));
    expect(imports.filter((i) => i.startsWith("@/lib/samples/"))).toEqual([`@/lib/samples/${own.samples}`]);
    expect(imports.filter((i) => i.startsWith("@/data/playbooks/")).map((i) => i.split("/").pop())).toEqual(own.playbooks);
    expect(imports.filter((i) => ENGINES.some((e) => i.endsWith(e)) || i.includes("components/planner"))).toEqual([]);
    for (const p of PLAYBOOKS.filter((x) => !own.playbooks.includes(x))) expect(imports, p).not.toContain(`@/data/playbooks/${p}`);
  });

  it("no industry page or the home page uses a client component that bundles an engine", () => {
    for (const f of ["src/components/IndustryDetail.tsx", "src/components/PlanBits.tsx", "src/components/infographics/PlanTimeline.tsx", "src/components/infographics/PillarMix.tsx"]) {
      const src = read(f);
      expect(src.startsWith('"use client"'), f).toBe(false);
      for (const i of staticImports(src)) expect(i, `${f}: ${i}`).not.toMatch(/-engine$|engine\/core$|playbooks/);
    }
  });
});
