/**
 * Retail & showrooms category config for the shared plan engine.
 * Offers appear only as provided; an offer quoting an earlier price ("was ₹X, now ₹Y") is used only when the
 * client confirms that earlier price was real. No price superlatives, no fake stock urgency, brand names only
 * from the client's own list.
 */
import { EARLIER_PRICE, RETAIL_BANNED_WORDING, retailFestivals, retailOptions, retailPlaybook } from "@/data/playbooks/retail";
import { addDays, fmtDate } from "../dates";
import { PLAN_DAYS, type BaseAnswers, type CategoryConfig, type TemplateList } from "../core";

export type RetailType = "clothing" | "electronics" | "furniture" | "mobile" | "general";
export type RetailGoal = "footfall" | "sales" | "launch" | "weekend" | "trust" | "reviews";

export interface Sale {
  name: string;
  /** ISO dates. */
  start: string;
  end: string;
  /** The offer exactly as the client wants it shown. */
  offer: string;
  /** For offers that quote an earlier price: the client confirms that price was real. */
  earlierPriceConfirmed: "yes" | "no";
}

export interface RetailAnswers extends BaseAnswers {
  type: RetailType;
  goals: RetailGoal[];
  /** Product categories sold, as typed. */
  categories: string[];
  /** Brands actually sold, as typed. */
  brands: string;
  priceRange: string;
  emi: string;
  exchange: string;
  warranty: string;
  /** Home delivery / demo terms as typed. */
  delivery: string;
  timings: string;
  branches: string;
  sales: Sale[];
  onCamera: "all" | "some" | "none";
}

