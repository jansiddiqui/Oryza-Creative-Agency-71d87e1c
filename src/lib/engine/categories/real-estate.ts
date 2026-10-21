/**
 * Real estate category config (builders, developers, brokers) for the shared plan engine.
 * The RERA gate: only projects with a RERA number get project content; every project item carries the RERA line.
 */
import { buyingFestivals, realEstateOptions, realEstatePlaybook, REAL_ESTATE_BANNED_WORDING } from "@/data/playbooks/real-estate";
import { addDays, fmtDate, monthName } from "../dates";
import type { BaseAnswers, CategoryConfig, PinContext } from "../core";
import type { Template } from "../types";

export type RealEstateRole = "builder" | "developer" | "broker";
export type RealEstateGoal = "visits" | "enquiries" | "trust" | "launch" | "inventory" | "resale";
export type ProjectStage = "prelaunch" | "uc" | "ready";

export interface Project {
  name: string;
  type: string;
  location: string;
  stage: ProjectStage;
  /** RERA registration number exactly as issued. Empty = not registered: no selling content. */
  rera: string;
  /** Home types and sizes, as the client wrote them. */
  units: string;
  /** Price exactly as the client wants it shown (optional). */
  price: string;
  /** Possession date exactly as declared to RERA (text). */
  possession: string;
  /** ISO dates (optional). */
  launch: string;
  booking: string;
  handover: string;
  sample: "yes" | "no";
}

export interface RealEstateAnswers extends BaseAnswers {
  role: RealEstateRole;
  goals: RealEstateGoal[];
  projects: Project[];
  /** RERA website exactly as on the registration (e.g. the UP RERA portal address). */
  reraSite: string;
  /** Broker's RERA agent registration, exactly as issued. */
  agentRera: string;
  amenities: string[];
  /** Site-visit days and timings as typed. */
  visit: string;
  /** Can Oryza film construction on site? */
  siteAccess: "yes" | "no";
  /** Home-loan partner names exactly as provided. */
  banks: string;
  /** Location advantages with distances, as provided by the client. */
  distances: string[];
  /** A festive offer exactly as approved by the client (optional). */
  offer: string;
  onCamera: "all" | "some" | "none";
}

