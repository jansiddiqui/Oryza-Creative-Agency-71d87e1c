/**
 * B2B & manufacturers category config for the shared plan engine.
 * Certifications and figures only as provided; customers named only with written permission (never anonymised
 * "a leading brand" descriptions); no superlatives or comparisons; staff only with consent.
 */
import { B2B_BANNED_WORDING, b2bDays, b2bOptions, b2bPlaybook } from "@/data/playbooks/b2b";
import { addDays, fmtDate } from "../dates";
import type { BaseAnswers, CategoryConfig, TemplateList } from "../core";

export type B2bType = "manufacturer" | "supplier" | "exporter" | "distributor" | "services";
export type B2bGoal = "enquiries" | "dealers" | "export" | "trust" | "hiring";

export interface Certification {
  name: string;
  number: string;
  /** Valid till, exactly as typed (optional). */
  validTill: string;
}

export interface NamedCustomer {
  name: string;
  /** Written permission to name them. */
  permission: "yes" | "no" | "";
}

export interface B2bAnswers extends BaseAnswers {
  type: B2bType;
  goals: B2bGoal[];
  products: string[];
  industries: string[];
  certifications: Certification[];
  capacity: string;
  moq: string;
  leadTime: string;
  markets: string;
  years: string;
  /** Sustainability practices actually followed (optional). */
  sustainability: string;
  customers: NamedCustomer[];
  /** Can Oryza film the factory / floor? */
  factory: "yes" | "no";
  /** Do staff consent to appear on camera? */
  staffConsent: "yes" | "no";
  onCamera: "all" | "some" | "none";
}