const MIX: Record<RetailGoal, Record<string, number>> = {
  footfall: { products: 30, guides: 15, store: 25, offers: 10, people: 15, services: 5 },
  sales: { products: 30, guides: 15, store: 10, offers: 30, people: 10, services: 5 },
  launch: { products: 45, guides: 15, store: 15, offers: 10, people: 10, services: 5 },
  weekend: { products: 30, guides: 10, store: 30, offers: 15, people: 10, services: 5 },
  trust: { products: 20, guides: 35, store: 10, offers: 5, people: 15, services: 15 },
  reviews: { products: 20, guides: 20, store: 15, offers: 5, people: 30, services: 10 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => RETAIL_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";

/** The offer text the plan may use for a sale: publishable, and earlier prices only when confirmed. */
export const usableOffer = (s: Sale) => {
  const o = safe(s.offer);
  if (!o) return "";
  return EARLIER_PRICE.test(o) && s.earlierPriceConfirmed !== "yes" ? "" : o;
};
const salesFor = (a: RetailAnswers) => a.sales.filter((s) => safe(s.name) && clean(s.start));
const categories = (a: RetailAnswers) => a.categories.map(safe).filter(Boolean);

export const retailConfig: CategoryConfig<RetailAnswers> = {
  slug: "retail-showrooms",
  version: "retail-v1",
  playbook: retailPlaybook,
  defaultGoal: "footfall",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as RetailGoal] ?? MIX.footfall) };
    if (!has("has:offers") && !has("has:emi") && !has("has:exchange")) {
      // Nothing to offer: that share goes to products and guides.
      const moved = mix.offers - 5;
      mix.offers = 5;
      mix.products += Math.ceil(moved / 2);
      mix.guides += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a) => {
    const t = [`type:${a.type}`, `cam:${a.onCamera}`];
    if (categories(a).length) t.push("has:categories");
    if (safe(a.brands)) t.push("has:brands");
    if (safe(a.priceRange) && !EARLIER_PRICE.test(a.priceRange)) t.push("has:price");
    if (safe(a.emi)) t.push("has:emi");
    if (safe(a.exchange)) t.push("has:exchange");
    if (safe(a.warranty)) t.push("has:warranty");
    if (safe(a.delivery)) t.push("has:delivery");
    if (clean(a.timings)) t.push("has:timings");
    if (safe(a.branches)) t.push("has:branches");
    if (salesFor(a).some(usableOffer)) t.push("has:offers");
    if (a.events.length || a.sales.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our store",
    city: clean(a.city) || "your city",
    category: categories(a)[0] ?? "",
    categories_list: categories(a).join(" · "),
    brands_line: safe(a.brands),
    price_range: safe(a.priceRange),
    emi: safe(a.emi),
    exchange: safe(a.exchange),
    warranty: safe(a.warranty),
    delivery: safe(a.delivery),
    timings: clean(a.timings),
    branches: safe(a.branches),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : label(retailOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const out: Record<string, TemplateList> = {};
    for (const t of retailPlaybook.templates)
      if (!t.pinnedOnly && /\{category\}/.test(t.title + t.hook)) out[t.id] = { key: "category", list: categories(a), mode: "cycle" };
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: RETAIL_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "RP01", "New account: timings and location first");
    for (const s of salesFor(a)) {
      const start = inWindow(clean(s.start));
      const v = { event: safe(s.name), offer: usableOffer(s) };
      if (valid(start - 3)) pin("post", start - 3, "RP09", `3 days before ${v.event}`, v);
      if (!valid(start)) continue;
      if (v.offer) {
        pin("post", start, "RP08", `${v.event} starts`, v);
        pin("reel", Math.max(start, firstReelDay), "RR19", `${v.event} starts`, v);
      } else pin("post", start, "RP28", `${v.event} starts`, v);
    }
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "launch" || e.kind === "opening") {
        pin("reel", Math.max(e.day, firstReelDay), "RR20", `${e.name}: launch day`, v);
        pin("post", Math.max(1, e.day - 3), "RP09", `3 days before ${e.name}`, v);
      } else if (e.kind === "festive") {
        if (!pinned("post", e.day)) pin("post", e.day, "RP10", e.name, v);
      } else {
        pin("post", Math.max(1, e.day - 3), "RP09", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "RR21", `Day after ${e.name}`, v);
      }
    }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "RP10", o.name, { event: o.name });
    // Weekend pushes: a post on the first two free Saturdays.
    const saturdays = Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).filter((d) => new Date(addDays(a.startDate, d - 1) + "T00:00:00Z").getUTCDay() === 6);
    saturdays.filter((d) => !pinned("post", d)).slice(0, 2).forEach((d) => pin("post", d, "RP23", "Saturday: weekend push", { event: "Weekend" }));
  },

  shootStory: { id: "RS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, inWindow, valid, eventDays, story, days }) => {
    for (const s of salesFor(a)) {
      const start = inWindow(clean(s.start));
      const end = inWindow(clean(s.end));
      for (let k = 2; k >= 1; k--) story(start - k, "RS04", `Countdown: ${safe(s.name)}`, "Countdown sticker", `Before ${safe(s.name)}`);
      if (valid(end) && end > start) story(end, "RS04", `${safe(s.name)} ends today (as per your dates)`, "Timings and directions", `${safe(s.name)} ends`);
    }
    for (const e of eventDays) {
      story(e.day - 1, "RS04", `Tomorrow: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "RS03", `Live from ${e.name}`, "Stories through the day", e.name);
    }
    for (const d of days) if (new Date(d.date + "T00:00:00Z").getUTCDay() === 6) story(d.day, "RS10", `This weekend at ${safe(a.name) || "our store"}`, "Timings and what's new", "Weekend push");
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for local shoppers",
    whatsappStatus: (v) => `Status: new arrivals and timings at ${v.brand}`,
    whatsappDeliverable: "Stock-check and price-enquiry quick replies (prices only as you provide)",
    youtubeVideo: (v) => `Inside ${v.brand}: a full store tour and buying guide (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days — section by section, no price claims",
    websiteBlog: ({ vars }) => `How to choose ${vars.category || "the right product"} in ${vars.city}: a buyer's checklist`,
    linkedin: ({ vars }) => [
      { day: 9, title: `Bulk and corporate orders at ${vars.brand}` },
      { day: 23, title: `Careers at ${vars.brand}: join our store team` },
    ],
    pinterest: "5 product and buying-guide pins",
    x: "New arrivals and store update",
  },

  whatsappBeforeReminders: ({ a, add, inWindow, valid }) => {
    for (const s of salesFor(a)) {
      const start = inWindow(clean(s.start));
      if (valid(start - 1) && usableOffer(s))
        add(start - 1, { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: ${safe(s.name)} starts tomorrow — offer as you provided`, who: "Oryza", time: "6:00 pm", pinnedReason: `Day before ${safe(s.name)}` });
    }
  },

  gbpExtra: ({ add, has }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: has("has:timings") ? "Check opening hours, holiday hours, products and branches" : "Add opening hours, products and branches", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real customers at billing — honest reviews only, never paid, scripted or in exchange for a discount", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-PR", platform: "gbp", format: "gpost", title: "Products updated on the profile (names and prices only as you provide)", who: "Oryza", time: "12:00 pm" });
  },

  firstShootLabel: "Shoot day: store, new arrivals and team",

  clientPart: ({ a, shootCount, shoots }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours — prices, offers and terms are checked by you before publishing.",
    shootCount ? `Keep new stock on display and the store open for filming on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send product photos and short videos every week using our media checklist.",
    "Send sale dates and offers exactly as worded; for any “was ₹X, now ₹Y” offer, confirm the earlier price was real.",
    "Send the list of brands you sell; we never show brand logos.",
    a.consent === "yes" ? "Keep written consent for every customer who appears." : "Customers will not appear until written consent is in place.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Strategy, captions and designs for every item in the calendar.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; stock and price enquiries passed to your WhatsApp.",
    "A monthly report: reach, followers, calls, direction requests and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes = retailFestivals.filter((f) => f.months.includes(m)).map((f) => `${f.name} shopping (verify the date yearly before planning)`);
    const c = categories(a)[0];
    themes.push(c ? `New arrivals and buyer's guides: ${c}` : "New arrivals and buyer's guides");
    themes.push("Weekend pushes and staff picks");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: "Store", value: `${vars.brand}, ${vars.city}` },
    { label: "Type", value: label(retailOptions.types, a.type) },
    { label: "What you sell", value: vars.categories_list || "To be confirmed in the audit" },
    { label: "Main goal", value: label(retailOptions.goals, primary) },
    { label: "Timings", value: vars.timings || "To be confirmed in the audit" },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const out = [
      "Prices, MRP, offers, EMI, exchange and warranty terms appear only exactly as you provided them.",
      "Templates with “lowest price”, “best”, “No.1” or fake stock urgency (“only 2 left”, “while stocks last”) are never scheduled.",
      "Brand names come only from your list of brands you sell; our templates never use brand logos.",
      a.consent === "yes" ? "Customers appear only where written consent is on file." : "No customer faces or testimonials are scheduled — written consent is not in place.",
      "Reviews: we only invite real customers to leave honest Google reviews — never paid, scripted or in exchange for a discount.",
    ];
    const held = salesFor(a).filter((s) => safe(s.offer) && EARLIER_PRICE.test(safe(s.offer)) && s.earlierPriceConfirmed !== "yes");
    if (held.length) out.push(`${held.map((s) => safe(s.name)).join(", ")}: the offer quotes an earlier price you haven't confirmed, so it is not shown — the sale is announced without it.`);
    const dropped = [a.sales.some((s) => clean(s.offer) && breaks(s.offer)), a.categories.some((c) => clean(c) && breaks(c)), clean(a.brands) && breaks(a.brands), clean(a.priceRange) && breaks(a.priceRange), a.events.some((e) => e.label && breaks(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (“lowest”, “best” or urgency), so it was left out or replaced with a neutral name.");
    out.push(`Shopping festivals whose date changes each year (${retailFestivals.map((f) => f.name).join(", ")}) are never auto-scheduled — add one as an event once you've verified the date.`);
    return out;
  },
};
