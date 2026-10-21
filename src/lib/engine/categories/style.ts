/**
 * Interiors, fashion & jewellery category config for the shared plan engine.
 * Claims (hallmark, purity, fabric) only in the client's own words; rates and making charges only as provided
 * with date and time; gold never as an investment; renders labelled; client homes only with consent.
 */
import { EARLIER_PRICE } from "@/data/compliance-common";
import { STYLE_BANNED_WORDING, styleDays, styleFestivals, styleOptions, stylePlaybook } from "@/data/playbooks/style";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig, TemplateList } from "../core";

export type StyleType = "jeweller" | "boutique" | "designer" | "interior";
export type StyleGoal = "launch" | "footfall" | "enquiries" | "bridal" | "trust";

export interface Collection {
  name: string;
  /** ISO launch date (optional). */
  launch: string;
}

export interface StyleProject {
  name: string;
  /** e.g. "3 BHK apartment", "Café interior". */
  kind: string;
  /** Timeline exactly as provided. */
  timeline: string;
  /** Cost exactly as provided (optional), shown only when showBudget is "yes". */
  budget: string;
  showBudget: "yes" | "no";
  /** The client's written consent to show their home or space. */
  consent: "yes" | "no" | "";
}

export interface StyleOffer {
  name: string;
  start: string;
  offer: string;
  earlierPriceConfirmed: "yes" | "no";
}

export interface StyleAnswers extends BaseAnswers {
  type: StyleType;
  goals: StyleGoal[];
  specialities: string[];
  collections: Collection[];
  projects: StyleProject[];
  /** Hallmark / BIS / HUID / purity details exactly as provided (jewellers). */
  hallmark: string;
  /** Fabric and craft claims exactly as provided (boutiques, designers). */
  fabric: string;
  prices: "request" | "show";
  /** Prices as the client wants them shown, with date where relevant. */
  priceText: string;
  /** Making charges exactly as provided. */
  making: string;
  /** Post the client's daily gold rate (sent each morning with date and time). */
  rateStories: "yes" | "no";
  offers: StyleOffer[];
  /** Can Oryza film the workshop / products being made? */
  workshop: "yes" | "no";
  onCamera: "all" | "some" | "none";
}

