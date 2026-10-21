/**
 * Gyms, salons & spas category config for the shared plan engine.
 * No guaranteed transformations, supplements or medical claims; before/after only with written consent and a
 * "Results vary" note; spa content strictly family-safe; certifications, prices and offers only as provided.
 */
import { WELLNESS_BANNED_WORDING, wellnessOptions, wellnessPlaybook } from "@/data/playbooks/wellness";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig, TemplateList } from "../core";

export type WellnessType = "gym" | "salon" | "spa" | "unisex" | "bridal";
export type WellnessGoal = "members" | "bookings" | "trust" | "bridal" | "footfall" | "reviews";

export interface WellnessOffer {
  name: string;
  /** ISO dates. */
  start: string;
  end: string;
  /** The offer exactly as the client wants it shown. */
  offer: string;
}

export interface WellnessClass {
  name: string;
  days: string;
  time: string;
}

export interface WellnessAnswers extends BaseAnswers {
  type: WellnessType;
  goals: WellnessGoal[];
  services: string[];
  timings: string;
  /** Memberships / packages exactly as provided (optional). */
  packages: string;
  classes: WellnessClass[];
  /** Women-only slots as typed (optional). */
  womenSlots: string;
  /** Certifications exactly as provided (optional). */
  certifications: string;
  offers: WellnessOffer[];
  onCamera: "all" | "some" | "none";
}

