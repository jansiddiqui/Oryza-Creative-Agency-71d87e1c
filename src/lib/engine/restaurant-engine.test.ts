import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RESTAURANT_BANNED_WORDING, foodFestivals, restaurantPlaybook } from "@/data/playbooks/restaurant";
import { buildTags, packages } from "./core";
import { restaurantConfig } from "./categories/restaurant";
import { generateRestaurantPlan, type RestaurantAnswers } from "./restaurant-engine";
import type { Plan } from "./types";

const base: RestaurantAnswers = {
  name: "Test Rasoi", city: "Kanpur", type: "restaurant", goals: ["footfall", "orders"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"], optimize: [], startDate: "2026-10-05",
  events: [{ kind: "menu", date: "2026-10-14", label: "Winter menu launch" }, { kind: "festive", date: "2026-10-24", label: "Sharad Purnima" }],
  cuisine: "North Indian", food: "both",
  dishes: [{ name: "Dal makhani", mark: "veg", allergens: "Dairy" }, { name: "Butter chicken", mark: "nonveg", allergens: "Dairy, nuts" }, { name: "Egg curry", mark: "egg", allergens: "Egg" }],
  timings: "Daily, 11 am – 11 pm", service: ["dinein", "delivery", "whatsapp"], deliveryApps: "Zomato and Swiggy", whatsappOrder: "90000 00000",
  party: "yes", catering: "yes", fssai: "12345678901234", showFssai: "yes", price: "₹300–₹600 for two", special: "", allergenNotes: "yes", kitchen: "yes", onCamera: "some",
};
const gen = (over: Partial<RestaurantAnswers> = {}) => generateRestaurantPlan({ ...base, ...over });
const items = (p: Plan) => p.days.flatMap((d) => d.items.map((x) => ({ ...x, day: d.day, date: d.date })));
const ig = (p: Plan, f: string) => items(p).filter((x) => x.platform === "instagram" && x.format === f);
const on = (p: Plan, date: string) => p.days.find((d) => d.date === date)!.items;
const hash = (p: Plan) => createHash("sha256").update(JSON.stringify(p)).digest("hex");
const DISH_TEMPLATES = new Set(restaurantPlaybook.templates.filter((t) => /\{dish\}/.test(t.title + t.hook)).map((t) => t.id));

const variants: Partial<RestaurantAnswers>[] = [
  {},
  { pkg: "starter" },
  { pkg: "premium", consent: "yes" },
  { type: "cafe", food: "veg", startDate: "2026-09-28" },
  { type: "cloud", service: ["delivery"], party: "no" },
  { type: "sweets", goals: ["weekend"], startDate: "2027-05-25" },
  { type: "bakery", goals: ["launch"], startDate: "2027-07-01" },
  { type: "dhaba", kitchen: "no", onCamera: "none", shoot: "own" },
  { dishes: [], allergenNotes: "no", showFssai: "no" },
  { special: "Festive thali, ₹349", goals: ["parties"] },
  { goals: ["reviews"], platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] },
  { stage: "new", goals: [] },
];

describe("restaurant playbook", () => {
  const T = restaurantPlaybook.templates;
  it("has 50+ templates with reels, posts and stories", () => {
    expect(T.length).toBeGreaterThanOrEqual(50);
    for (const f of ["reel", "post", "story"]) expect(T.filter((t) => t.format === f).length).toBeGreaterThanOrEqual(10);
    expect(new Set(T.map((t) => t.id)).size).toBe(T.length);
  });
  it("never uses banned wording (alcohol, health claims, superlatives, urgency)", () => {
    for (const t of T) expect([t.title, t.hook, t.cta ?? ""].join(" | "), t.id).not.toMatch(RESTAURANT_BANNED_WORDING);
  });
  it("bans the wording the brief lists", () => {
    for (const bad of ["Bar nights every Friday", "Rooftop bar", "Bar & grill", "Chilled beer", "Immunity booster soup", "100% healthy", "No side effects", "Best biryani in town", "No.1 café", "Hurry, last chance", "Whisky pairing", "Cures cold"])
      expect(bad, bad).toMatch(RESTAURANT_BANNED_WORDING);
    for (const ok of ["Masala chai", "Fresh lime soda", "Mocktails", "Weekend thali", "Kulfi", "Chocolate bar", "Protein bars", "Barbecue platter"]) expect(ok, ok).not.toMatch(RESTAURANT_BANNED_WORDING);
  });
  it("puts the menu mark on every dish template and gates faces on consent", () => {
    for (const t of T.filter((x) => DISH_TEMPLATES.has(x.id))) expect(t.note, t.id).toContain("{dish_label}");
    for (const t of T.filter((x) => x.faces)) expect(t.requires, t.id).toContain("consent:yes");
  });
});