const MIX: Record<StyleGoal, Record<string, number>> = {
  launch: { collections: 35, craft: 20, style: 20, process: 5, projects: 5, care: 5, people: 5, space: 5 },
  footfall: { collections: 25, craft: 15, style: 20, process: 5, projects: 5, care: 5, people: 10, space: 15 },
  enquiries: { collections: 15, craft: 15, style: 25, process: 20, projects: 10, care: 5, people: 5, space: 5 },
  bridal: { collections: 35, craft: 15, style: 25, process: 5, projects: 0, care: 5, people: 10, space: 5 },
  trust: { collections: 15, craft: 25, style: 15, process: 10, projects: 10, care: 10, people: 10, space: 5 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => STYLE_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
const specialities = (a: StyleAnswers) => a.specialities.map(safe).filter(Boolean);
const collections = (a: StyleAnswers) => a.collections.filter((c) => safe(c.name));
/** Real projects that may be shown: interior studios only, with the client's written consent and a timeline. */
export const showableProjects = (a: StyleAnswers) => (a.type === "interior" ? a.projects.filter((p) => safe(p.name) && safe(p.timeline) && p.consent === "yes") : []);
export const usableOffer = (o: StyleOffer) => {
  const t = safe(o.offer);
  return t && EARLIER_PRICE.test(t) && o.earlierPriceConfirmed !== "yes" ? "" : t;
};
const offersFor = (a: StyleAnswers) => a.offers.filter((o) => safe(o.name) && clean(o.start));
const bridal = (a: StyleAnswers) => a.type !== "interior" && (a.goals.includes("bridal") || specialities(a).some((s) => /bridal|wedding/i.test(s)));

export const styleConfig: CategoryConfig<StyleAnswers> = {
  slug: "interiors-fashion-jewellery",
  version: "style-v1",
  playbook: stylePlaybook,
  defaultGoal: "launch",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as StyleGoal] ?? MIX.launch) };
    if (!has("has:projects")) {
      mix.style += mix.projects;
      mix.projects = 0;
    }
    return mix;
  },

  tags: (a) => {
    const t = [`type:${a.type}`, `cam:${a.onCamera}`, `prices:${a.prices === "show" && (safe(a.priceText) || safe(a.making)) ? "show" : "request"}`];
    if (specialities(a).length) t.push("has:specialities");
    if (a.type === "jeweller" && safe(a.hallmark)) t.push("has:hallmark");
    if ((a.type === "boutique" || a.type === "designer") && safe(a.fabric)) t.push("has:fabric");
    if (a.type === "jeweller" && safe(a.making)) t.push("has:making");
    if (a.workshop === "yes" && a.shoot !== "own") t.push("has:workshop");
    if (showableProjects(a).length) t.push("has:projects");
    if (bridal(a)) t.push("has:bridal");
    if (a.type === "jeweller" && a.rateStories === "yes") t.push("rate:yes");
    if (a.events.length || a.collections.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our studio",
    city: clean(a.city) || "your city",
    speciality: specialities(a)[0] ?? "",
    specialities_list: specialities(a).join(" · "),
    hallmark_line: a.type === "jeweller" ? safe(a.hallmark) : "",
    fabric_line: a.type === "boutique" || a.type === "designer" ? safe(a.fabric) : "",
    price_note: a.prices === "show" && safe(a.priceText) ? safe(a.priceText) : "Prices on request",
    making_line: a.type === "jeweller" && safe(a.making) ? ` · Making charges: ${safe(a.making)}` : "",
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : label(styleOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const projects = showableProjects(a).map((p) => ({
      project: safe(p.name),
      project_type: safe(p.kind) || "Interior project",
      timeline: safe(p.timeline),
      budget_line: p.showBudget === "yes" && safe(p.budget) ? ` · ${safe(p.budget)}` : "",
    }));
    const out: Record<string, TemplateList> = {};
    for (const t of stylePlaybook.templates) {
      if (t.pinnedOnly) continue;
      const text = t.title + t.hook;
      // Each real project at most twice a month, in different formats.
      if (/\{project\}/.test(text)) out[t.id] = { key: "project", list: projects, mode: "cycle", shared: { pool: "project", maxUses: 2 } };
      else if (/\{speciality\}/.test(text)) out[t.id] = { key: "speciality", list: specialities(a), mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: STYLE_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "YP07", "New account: how to visit first");
    for (const c of collections(a)) {
      const d = inWindow(clean(c.launch));
      if (!valid(d)) continue;
      const v = { event: safe(c.name) };
      if (valid(d - 5)) pin("post", d - 5, "YP24", `5 days before ${v.event}`, v);
      pin("reel", Math.max(d, firstReelDay), "YR03", `${v.event}: launch day`, v);
      pin("post", d, "YP01", `${v.event}: launch day`, v);
    }
    for (const o of offersFor(a)) {
      const d = inWindow(clean(o.start));
      if (valid(d) && usableOffer(o)) pin("post", d, "YP13", `${safe(o.name)} starts`, { event: safe(o.name), offer: usableOffer(o) });
    }
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "festive" || e.kind === "wedding") {
        if (!pinned("post", e.day)) pin("post", e.day, "YP12", e.name, v);
      } else {
        pin("post", Math.max(1, e.day - 3), "YP24", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "YR19", `Day after ${e.name}`, v);
      }
    }
    const year = Number(a.startDate.slice(0, 4));
    for (const f of styleDays.filter((x) => x.types.includes(a.type)))
      for (const y of [year, year + 1]) {
        const d = inWindow(`${y}-${f.md}`);
        if (valid(d) && !pinned("post", d)) pin("post", d, "YP12", f.name, { event: f.name });
      }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "YP12", o.name, { event: o.name });
  },

  shootStory: { id: "YS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, inWindow, valid, eventDays, story }) => {
    for (const c of collections(a)) {
      const d = inWindow(clean(c.launch));
      if (valid(d)) for (let k = 3; k >= 1; k--) story(d - k, "YS04", `Countdown: ${safe(c.name)}`, "Countdown sticker", `Before ${safe(c.name)}`);
    }
    for (const e of eventDays) {
      story(e.day - 1, "YS04", `Tomorrow: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "YS03", `Live from ${e.name}`, "Stories through the day", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for customers",
    whatsappStatus: (v) => `Status: new pieces and appointments at ${v.brand}`,
    whatsappDeliverable: "Appointment and enquiry quick replies (prices and rates only as you provide)",
    youtubeVideo: (v) => `Inside ${v.brand}: the craft, the collection and the process (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days — renders labelled as concepts",
    websiteBlog: ({ vars, a }) => (a.type === "interior" ? `Planning an interior project in ${vars.city}: steps, timelines and questions to ask` : `How to choose ${vars.speciality || "the right piece"}: a buyer's guide`),
    linkedin: ({ vars, a }) => [
      { day: 9, title: a.type === "interior" ? `Commercial interiors by ${vars.brand}` : `Corporate gifting and bulk orders at ${vars.brand}` },
      { day: 23, title: `The craft behind ${vars.brand}` },
    ],
    pinterest: "5 pins: looks, pieces or room concepts (renders labelled)",
    x: "New collection or project update",
  },

  gbpExtra: ({ add }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: "Check opening hours, appointment link and services", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real customers after purchase or handover — honest reviews only, never paid or scripted", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-PH", platform: "gbp", format: "gpost", title: "New collection or project photos added (renders labelled as concepts)", who: "Oryza", time: "12:00 pm" });
  },

  firstShootLabel: "Shoot day: pieces, workshop and studio",

  clientPart: ({ a, shootCount, shoots }) => {
    const part = [
      "Give Oryza access to the selected accounts in week 1.",
      "Approve each week's content within 24 hours — every detail, price and claim is checked by you before publishing.",
      shootCount ? `Keep pieces, the workshop or the studio ready for filming on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send photos and short videos every week using our media checklist.",
      a.consent === "yes" ? "Keep written consent on file for every customer who appears." : "Customers will not appear until written consent is in place.",
    ];
    if (a.type === "jeweller") part.push("Send hallmark, HUID and purity details exactly as on your certificates; send rates and making charges with the date and time whenever they change.");
    if (a.type === "interior") part.push("For every real project, send the client's written consent, the timeline and (only if you want it shown) the cost.");
    if (a.type === "boutique" || a.type === "designer") part.push("Send fabric and craft details exactly as you can verify them.");
    return part;
  },

  oryzaPart: ({ shootCount }) => [
    "Strategy, captions and designs for every item — Pinterest boards included.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; appointment requests passed to your WhatsApp.",
    "A monthly report: reach, followers, enquiries, saves and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes = styleFestivals.filter((f) => f.months.includes(m) && (a.type !== "interior" || f.name !== "Wedding season")).map((f) => `${f.name} (verify the date yearly before planning)`);
    for (const d of styleDays.filter((x) => x.types.includes(a.type) && Number(x.md.slice(0, 2)) === m)) themes.push(d.name);
    themes.push(a.type === "interior" ? "Design process and real projects (with consent)" : "New pieces, styling guides and craft stories");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: label(styleOptions.types, a.type) || "Business", value: `${vars.brand}, ${vars.city}` },
    { label: "Specialities", value: vars.specialities_list || "To be confirmed in the audit" },
    { label: "Main goal", value: label(styleOptions.goals, primary) },
    { label: "Prices", value: label(styleOptions.prices, a.prices) },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const out = [
      "Templates with investment or returns wording, “best”, “No.1”, fake discounts or urgency are never scheduled.",
      a.consent === "yes" ? "Customers appear only where written consent is on file." : "No customer faces or testimonials are scheduled — written consent is not in place.",
    ];
    if (a.type === "jeweller") {
      out.push(safe(a.hallmark) ? `Hallmark and purity details appear only exactly as you provided them: “${safe(a.hallmark)}”.` : "No hallmark, HUID or purity details are shown until you send them exactly as on your certificates.");
      out.push("Gold rates and making charges appear only as you send them, with the date and time — never filled automatically. Gold is never presented as an investment with returns.");
    }
    if (a.type === "interior") {
      out.push("Every render is labelled “Design concept / visualisation”.");
      const held = a.projects.filter((p) => clean(p.name) && !showableProjects(a).includes(p));
      if (held.length) out.push(`${held.length} project${held.length === 1 ? " was" : "s were"} left out because the client's written consent or the timeline was missing.`);
      out.push("Project timelines and costs appear only as you provided them (costs only when you chose to show them).");
    }
    if (a.type === "boutique" || a.type === "designer")
      out.push(safe(a.fabric) ? `Fabric and craft claims appear only in your words: “${safe(a.fabric)}”.` : "No fabric or handloom claims are made until you provide them.");
    const heldOffers = offersFor(a).filter((o) => safe(o.offer) && !usableOffer(o));
    if (heldOffers.length) out.push(`${heldOffers.map((o) => safe(o.name)).join(", ")}: the offer quotes an earlier price you haven't confirmed, so it is not shown.`);
    out.push(a.prices === "show" ? "Prices appear only exactly as you provided them." : "Prices are “on request” — none are shown.");
    const dropped = [a.specialities.some((s) => clean(s) && breaks(s)), clean(a.hallmark) && breaks(a.hallmark), clean(a.fabric) && breaks(a.fabric), a.offers.some((o) => clean(o.offer) && breaks(o.offer)), a.events.some((e) => e.label && breaks(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (investment or returns, “best”, discounts or urgency), so it was left out or replaced with a neutral name.");
    out.push(`Buying seasons whose date changes each year (${styleFestivals.map((f) => f.name).join(", ")}) are never auto-scheduled — add one as an event once you've verified the date.`);
    return out;
  },
};