const MIX: Record<RealEstateGoal, Record<string, number>> = {
  visits: { project: 30, progress: 20, location: 25, guides: 10, trust: 15 },
  enquiries: { project: 35, progress: 15, location: 15, guides: 25, trust: 10 },
  trust: { project: 15, progress: 30, location: 10, guides: 20, trust: 25 },
  launch: { project: 40, progress: 10, location: 25, guides: 10, trust: 15 },
  inventory: { project: 40, progress: 20, location: 15, guides: 15, trust: 10 },
  resale: { project: 40, progress: 5, location: 20, guides: 25, trust: 10 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => REAL_ESTATE_BANNED_WORDING.test(s);
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";

/** Projects that may carry selling content: a RERA number and a publishable name. */
export const registered = (a: Pick<RealEstateAnswers, "projects">) => a.projects.filter((p) => clean(p.name) && clean(p.rera) && !breaks(p.name) && !breaks(p.rera));
/** Projects named by the client that get brand and educational content only. */
export const unregistered = (a: Pick<RealEstateAnswers, "projects">) => a.projects.filter((p) => clean(p.name) && !registered(a).includes(p));

const price = (p: Project) => (clean(p.price) && !breaks(p.price) ? clean(p.price) : "");
const offer = (a: RealEstateAnswers) => (clean(a.offer) && !breaks(a.offer) ? clean(a.offer) : "");
const banks = (a: RealEstateAnswers) => (clean(a.banks) && !breaks(a.banks) ? clean(a.banks) : "");
const distances = (a: RealEstateAnswers) => a.distances.map(clean).filter((d) => d && !breaks(d));
const amenityLabels = (a: RealEstateAnswers) => a.amenities.map((x) => label(realEstateOptions.amenities, x)).filter(Boolean);

/** Variables for one registered project. */
const projectVars = (a: RealEstateAnswers, p: Project): Record<string, string> => {
  const site = clean(a.reraSite);
  const am = amenityLabels(a).join(", ");
  return {
    project: clean(p.name),
    ptype: label(realEstateOptions.types, p.type) || "Homes",
    location: clean(p.location) || clean(a.city) || "your city",
    units: clean(p.units) || "Home types as per the RERA registration",
    price: price(p),
    possession: clean(p.possession),
    rera_line: `RERA registration ${clean(p.rera)}${site ? ` · ${site}` : ""}`,
    amenity_status:
      p.stage === "ready"
        ? `Amenities as they are today: ${am} — filmed on site`
        : `Planned amenities: ${am} — shown only as renders labelled “Artist's impression” until they are built`,
    month: monthName(Number(a.startDate.slice(5, 7))),
  };
};

/** Project-level tags a template can require; each narrows the list of projects it may be filled with. */
const PROJECT_FILTERS: Record<string, (p: Project) => boolean> = {
  "has:uc": (p) => p.stage === "uc",
  "has:ready": (p) => p.stage === "ready",
  "has:prelaunch": (p) => p.stage === "prelaunch",
  "has:sample": (p) => p.sample === "yes",
  "has:price": (p) => Boolean(price(p)),
  "has:possession": (p) => Boolean(clean(p.possession)),
};
const projectsFor = (a: RealEstateAnswers, t: Template) => registered(a).filter((p) => (t.requires ?? []).every((r) => !PROJECT_FILTERS[r] || PROJECT_FILTERS[r](p)));
const usesProject = (t: Template) => /\{(project|rera_line)\}/.test(`${t.title} ${t.hook} ${t.note ?? ""}`);

const reraOk = (ctx: PinContext<RealEstateAnswers>) => registered(ctx.a);

export const realEstateConfig: CategoryConfig<RealEstateAnswers> = {
  slug: "real-estate",
  version: "real-estate-v1",
  playbook: realEstatePlaybook,
  defaultGoal: "enquiries",

  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as RealEstateGoal] ?? MIX.enquiries) };
    // Without a registered project there is nothing to sell: project share moves to guides and trust.
    if (!has("has:rera") && !has("has:agentrera")) {
      const moved = mix.project - 5;
      mix.project = 5;
      mix.guides += Math.ceil(moved / 2);
      mix.trust += Math.floor(moved / 2);
    }
    return mix;
  },

  tags: (a) => {
    const reg = registered(a);
    const t = [`role:${a.role}`, `cam:${a.onCamera}`];
    if (reg.length) t.push("has:rera");
    for (const [tag, f] of Object.entries(PROJECT_FILTERS)) if (reg.some(f)) t.push(tag);
    if (amenityLabels(a).length) t.push("has:amenities");
    if (clean(a.visit)) t.push("has:visit");
    if (a.siteAccess === "yes" && a.shoot !== "own") t.push("has:siteaccess");
    if (banks(a)) t.push("has:banks");
    if (distances(a).length) t.push("has:distances");
    if (offer(a)) t.push("has:offer");
    if (a.role === "broker" && clean(a.agentRera) && !breaks(a.agentRera)) t.push("has:agentrera");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    brand: clean(a.name) || (a.role === "broker" ? "our team" : "the builder"),
    city: clean(a.city) || "your city",
    visit: clean(a.visit),
    banks: banks(a),
    offer: offer(a),
    agent_rera: clean(a.agentRera),
    distance: distances(a)[0] ?? "",
  }),

  eventName: (e) => (e.label && clean(e.label) && !breaks(e.label) ? clean(e.label) : label(realEstateOptions.events, e.kind) || "Event"),

  templateLists: (a) => {
    const out: Record<string, { key: string; list: Record<string, string>[]; mode: "cycle" }> = {};
    for (const t of realEstatePlaybook.templates) {
      if (t.pinnedOnly || !usesProject(t)) continue;
      const projects = projectsFor(a, t).map((p) => projectVars(a, p));
      const list = /\{distance\}/.test(t.title + t.hook) ? distances(a).flatMap((d) => projects.slice(0, 1).map((v) => ({ ...v, distance: d }))) : projects;
      out[t.id] = { key: "project", list, mode: "cycle" };
    }
    return out;
  },

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: REAL_ESTATE_BANNED_WORDING,

  pins: (ctx) => {
    const { a, has, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions } = ctx;
    if (a.stage === "new") pin("post", 2, "EP11", "New account: introduce the brand first");
    for (const p of reraOk(ctx)) {
      const v = projectVars(a, p);
      const launch = inWindow(clean(p.launch));
      const booking = inWindow(clean(p.booking));
      const handover = inWindow(clean(p.handover));
      if (valid(launch)) {
        pin("reel", Math.max(launch, firstReelDay), "ER14", `${v.project}: launch`, v);
        pin("post", launch, "EP13", `${v.project}: launch`, v);
      }
      if (valid(booking)) {
        pin("reel", Math.max(booking, firstReelDay), "ER15", `${v.project}: bookings open`, v);
        pin("post", booking, "EP14", `${v.project}: bookings open`, v);
      }
      if (valid(handover)) {
        pin("post", handover, "EP15", `${v.project}: possession begins`, v);
        if (a.consent === "yes") pin("reel", Math.min(30, handover + 1), "ER16", `Day after handover at ${v.project}`, v);
      }
    }
    // Monthly site progress for registered projects under construction (when Oryza can film on site).
    if (has("has:siteaccess"))
      reraOk(ctx)
        .filter((p) => p.stage === "uc")
        .slice(0, 2)
        .forEach((p, i) => {
          const day = Math.max(firstReelDay, 10 + i * 6);
          pin("reel", day, "ER01", `Monthly site progress: ${clean(p.name)}`, { ...projectVars(a, p), month: monthName(Number(addDays(a.startDate, day - 1).slice(5, 7))) });
        });
    const firstProject = reraOk(ctx)[0];
    for (const e of eventDays) {
      const ev = { event: e.name };
      if (e.kind === "festive") {
        if (has("has:offer") && firstProject) pin("post", e.day, "EP16", `${e.name}: offer you provided`, { ...ev, ...projectVars(a, firstProject) });
        else pin("post", e.day, "EP12", e.name, ev);
      } else if (e.kind === "handover") {
        pin("reel", e.day + 1, "ER17", `Day after ${e.name}`, ev);
      } else {
        pin("post", Math.max(1, e.day - 4), "EP17", `4 days before ${e.name}`, ev);
        pin("reel", e.day + 1, "ER17", `Day after ${e.name}`, ev);
      }
    }
    for (const o of occasions()) if (!pinned("post", o.day)) pin("post", o.day, "EP12", o.name, { event: o.name });
  },

  shootStory: { id: "ES03", title: "Behind the scenes of today's shoot", hook: "Quick clips while we film" },

  pinnedStories: ({ a, eventDays, story, inWindow, valid }) => {
    for (const p of registered(a)) {
      const v = projectVars(a, p);
      for (const [iso, what] of [[p.launch, "launch"], [p.booking, "bookings open"]] as const) {
        const d = inWindow(clean(iso));
        if (!valid(d)) continue;
        for (let k = 3; k >= 1; k--) story(d - k, "ES04", `Countdown: ${v.project} ${what}`, `Countdown sticker · ${v.rera_line}`, `Before ${v.project} ${what}`);
      }
    }
    for (const e of eventDays) {
      if (e.kind !== "festive") for (let k = 2; k >= 1; k--) story(e.day - k, "ES04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
      story(e.day, "ES03", `Live from ${e.name}`, "6–8 stories through the day", e.name);
    }
  },

  platformText: {
    facebookCaption: "Longer Hindi–English caption for home buyers",
    whatsappStatus: (v) => `Status: site-visit timings and this week at ${v.brand}`,
    whatsappDeliverable: "Enquiry quick replies with RERA numbers, site-visit timings and location pins",
    youtubeVideo: (v) => `${v.brand}: project walkthrough and site progress (5–8 min)`,
    youtubeVideoHook: "Filmed across shoot days, chaptered by project — renders labelled “Artist's impression”",
    websiteBlog: ({ vars }) => `Buying a home in ${vars.city}: RERA, documents and carpet area explained`,
    linkedin: ({ vars, has }) => [
      { day: 9, title: has("role:broker") ? `${vars.brand}: how we verify every listing` : `${vars.brand}: how we build — quality and process` },
      { day: 23, title: has("has:uc") ? "Construction milestone update (dated photos)" : `${vars.brand}: buyer guide of the month` },
    ],
    pinterest: "5 home and neighbourhood pins (renders labelled “Artist's impression”)",
    x: "Project update with the RERA number",
  },

  whatsappBeforeReminders: ({ a, add, inWindow, valid }) => {
    for (const p of registered(a)) {
      const d = inWindow(clean(p.booking));
      if (valid(d)) add(d, { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast to enquiry list: ${clean(p.name)} bookings open (RERA ${clean(p.rera)})`, who: "Oryza", time: "10:00 am", pinnedReason: "Bookings open" });
    }
  },

  gbpExtra: ({ add, has }) => {
    add(3, { templateId: "GBP-H", platform: "gbp", format: "gpost", title: has("has:visit") ? "Check site-office hours, site-visit timings and location pin" : "Add site-office hours and the location pin", who: "Oryza", time: "12:00 pm" });
    add(10, { templateId: "GBP-R", platform: "gbp", format: "gpost", title: "Review link shared with buyers after a visit or handover — honest reviews only, never paid, scripted or in exchange for anything", who: "Oryza", time: "12:00 pm" });
    add(20, { templateId: "GBP-Q", platform: "gbp", format: "gpost", title: "Answer the 3 most common buyer questions in Q&A (RERA numbers exactly as provided)", who: "Oryza", time: "12:00 pm" });
  },

  websiteExtra: ({ a, add }) => {
    if (registered(a).length) add(5, { templateId: "WEB-P", platform: "website", format: "blog", title: "Project pages: RERA number, RERA website and declared possession date on every page", who: "Oryza", time: "9:00 am" });
  },

  firstShootLabel: "Shoot day: site, sample flat and team",

  clientPart: ({ a, shootCount, shoots, has }) => {
    const part = [
      "Give Oryza access to the selected accounts in week 1.",
      "Approve each week's content within 24 hours — prices, dates and distances are checked by you before publishing.",
      shootCount
        ? `Give site access on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}), with a site engineer for safety.`
        : "Send dated site photos and videos every week using our media checklist.",
      "Send the RERA certificate for every project; we show the number and website exactly as on it.",
      a.consent === "yes" ? "Keep written consent on file for every buyer who appears." : "Buyers will not appear until written consent is in place.",
      "Tell us at once if any price, possession date or plan changes.",
    ];
    if (has("role:broker")) part.push("Get written permission from owners before we film or list their homes.");
    return part;
  },

  oryzaPart: ({ shootCount }) => [
    "Strategy, scripts, captions and designs for every item in the calendar — RERA line on every project item.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list and dated site footage.` : "Editing your site photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; enquiries passed to your sales team on WhatsApp.",
    "A monthly report: reach, followers, enquiries, site-visit requests and the top content.",
  ],

  monthThemes: (m, { a, has }) => {
    const fest = buyingFestivals.filter((f) => f.months.includes(m)).map((f) => `${f.name} buying season (verify the date yearly before planning)`);
    const base = has("has:uc") ? ["Monthly site-progress update with dated footage"] : [];
    if (has("has:ready")) base.push("Ready-to-move walkthroughs");
    base.push(a.role === "broker" ? "New verified listings and rental guides" : "Buyer guides: loans, documents and RERA");
    return [...fest, ...base].slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: a.role === "broker" ? "Broker" : "Builder or developer", value: `${vars.brand}, ${vars.city}` },
    { label: "Role", value: label(realEstateOptions.roles, a.role) },
    { label: "Main goal", value: label(realEstateOptions.goals, primary) },
    {
      label: "Projects",
      value:
        a.projects.filter((p) => clean(p.name)).map((p) => `${clean(p.name)} (${label(realEstateOptions.stages, p.stage)}${registered(a).includes(p) ? `, RERA ${clean(p.rera)}` : ", no RERA number yet"})`).join("; ") ||
        "No project added — brand and buyer-guide content",
    },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a, has, eventDays }) => {
    const out: string[] = [];
    const reg = registered(a);
    if (reg.length) out.push(`Every project item carries the RERA line exactly as provided: ${reg.map((p) => projectVars(a, p).rera_line).join("; ")}.`);
    if (reg.length && !clean(a.reraSite)) out.push("Add the RERA website exactly as on your registration certificate — until then the RERA line shows the number only.");
    for (const p of unregistered(a)) out.push(`${clean(p.name)} has no RERA number, so the plan has no selling or booking content for it — brand and educational content only until it is registered.`);
    if (!reg.length && a.role !== "broker") out.push("No registered project yet: the plan uses brand, construction-know-how and buyer-guide content only.");
    if (a.role === "broker" && !has("has:agentrera")) out.push("Add your RERA agent registration to unlock listing posts — until then the plan has guides and brand content only.");
    out.push("Templates with assured returns, guaranteed appreciation, “doubles”, rental guarantees, comparisons or fake urgency (“sold out”, “only 2 left”) are never scheduled.");
    out.push("Prices appear only exactly as you typed them, with “terms apply”. No offer is invented — a festive offer appears only if you provided one.");
    const dropped = [a.projects.some((p) => clean(p.price) && !price(p)), clean(a.offer) && !offer(a), a.events.some((e) => e.label && breaks(e.label)), a.distances.some((d) => clean(d) && breaks(d))].filter(Boolean).length;
    if (dropped) out.push("Some text you entered used wording we can't publish (for example returns, guarantees or urgency), so it was left out or replaced with a neutral name.");
    out.push("Possession dates only as declared to RERA. Every render is labelled “Artist's impression”, and amenities are never shown as ready before they are.");
    out.push(a.consent === "yes" ? "Buyers appear only where their written consent is on file." : "No buyer faces or testimonials are scheduled — written consent is not in place.");
    out.push(`Festival buying days (${buyingFestivals.map((f) => f.name).join(", ")}) change date every year and are never auto-scheduled — add one as an event once you've verified the date.`);
    if (eventDays.some((e) => e.kind === "festive") && !has("has:offer")) out.push("Festive days get a greeting only, because no offer was provided.");
    return out;
  },
};