const MIX: Record<WellnessGoal, Record<string, number>> = {
  members: { tips: 25, services: 30, team: 15, hygiene: 10, results: 10, space: 5, occasions: 5 },
  bookings: { tips: 20, services: 35, team: 15, hygiene: 10, results: 10, space: 5, occasions: 5 },
  trust: { tips: 20, services: 15, team: 25, hygiene: 20, results: 10, space: 5, occasions: 5 },
  bridal: { tips: 15, services: 25, team: 15, hygiene: 5, results: 15, space: 5, occasions: 20 },
  footfall: { tips: 20, services: 25, team: 10, hygiene: 10, results: 5, space: 25, occasions: 5 },
  reviews: { tips: 20, services: 20, team: 15, hygiene: 15, results: 20, space: 5, occasions: 5 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => WELLNESS_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
const services = (a: WellnessAnswers) => a.services.map(safe).filter(Boolean);
const classes = (a: WellnessAnswers) => a.classes.filter((c) => safe(c.name) && clean(c.days));
const offersFor = (a: WellnessAnswers) => a.offers.filter((o) => safe(o.name) && clean(o.start));
const season = (m: number) => (m >= 3 && m <= 6 ? "summer" : m >= 7 && m <= 9 ? "monsoon" : "winter");
const bridal = (a: WellnessAnswers) => a.type === "bridal" || services(a).some((s) => /bridal|wedding/i.test(s));

export const wellnessConfig: CategoryConfig<WellnessAnswers> = {
  slug: "gyms-salons",
  version: "wellness-v1",
  playbook: wellnessPlaybook,
  defaultGoal: "bookings",
  pillarMix: (primary) => ({ ...(MIX[primary as WellnessGoal] ?? MIX.bookings) }),

  tags: (a) => {
    const t = [`type:${a.type}`, `cam:${a.onCamera}`, `season:${season(Number(a.startDate.slice(5, 7)))}`];
    if (services(a).length) t.push("has:services");
    if (clean(a.timings)) t.push("has:timings");
    if (safe(a.packages)) t.push("has:packages");
    if (classes(a).length) t.push("has:classes");
    if (safe(a.womenSlots)) t.push("has:women");
    if (safe(a.certifications)) t.push("has:certs");
    if (bridal(a)) t.push("has:bridal");
    if (a.events.length || a.offers.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our studio",
    city: clean(a.city) || "your city",
    service: services(a)[0] ?? "",
    services_list: services(a).join(" · "),
    timings: clean(a.timings),
    packages: safe(a.packages),
    class_line: classes(a).map((c) => `${safe(c.name)} — ${clean(c.days)}${clean(c.time) ? `, ${clean(c.time)}` : ""}`).join(" · "),
    women_slots: safe(a.womenSlots),
    certs: safe(a.certifications),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : label(wellnessOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const out: Record<string, TemplateList> = {};
    for (const t of wellnessPlaybook.templates)
      if (!t.pinnedOnly && /\{service\}/.test(t.title + t.hook)) out[t.id] = { key: "service", list: services(a), mode: "cycle" };
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: WELLNESS_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "WP01", "New account: timings and location first");
    for (const o of offersFor(a)) {
      const d = inWindow(clean(o.start));
      if (valid(d) && safe(o.offer)) pin("post", d, "WP10", `${safe(o.name)} starts`, { event: safe(o.name), offer: safe(o.offer) });
    }
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "launch") {
        pin("reel", Math.max(e.day, firstReelDay), "WR17", `${e.name}: launch day`, v);
        pin("post", e.day, "WP11", `${e.name}: launch day`, v);
      } else if (e.kind === "wedding") {
        if (!pinned("post", e.day)) pin("post", e.day, bridal(a) ? "WP20" : "WP13", e.name, v);
      } else {
        pin("post", Math.max(1, e.day - 3), "WP12", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "WR18", `Day after ${e.name}`, v);
      }
    }
    // Fixed dates: International Day of Yoga (gyms and spas) and the New Year fitness push (gyms).
    const year = Number(a.startDate.slice(0, 4));
    for (const y of [year, year + 1]) {
      const yoga = inWindow(`${y}-06-21`);
      if (valid(yoga) && (a.type === "gym" || a.type === "spa")) {
        pin("post", yoga, "WP15", "International Day of Yoga", { event: "International Day of Yoga" });
        if (yoga >= firstReelDay) pin("reel", yoga, "WR19", "International Day of Yoga", { event: "International Day of Yoga" });
      }
      const ny = inWindow(`${y}-01-01`);
      if (valid(ny) && a.type === "gym") pin("post", ny, "WP14", "New Year fitness push", { event: "New Year" });
    }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "WP13", o.name, { event: o.name });
  },

  shootStory: { id: "WS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film — people only with consent" },

  pinnedStories: ({ a, inWindow, valid, eventDays, story }) => {
    for (const o of offersFor(a)) {
      const end = inWindow(clean(o.end));
      const start = inWindow(clean(o.start));
      if (valid(end) && end > start && safe(o.offer)) story(end, "WS04", `${safe(o.name)} ends today (as per your dates)`, "Tap to book", `${safe(o.name)} ends`);
    }
    for (const e of eventDays) {
      story(e.day - 1, "WS04", `Tomorrow: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "WS03", `Live from ${e.name}`, "Stories through the day — people only with consent", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for local clients",
    whatsappStatus: (v) => `Status: this week's schedule and timings at ${v.brand}`,
    whatsappDeliverable: "Booking quick replies with services, timings and prices (only as you provide)",
    youtubeVideo: (v) => `Inside ${v.brand}: services, team and how to book (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days — professional and family-safe",
    websiteBlog: ({ vars }) => `What to expect on your first visit to ${vars.brand} in ${vars.city}`,
    linkedin: ({ vars }) => [
      { day: 9, title: `Corporate wellness and group sessions at ${vars.brand}` },
      { day: 23, title: `Careers at ${vars.brand}: trainers and stylists` },
    ],
    pinterest: "5 style, routine and tip pins",
    x: "Schedule and tip of the week",
  },

  gbpExtra: ({ add, has }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: has("has:timings") ? "Check opening hours, services and booking link" : "Add opening hours, services and booking link", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real clients after a visit — honest reviews only, never paid, scripted or in exchange for a discount", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-S", platform: "gbp", format: "gpost", title: "Services updated on the profile (names and prices only as you provide)", who: "Oryza", time: "12:00 pm" });
  },

  firstShootLabel: "Shoot day: team, space and services",

  clientPart: ({ a, shootCount, shoots }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours — prices, offers and certifications are checked by you before publishing.",
    shootCount ? `Make the team and the space available for filming on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send photos and short videos every week using our media checklist.",
    "For any before / after, keep the client's written consent and send real, unedited photos.",
    "Send certifications, memberships and offers exactly as you want them shown.",
    a.consent === "yes" ? "Keep written consent on file for every client who appears." : "Clients will not appear until written consent is in place.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item — professional and family-safe.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; bookings passed to your WhatsApp.",
    "A monthly report: reach, followers, bookings from social and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes: string[] = [];
    if (m === 1 && a.type === "gym") themes.push("New Year: steady habits, no crash plans");
    if (m === 6 && (a.type === "gym" || a.type === "spa")) themes.push("International Day of Yoga (21 Jun)");
    if (bridal(a) && [10, 11, 12, 1, 2].includes(m)) themes.push("Wedding season looks (verify the dates yearly before planning)");
    themes.push(season(m) === "summer" ? "Summer care and hydration" : season(m) === "monsoon" ? "Monsoon care routines" : "Winter care and consistency");
    themes.push("Team introductions and service explainers");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: label(wellnessOptions.types, a.type) || "Business", value: `${vars.brand}, ${vars.city}` },
    { label: "Services", value: vars.services_list || "To be confirmed in the audit" },
    { label: "Main goal", value: label(wellnessOptions.goals, primary) },
    { label: "Timings", value: vars.timings || "To be confirmed in the audit" },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const out = [
      "Templates with guaranteed transformations or weight loss, supplements, steroids or medical claims (hair regrowth, “fairness” or whitening, curing skin conditions) are never scheduled.",
      a.consent === "yes"
        ? "Before / after posts use only real, unedited photos with written consent and carry a “Results vary” note."
        : "No before / after, client faces or testimonials are scheduled — written consent is not in place.",
      "No body-shaming wording; a respectful, encouraging tone throughout.",
      "Certifications, prices, memberships and offers appear only exactly as you provided them.",
      "Reviews: we only invite real clients to leave honest Google reviews — never paid, scripted or in exchange for a discount.",
    ];
    if (a.type === "spa" || a.services.some((s) => /spa|massage/i.test(s))) out.push("Spa content is strictly professional and family-safe.");
    const dropped = [a.services.some((s) => clean(s) && breaks(s)), a.offers.some((o) => clean(o.offer) && breaks(o.offer)), clean(a.packages) && breaks(a.packages), clean(a.certifications) && breaks(a.certifications), a.events.some((e) => e.label && breaks(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (guarantees, weight-loss or medical claims, “best” or urgency), so it was left out or replaced with a neutral name.");
    if (bridal(a)) out.push("Wedding season dates change every year and are never auto-scheduled — add the start as an event once you've verified it.");
    return out;
  },
};
