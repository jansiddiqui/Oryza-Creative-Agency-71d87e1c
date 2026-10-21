/**
 * Restaurants & cafés category config (also cloud kitchens, sweet shops, bakeries, dhabas) for the shared plan engine.
 * Compliance: no alcohol, no health claims about food, offers and prices only as provided, menu marks exactly as
 * on the client's menu, customers only with consent, honest reviews only.
 */
import { foodDays, foodFestivals, restaurantOptions, restaurantPlaybook, RESTAURANT_BANNED_WORDING } from "@/data/playbooks/restaurant";
import { addDays, fmtDate } from "../dates";
import { PLAN_DAYS, type BaseAnswers, type CategoryConfig, type TemplateList } from "../core";

export type RestaurantType = "restaurant" | "cafe" | "cloud" | "sweets" | "bakery" | "dhaba";
export type RestaurantGoal = "footfall" | "orders" | "launch" | "weekend" | "parties" | "reviews";

export interface Dish {
  name: string;
  /** Veg / non-veg / egg exactly as on the client's menu. */
  mark: "veg" | "nonveg" | "egg";
  /** Allergens as the client wrote them (optional). */
  allergens: string;
}

export interface RestaurantAnswers extends BaseAnswers {
  type: RestaurantType;
  goals: RestaurantGoal[];
  cuisine: string;
  food: "veg" | "nonveg" | "both";
  dishes: Dish[];
  /** Opening days and hours as typed. */
  timings: string;
  service: ("dinein" | "takeaway" | "delivery" | "whatsapp")[];
  /** Delivery apps as the client named them. */
  deliveryApps: string;
  /** Own WhatsApp ordering number or link as provided. */
  whatsappOrder: string;
  party: "yes" | "no";
  catering: "yes" | "no";
  /** FSSAI licence number exactly as provided (optional), and whether to show it. */
  fssai: string;
  showFssai: "yes" | "no";
  /** Price range exactly as provided (optional). */
  price: string;
  /** Festive special exactly as provided (optional), used on festive events. */
  special: string;
  /** Show allergen notes on dish posts. */
  allergenNotes: "yes" | "no";
  /** Kitchen and staff can be filmed. */
  kitchen: "yes" | "no";
  onCamera: "all" | "some" | "none";
}