const MIX: Record<B2bGoal, Record<string, number>> = {
  enquiries: { process: 20, products: 35, quality: 15, business: 15, events: 5, proof: 5, people: 5 },
  dealers: { process: 15, products: 30, quality: 10, business: 30, events: 5, proof: 5, people: 5 },
  export: { process: 20, products: 25, quality: 25, business: 15, events: 5, proof: 5, people: 5 },
  trust: { process: 25, products: 15, quality: 25, business: 10, events: 5, proof: 10, people: 10 },
  hiring: { process: 20, products: 10, quality: 10, business: 10, events: 5, proof: 5, people: 40 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => B2B_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
const products = (a: B2bAnswers) => a.products.map(safe).filter(Boolean);
const industries = (a: B2bAnswers) => a.industries.map(safe).filter(Boolean);
/** Certifications with a name and a number, exactly as typed. */
export const certLines = (a: Pick<B2bAnswers, "certifications">) =>
  a.certifications.filter((c) => safe(c.name) && clean(c.number)).map((c) => `${safe(c.name)} — No. ${clean(c.number)}${clean(c.validTill) ? `, valid till ${clean(c.validTill)}` : ""}`);
/** Customers the plan may name: written permission only. */
export const permittedCustomers = (a: Pick<B2bAnswers, "customers">) => a.customers.filter((c) => safe(c.name) && c.permission === "yes").map((c) => safe(c.name));
const factoryOk = (a: B2bAnswers) => a.factory === "yes" && a.shoot !== "own" && a.type !== "distributor";

export const b2bConfig: CategoryConfig<B2bAnswers> = {
  slug: "b2b-manufacturers",
  version: "b2b-v1",
  playbook: b2bPlaybook,
  defaultGoal: "enquiries",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as B2bGoal] ?? MIX.enquiries) };
    if (!has("has:customers")) {
      mix.products += mix.proof;
      mix.proof = 0;
    }
    if (!has("has:factory")) {
      // No factory filming: process share goes to products and buyer information.
      const moved = mix.process - 5;
      mix.process = 5;
      mix.products += Math.ceil(moved / 2);
      mix.business += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a) => {
    const t = [`type:${a.type}`, `cam:${a.onCamera}`];
    if (products(a).length) t.push("has:products");
    if (industries(a).length) t.push("has:industries");
    if (certLines(a).length) t.push("has:certs");
    if (safe(a.capacity)) t.push("has:capacity");
    if (safe(a.moq)) t.push("has:moq");
    if (safe(a.leadTime)) t.push("has:leadtime");
    if (safe(a.markets)) t.push("has:markets");
    if (safe(a.years)) t.push("has:years");
    if (safe(a.sustainability)) t.push("has:sustainability");
    if (permittedCustomers(a).length) t.push("has:customers");
    if (factoryOk(a)) t.push("has:factory");
    if (a.staffConsent === "yes") t.push("staff:yes");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: safe(a.name) || "our company",
    city: clean(a.city) || "your city",
    product: products(a)[0] ?? "",
    products_list: products(a).join(" · "),
    industries_list: industries(a).join(" · "),
    certs_line: certLines(a).join(" · "),
    cert: certLines(a)[0] ?? "",
    capacity: safe(a.capacity),
    moq: safe(a.moq),
    lead_time: safe(a.leadTime),
    markets: safe(a.markets),
    years: safe(a.years),
    sustainability: safe(a.sustainability),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : label(b2bOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const out: Record<string, TemplateList> = {};
    const customers = permittedCustomers(a);
    for (const t of b2bPlaybook.templates) {
      if (t.pinnedOnly) continue;
      const text = t.title + t.hook;
      // Each permitted customer at most twice a month, in different formats.
      if (/\{customer\}/.test(text)) out[t.id] = { key: "customer", list: customers, mode: "cycle", shared: { pool: "customer", maxUses: 2 } };
      else if (/\{cert\}/.test(text)) out[t.id] = { key: "cert", list: certLines(a), mode: "cycle" };
      else if (/\{product\}/.test(text)) out[t.id] = { key: "product", list: products(a), mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => a.staffConsent === "yes",
  bannedWording: B2B_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "BP01", "New account: what we make first");
    for (const e of eventDays) {
      const v = { event: e.name };
      if (e.kind === "fair") {
        pin("post", Math.max(1, e.day - 5), "BP07", `5 days before ${e.name}: stall invite`, v);
        if (e.day - 2 >= firstReelDay) pin("reel", e.day - 2, "BR09", `2 days before ${e.name}`, v);
        pin("reel", e.day + 1, "BR10", `Day after ${e.name}`, v);
        pin("post", e.day + 3, "BP08", `Follow-up after ${e.name}`, v);
      } else if (e.kind === "launch") {
        pin("reel", Math.max(e.day, firstReelDay), "BR11", `${e.name}: launch day`, v);
        pin("post", e.day, "BP13", `${e.name}: launch day`, v);
      } else if (e.kind === "festive") {
        if (!pinned("post", e.day)) pin("post", e.day, "BP12", e.name, v);
      } else {
        pin("post", Math.max(1, e.day - 3), "BP07", `3 days before ${e.name}`, v);
        pin("reel", e.day + 1, "BR10", `Day after ${e.name}`, v);
      }
    }
    const year = Number(a.startDate.slice(0, 4));
    if (a.type !== "distributor")
      for (const f of b2bDays)
        for (const y of [year, year + 1]) {
          const d = inWindow(`${y}-${f.md}`);
          if (valid(d) && !pinned("post", d)) pin("post", d, f.template, f.name, { event: f.name });
        }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "BP12", o.name, { event: o.name });
  },

  shootStory: { id: "BS03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film — staff only with consent" },

  pinnedStories: ({ eventDays, story }) => {
    for (const e of eventDays) {
      if (e.kind === "festive") continue;
      for (let k = 3; k >= 1; k--) story(e.day - k, "BS04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "BS03", `Live from ${e.name}`, "Stories from the stall or launch — staff only with consent", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer caption for dealers and buyers",
    whatsappStatus: (v) => `Status: this week's dispatches and new products at ${v.brand}`,
    whatsappDeliverable: "Enquiry quick replies with catalogue, MOQ and lead times (as you provide)",
    youtubeVideo: (v) => `Inside ${v.brand}: process, quality and how to order (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days — staff only with consent, figures as provided",
    websiteBlog: ({ vars }) => `How to choose a ${vars.product || "supplier"}: what buyers should specify`,
    linkedin: ({ vars }) => [
      { day: 4, title: `What we make at ${vars.brand} — and who it's for` },
      { day: 9, title: "How our quality checks work (as practised)" },
      { day: 16, title: "Buyer FAQ: MOQ, lead times and samples (as provided)" },
      { day: 23, title: `Life on the floor at ${vars.brand}` },
    ],
    pinterest: "5 product and application pins",
    x: "Product and dispatch update",
  },

  whatsappBeforeReminders: ({ eventDays, add }) => {
    for (const e of eventDays.filter((x) => x.kind === "fair"))
      add(Math.max(1, e.day - 5), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast to buyers and dealers: meet us at ${e.name}`, who: "Oryza", time: "11:00 am", pinnedReason: `5 days before ${e.name}` });
  },

  gbpExtra: ({ add }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: "Check working hours, products and the enquiry link", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with real buyers after delivery — honest reviews only, never paid or scripted", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-PR", platform: "gbp", format: "gpost", title: "Products updated on the profile (specs only as you provide)", who: "Oryza", time: "12:00 pm" });
  },

  websiteExtra: ({ add, has }) => {
    if (has("has:certs")) add(5, { templateId: "WEB-C", platform: "website", format: "blog", title: "Certifications page: names, numbers and validity exactly as on the certificates", who: "Oryza", time: "9:00 am" });
  },

  firstShootLabel: "Shoot day: factory floor, products and quality checks",

  clientPart: ({ shootCount, shoots }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours — every figure, specification and claim is checked by you before publishing.",
    shootCount ? `Give floor access with a safety escort on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send product and process photos every week using our media checklist.",
    "Send certificates (name, number, validity) exactly as issued; we never write them ourselves.",
    "Name a customer only after they give written permission — otherwise we leave them out entirely.",
    "Get staff consent before anyone appears on camera.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs — LinkedIn articles and posts included.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; enquiries passed to your sales team.",
    "A monthly report: reach, followers, enquiries, profile visits and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes: string[] = [];
    for (const f of b2bDays) if (Number(f.md.slice(0, 2)) === m && a.type !== "distributor") themes.push(f.name);
    themes.push("Process and quality series (as practised)");
    themes.push(products(a)[0] ? `Product focus: ${products(a)[0]}` : "Product applications for buyers");
    themes.push("Buyer FAQs and dealer enquiries");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: label(b2bOptions.types, a.type) || "Business", value: `${vars.brand}, ${vars.city}` },
    { label: "Products", value: vars.products_list || "To be confirmed in the audit" },
    { label: "Industries served", value: vars.industries_list || "To be confirmed in the audit" },
    { label: "Main goal", value: label(b2bOptions.goals, primary) },
    { label: "Certifications", value: certLines(a).length ? `${certLines(a).length} provided` : "None provided" },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const out = [
      "This is guidance, not legal advice — confirm with your professional body or legal team.",
      certLines(a).length ? `Certifications appear only exactly as provided: ${certLines(a).join("; ")}.` : "No certifications are shown until you send them with their numbers.",
      "Capacity, production figures, export markets and years in business appear only exactly as you provided them.",
      "Templates with “best”, “No.1”, “leading”, competitor comparisons or anonymised name-drops (“a leading brand”) are never scheduled.",
      "Product specifications and safety claims appear only as you provided them.",
      a.staffConsent === "yes" ? "Staff appear only where their consent is on file." : "No staff close-ups are scheduled — staff consent is not in place.",
    ];
    const named = permittedCustomers(a);
    const held = a.customers.filter((c) => clean(c.name) && !named.includes(safe(c.name)));
    if (named.length) out.push(`Customers named with written permission: ${named.join(", ")}.`);
    if (held.length) out.push(`${held.length} customer${held.length === 1 ? " is" : "s are"} left out entirely — no written permission to name them (we don't describe them either).`);
    const dropped = [a.products.some((p) => clean(p) && breaks(p)), clean(a.capacity) && breaks(a.capacity), clean(a.markets) && breaks(a.markets), clean(a.sustainability) && breaks(a.sustainability), a.events.some((e) => e.label && breaks(e.label))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (“best”, “leading”, comparisons or guarantees), so it was left out or replaced with a neutral name.");
    return out;
  },
};