describe("restaurant plan engine", () => {
  it("is deterministic", () => {
    for (const v of variants) expect(hash(gen(v))).toBe(hash(gen(v)));
  });

  it("matches package volumes for every variant", () => {
    for (const v of variants) {
      const pk = v.pkg ?? "growth";
      const p = gen(v);
      expect(ig(p, "reel").length, JSON.stringify(v)).toBe(packages[pk].reels);
      expect(ig(p, "post").length, JSON.stringify(v)).toBe(packages[pk].posts);
    }
  });

  it("leaves no variable unfilled", () => {
    for (const v of variants) expect(JSON.stringify(gen(v)), JSON.stringify(v)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });

  it("only schedules templates whose tag rules pass", () => {
    for (const v of variants) {
      const tags = buildTags(restaurantConfig, { ...base, ...v });
      for (const x of items(gen(v)).filter((i) => i.platform === "instagram" && !i.pinnedReason)) {
        const t = restaurantPlaybook.templates.find((y) => y.id === x.templateId)!;
        expect(t.requires?.every((r) => tags.has(r)) ?? true, t.id).toBe(true);
        expect(t.blockedBy?.some((b) => tags.has(b)) ?? false, t.id).toBe(false);
      }
    }
  });

  it("never schedules alcohol, health claims or superlatives — and replaces client text that uses them", () => {
    const p = gen({ dishes: [{ name: "Best biryani", mark: "nonveg", allergens: "" }, { name: "Beer-battered fish", mark: "nonveg", allergens: "" }], special: "Immunity booster thali", cuisine: "Bar & grill", events: [{ kind: "music", date: "2026-10-17", label: "Bar night" }] });
    const text = JSON.stringify(p.days);
    expect(text).not.toMatch(/Best biryani|Beer|Immunity|Bar night|Bar & grill/);
    for (const x of items(p)) expect([x.title, x.hook ?? "", x.cta ?? ""].join(" | ")).not.toMatch(RESTAURANT_BANNED_WORDING);
    expect(p.compliance?.join(" ")).toMatch(/left out or replaced/);
  });

  it("copies menu marks exactly and keeps a pure-veg kitchen veg", () => {
    const p = gen({ pkg: "premium" });
    for (const x of items(p).filter((i) => i.platform === "instagram" && DISH_TEMPLATES.has(i.templateId))) {
      const d = base.dishes.find((y) => x.title.includes(y.name))!;
      expect(x.note).toContain({ veg: "Veg", nonveg: "Non-veg", egg: "Contains egg" }[d.mark]);
      expect(x.note).toContain(`Allergens as on your menu: ${d.allergens}`);
    }
    const veg = gen({ food: "veg", pkg: "premium" });
    expect(JSON.stringify(veg.days)).not.toMatch(/Butter chicken|Egg curry/);
    expect(veg.compliance?.join(" ")).toMatch(/pure-veg kitchen/);
  });

  it("features each signature dish at most twice a month, in different formats", () => {
    for (const v of variants) {
      const used = items(gen(v)).filter((x) => x.platform === "instagram" && DISH_TEMPLATES.has(x.templateId));
      for (const d of base.dishes) {
        const uses = used.filter((x) => x.title.includes(d.name));
        expect(uses.length).toBeLessThanOrEqual(2);
        expect(new Set(uses.map((x) => x.format)).size).toBe(uses.length);
      }
    }
  });

  it("shows the FSSAI line exactly as provided, only when asked", () => {
    const p = gen({ pkg: "premium" });
    const withNote = items(p).filter((x) => x.note?.includes("FSSAI"));
    expect(withNote.length).toBeGreaterThan(0);
    for (const x of withNote) expect(x.note).toContain("FSSAI Lic. No. 12345678901234");
    expect(JSON.stringify(gen({ showFssai: "no", pkg: "premium" }).days)).not.toContain("FSSAI");
  });

  it("never invents an offer or special", () => {
    const p = gen();
    expect(items(p).some((x) => ["FP08", "FR18"].includes(x.templateId))).toBe(false);
    expect(on(p, "2026-10-24").some((x) => x.templateId === "FP07")).toBe(true);
    const sp = gen({ special: "Festive thali, ₹349" });
    expect(on(sp, "2026-10-21").find((x) => x.templateId === "FP08")?.hook).toBe("Festive thali, ₹349");
    expect(on(sp, "2026-10-24").find((x) => x.templateId === "FR18")?.hook).toBe("Festive thali, ₹349");
  });

  it("shows customers only with consent", () => {
    const faceIds = new Set(restaurantPlaybook.templates.filter((t) => t.faces).map((t) => t.id));
    for (const v of variants.filter((x) => x.consent !== "yes")) expect(items(gen(v)).filter((x) => faceIds.has(x.templateId))).toEqual([]);
  });

  it("keeps a cloud kitchen off dine-in content", () => {
    const p = gen({ type: "cloud", service: ["dinein", "delivery"], party: "yes", pkg: "premium" });
    const dinein = new Set(restaurantPlaybook.templates.filter((t) => t.requires?.includes("has:dinein") || t.requires?.includes("has:party")).map((t) => t.id));
    expect(items(p).filter((x) => dinein.has(x.templateId))).toEqual([]);
  });
});

describe("restaurant pinned dates", () => {
  it("launch: reel and post on the day, countdown before", () => {
    const p = gen();
    expect(on(p, "2026-10-14").map((x) => x.templateId)).toEqual(expect.arrayContaining(["FR16", "FP09"]));
    expect(on(p, "2026-10-13").some((x) => x.title === "Countdown: Winter menu launch")).toBe(true);
  });

  it("weekend pushes on Fridays and weekend stories", () => {
    const p = gen({ events: [] });
    const fridayPosts = p.days.filter((d) => d.weekday === "Fri" && d.items.some((x) => x.templateId === "FP11"));
    expect(fridayPosts.length).toBe(2);
    for (const d of p.days.filter((x) => x.weekday === "Fri" || x.weekday === "Sat")) expect(d.items.some((x) => x.templateId === "FS10")).toBe(true);
  });

  it("fixed food days by business type", () => {
    expect(on(gen(), "2026-10-16").some((x) => x.title.includes("World Food Day"))).toBe(true);
    expect(on(gen({ type: "cafe", startDate: "2026-09-28", events: [] }), "2026-10-01").some((x) => x.title.includes("International Coffee Day"))).toBe(true);
    expect(JSON.stringify(gen({ type: "restaurant", startDate: "2026-09-28", events: [] }).days)).not.toContain("International Coffee Day");
  });

  it("never auto-schedules festivals whose date changes", () => {
    for (const start of ["2026-10-05", "2027-02-22", "2027-03-15", "2027-08-02"]) {
      const text = JSON.stringify(gen({ startDate: start, events: [] }).days);
      for (const f of foodFestivals) expect(text).not.toContain(f.name);
    }
  });

  it("builds a valid plan from minimal answers", () => {
    const p = gen({ name: "", city: "", goals: [], events: [], dishes: [], cuisine: "", timings: "", service: [], deliveryApps: "", whatsappOrder: "", fssai: "", price: "", platforms: [], optimize: [] });
    expect(p.days).toHaveLength(30);
    expect(ig(p, "reel").length).toBe(packages.growth.reels);
    expect(ig(p, "post").length).toBe(packages.growth.posts);
    expect(p.snapshot.every((s) => s.value)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/\{\w+\}|undefined|NaN/);
  });
});