const MIX: Record<RestaurantGoal, Record<string, number>> = {
  footfall: { food: 35, kitchen: 10, people: 15, order: 25, occasions: 15 },
  orders: { food: 35, kitchen: 10, people: 10, order: 35, occasions: 10 },
  launch: { food: 45, kitchen: 15, people: 10, order: 15, occasions: 15 },
  weekend: { food: 35, kitchen: 5, people: 15, order: 20, occasions: 25 },
  parties: { food: 25, kitchen: 10, people: 15, order: 15, occasions: 35 },
  reviews: { food: 25, kitchen: 20, people: 30, order: 15, occasions: 10 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => RESTAURANT_BANNED_WORDING.test(s);
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");

/** Signature dishes the plan may feature: named, publishable, and (for a pure-veg kitchen) veg only. */
export const dishesFor = (a: Pick<RestaurantAnswers, "dishes" | "food">) =>
  a.dishes.filter((d) => safe(d.name) && (a.food !== "veg" || d.mark === "veg"));

const season = (m: number) => (m >= 3 && m <= 6 ? "summer" : m >= 7 && m <= 9 ? "monsoon" : "winter");

export const restaurantConfig: CategoryConfig<RestaurantAnswers> = {
  slug: "restaurants-cafes",
  version: "restaurant-v1",
  playbook: restaurantPlaybook,
  defaultGoal: "footfall",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as RestaurantGoal] ?? MIX.footfall) };
    if (!has("kitchen:yes")) {
      // No kitchen filming: the kitchen share moves to food designs and ordering information.
      const moved = mix.kitchen - 5;
      mix.kitchen = 5;
      mix.food += Math.ceil(moved / 2);
      mix.order += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a) => {
    const t = [`type:${a.type}`, `food:${a.food}`, `cam:${a.onCamera}`, `season:${season(Number(a.startDate.slice(5, 7)))}`];
    const svc = new Set(a.type === "cloud" ? a.service.filter((s) => s !== "dinein") : a.service);
    if (svc.has("dinein")) t.push("has:dinein");
    if (svc.has("takeaway")) t.push("has:takeaway");
    if (svc.has("delivery") && safe(a.deliveryApps)) t.push("has:delivery");
    if (svc.has("whatsapp") && safe(a.whatsappOrder)) t.push("has:whatsapp");
    if (a.party === "yes" && svc.has("dinein")) t.push("has:party");
    if (a.catering === "yes") t.push("has:catering");
    if (safe(a.fssai) && a.showFssai === "yes") t.push("has:fssai");
    if (safe(a.price)) t.push("has:price");
    if (dishesFor(a).length) t.push("has:dishes");
    if (clean(a.timings)) t.push("has:timings");
    if (a.allergenNotes === "yes") t.push("has:allergens");
    if (a.kitchen === "yes" && a.shoot !== "own") t.push("kitchen:yes");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our kitchen",
    city: clean(a.city) || "your city",
    cuisine: safe(a.cuisine) || "full",
    timings: clean(a.timings),
    order_line: safe(a.whatsappOrder) ? `Order on WhatsApp: ${safe(a.whatsappOrder)}` : "",
    delivery_line: safe(a.deliveryApps) ? `Order on ${safe(a.deliveryApps)}` : "",
    price: safe(a.price),
    fssai_line: safe(a.fssai) && a.showFssai === "yes" ? `Creative and caption carry: FSSAI Lic. No. ${safe(a.fssai)}` : "",
    special: safe(a.special),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : label(restaurantOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const dishes = dishesFor(a).map((d) => ({
      dish: safe(d.name),
      dish_label: label(restaurantOptions.marks, d.mark),
      allergens: a.allergenNotes === "yes" && safe(d.allergens) ? ` Allergens as on your menu: ${safe(d.allergens)}.` : "",
    }));
    const out: Record<string, TemplateList> = {};
    // Each signature dish is featured at most twice a month, in different formats.
    for (const t of restaurantPlaybook.templates)
      if (!t.pinnedOnly && /\{dish\}/.test(t.title + t.hook)) out[t.id] = { key: "dish", list: dishes, mode: "cycle", shared: { pool: "dish", maxUses: 2 } };
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: RESTAURANT_BANNED_WORDING,

  pins: ({ a, has, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "FP01", "New account: timings and location first");
    for (const e of eventDays) {
      const v = { event: e.name, special: safe(a.special) };
      if (e.kind === "launch" || e.kind === "menu") {
        pin("reel", Math.max(e.day, firstReelDay), "FR16", `${e.name}: launch day`, v);
        pin("post", e.day, "FP09", `${e.name}: launch day`, v);
      } else if (e.kind === "festive") {
        // A festive special only when the client provided one; otherwise a greeting.
        if (safe(a.special)) {
          pin("post", Math.max(1, e.day - 3), "FP08", `3 days before ${e.name}: pre-orders`, v);
          pin("reel", Math.max(e.day, firstReelDay), "FR18", e.name, v);
        } else pin("post", e.day, "FP07", e.name, v);
      } else {
        pin("post", Math.max(1, e.day - 3), "FP10", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "FR17", `Day after ${e.name}`, v);
      }
    }
    // Fixed-date food days that suit the business, then national days and fixed festivals (greeting only).
    const year = Number(a.startDate.slice(0, 4));
    for (const f of foodDays.filter((x) => x.types.includes(a.type)))
      for (const y of [year, year + 1]) {
        const d = inWindow(`${y}-${f.md}`);
        if (valid(d) && !pinned("post", d)) pin("post", d, "FP07", f.name, { event: f.name });
      }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "FP07", o.name, { event: o.name });
    // Weekend pushes: a post on the first two free Fridays (when the business serves walk-ins or orders).
    if (has("has:dinein") || has("has:delivery") || has("has:whatsapp") || has("has:takeaway")) {
      const fridays = Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).filter((d) => new Date(addDays(a.startDate, d - 1) + "T00:00:00Z").getUTCDay() === 5);
      fridays.filter((d) => !pinned("post", d)).slice(0, 2).forEach((d) => pin("post", d, "FP11", "Friday: weekend push", { event: "Weekend" }));
    }
  },

  shootStory: { id: "FS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, eventDays, story, days }) => {
    for (const e of eventDays) {
      for (let k = 2; k >= 1; k--) story(e.day - k, "FS04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "FS03", `Live from ${e.name}`, "6–8 stories through the day", e.name);
    }
    // Weekend story every Friday and Saturday.
    for (const d of days) {
      const wd = new Date(d.date + "T00:00:00Z").getUTCDay();
      if (wd === 5 || wd === 6) story(d.day, "FS10", "This weekend at " + (safe(a.name) || "our kitchen"), "Timings and what to order", "Weekend push");
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for local food lovers",
    whatsappStatus: (v) => `Status: today's specials and timings at ${v.brand}`,
    whatsappDeliverable: "Order and booking quick replies with menu, timings and location",
    youtubeVideo: (v) => `Inside the kitchen at ${v.brand} (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days — dishes, prep and the team",
    websiteBlog: ({ vars }) => `Where to eat in ${vars.city}: our menu, timings and how to order`,
    linkedin: ({ vars }) => [
      { day: 9, title: `Catering and corporate orders from ${vars.brand}` },
      { day: 23, title: `Behind the kitchen at ${vars.brand}: our team` },
    ],
    pinterest: "5 dish and recipe-idea pins",
    x: "Today's special and timings",
  },

  whatsappBeforeReminders: ({ a, eventDays, add }) => {
    for (const e of eventDays.filter((x) => x.kind === "festive" && safe(a.special)))
      add(Math.max(1, e.day - 3), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: ${e.name} special — pre-orders (as you provided)`, who: "Oryza", time: "11:00 am", pinnedReason: `3 days before ${e.name}` });
  },

  gbpExtra: ({ add, has }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: has("has:timings") ? "Check opening hours, holiday hours, menu link and order links" : "Add opening hours, menu link and order links", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real customers (table card / bill / delivery note) — honest reviews only, never paid, scripted or in exchange for a discount", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-M", platform: "gbp", format: "gpost", title: "Menu photos and dishes updated (names and marks exactly as on your menu)", who: "Oryza", time: "12:00 pm" });
  },

  firstShootLabel: "Shoot day: signature dishes, kitchen and team",

  clientPart: ({ a, shootCount, shoots, has }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours — prices, offers and menu names are checked by you before publishing.",
    shootCount
      ? `Keep the signature dishes ready to cook${has("kitchen:yes") ? " and the kitchen open for filming" : ""} on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).`
      : "Send photos and short videos of dishes every week using our media checklist.",
    "Send your current menu with veg / non-veg / egg marks; we copy them exactly.",
    a.consent === "yes" ? "Keep written consent for every customer who appears." : "Customers will not appear until written consent is in place.",
    "Tell us about specials, offers and price changes before they go live — we never invent them.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Strategy, captions and designs for every item in the calendar.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned food and kitchen shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; orders and bookings passed to your WhatsApp.",
    "A monthly report: reach, followers, calls, direction requests, orders from social and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes: string[] = [];
    for (const f of foodDays.filter((x) => x.types.includes(a.type) && Number(x.md.slice(0, 2)) === m)) themes.push(f.name);
    for (const f of foodFestivals.filter((x) => x.months.includes(m))) themes.push(`${f.name} specials (verify the date yearly before planning)`);
    themes.push(season(m) === "summer" ? "Summer coolers and light plates" : season(m) === "monsoon" ? "Monsoon cravings" : "Winter warmers");
    themes.push("Weekend pushes and dish of the week");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: label(restaurantOptions.types, a.type) || "Business", value: `${vars.brand}, ${vars.city}` },
    { label: "Food", value: [safe(a.cuisine), label(restaurantOptions.food, a.food)].filter(Boolean).join(" · ") },
    { label: "Main goal", value: label(restaurantOptions.goals, primary) },
    { label: "Service", value: a.service.map((s) => label(restaurantOptions.service, s)).join(", ") || "To be confirmed" },
    { label: "Timings", value: vars.timings || "To be confirmed in the audit" },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a, has }) => {
    const out = [
      "No alcohol is promoted — templates with liquor names, brands, bottles, “bar nights” or surrogate wording are never scheduled.",
      "No health or medical claims about food (“cures”, “immunity booster”, “100% healthy”, “no side effects”), no “best” or “No.1” claims and no fake urgency.",
      "Dish names and veg / non-veg / egg marks are copied exactly from your menu.",
      "Offers, prices and specials appear only as you provided them — nothing is invented.",
      a.consent === "yes" ? "Customers appear only where written consent is on file." : "No customer faces or testimonials are scheduled — written consent is not in place.",
      "Reviews: we only invite real customers to leave honest Google reviews — never paid, scripted, fake or in exchange for a discount.",
    ];
    out.push(has("has:fssai") ? `The FSSAI licence line appears exactly as provided: FSSAI Lic. No. ${safe(a.fssai)}.` : "The FSSAI licence number is not shown (not provided, or you chose not to show it).");
    if (a.food === "veg" && a.dishes.some((d) => d.mark !== "veg" && clean(d.name))) out.push("You run a pure-veg kitchen, so dishes marked non-veg or egg are left out.");
    if (a.allergenNotes === "yes") out.push("Dish posts carry the allergen line exactly as on your menu.");
    const dropped = [a.dishes.some((d) => clean(d.name) && breaks(d.name)), clean(a.special) && breaks(a.special), clean(a.price) && breaks(a.price), a.events.some((e) => e.label && breaks(e.label)), clean(a.cuisine) && breaks(a.cuisine)].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (alcohol, health claims, “best” or urgency), so it was left out or replaced with a neutral name.");
    out.push(`Festivals whose date changes each year (${foodFestivals.map((f) => f.name).join(", ")}) are never auto-scheduled — add one as an event once you've verified the date.`);
    return out;
  },
};
