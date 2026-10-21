/**
 * Creators & personal brands category config for the shared plan engine.
 * Brand collaborations exist only as engine-created items, always carrying the upfront disclosure (ASCI);
 * finance advice only with a confirmed SEBI registration; health content within the qualifications provided.
 */
import { CREATOR_BANNED_WORDING, DISCLOSURE, creatorOptions, creatorsPlaybook } from "@/data/playbooks/creators";
import { addDays, fmtDate } from "../dates";
import { PLAN_DAYS, type BaseAnswers, type CategoryConfig, type TemplateList } from "../core";

export type CreatorNiche = "general" | "finance" | "health" | "education" | "food" | "tech" | "travel" | "comedy";
export type CreatorGoal = "growth" | "deals" | "community" | "launch";

export interface Collab {
  brand: string;
  /** ISO date. */
  date: string;
  type: "paid" | "gifted" | "affiliate" | "barter";
}

export interface Launch {
  name: string;
  date: string;
}

export interface Series {
  name: string;
  /** "0"–"6" (Sunday–Saturday). */
  weekday: string;
}

export interface CreatorAnswers extends BaseAnswers {
  niche: CreatorNiche;
  /** The niche in the creator's own words, e.g. "personal finance for students". */
  topic: string;
  goals: CreatorGoal[];
  styles: ("talking" | "vlog" | "skit" | "tutorial")[];
  followers: "under1k" | "1k" | "10k" | "100k";
  language: string;
  collabs: Collab[];
  launches: Launch[];
  series: Series[];
  /** SEBI registration number exactly as provided (finance creators giving advice). */
  sebi: string;
  /** Qualifications exactly as provided (health, fitness, beauty creators). */
  qualifications: string;
  /** Do children appear? Only with a parent's consent. */
  kids: "none" | "consent";
  onCamera: "all" | "some" | "none";
}

const MIX: Record<CreatorGoal, Record<string, number>> = {
  growth: { value: 30, story: 10, entertain: 15, trends: 10, community: 10, series: 15, deals: 5, launch: 5 },
  deals: { value: 30, story: 15, entertain: 10, trends: 5, community: 15, series: 15, deals: 5, launch: 5 },
  community: { value: 25, story: 20, entertain: 10, trends: 5, community: 25, series: 10, deals: 0, launch: 5 },
  launch: { value: 30, story: 15, entertain: 5, trends: 5, community: 10, series: 10, deals: 0, launch: 25 },
};

const clean = (s?: string) => (s ?? "").trim();
const breaks = (s: string) => CREATOR_BANNED_WORDING.test(s);
const safe = (s?: string) => (clean(s) && !breaks(clean(s)) ? clean(s) : "");
const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
const sebiOk = (a: CreatorAnswers) => a.niche === "finance" && Boolean(clean(a.sebi));
const qualsOk = (a: CreatorAnswers) => a.niche === "health" && Boolean(safe(a.qualifications));
const collabsFor = (a: CreatorAnswers) => a.collabs.filter((c) => clean(c.brand) && clean(c.date) && DISCLOSURE[c.type]);
const launchesFor = (a: CreatorAnswers) => a.launches.filter((l) => safe(l.name) && clean(l.date));
const seriesFor = (a: CreatorAnswers) => a.series.filter((s) => safe(s.name) && /^[0-6]$/.test(s.weekday)).slice(0, 2);
const topic = (a: CreatorAnswers) => {
  const t = safe(a.topic) || label(creatorOptions.niches, a.niche);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const creatorsConfig: CategoryConfig<CreatorAnswers> = {
  slug: "creators",
  version: "creators-v1",
  playbook: creatorsPlaybook,
  defaultGoal: "growth",
  pillarMix: (primary, has) => {
    const mix = { ...(MIX[primary as CreatorGoal] ?? MIX.growth) };
    if (!has("has:series")) {
      mix.value += mix.series;
      mix.series = 0;
    }
    if (!has("has:launch")) {
      mix.story += mix.launch;
      mix.launch = 0;
    }
    return mix;
  },

  tags: (a) => {
    const t = [`niche:${a.niche}`, `cam:${a.onCamera}`, `followers:${a.followers}`];
    a.styles.forEach((s) => t.push(`style:${s}`));
    if (!a.styles.length) t.push("style:talking");
    if (sebiOk(a)) t.push("sebi:yes");
    if (qualsOk(a)) t.push("quals:yes");
    if (a.kids === "consent") t.push("kids:consent");
    if (seriesFor(a).length) t.push("has:series");
    if (launchesFor(a).length) t.push("has:launch");
    if (a.events.length) t.push("has:event");
    return t;
  },

  vars: (a) => ({
    creator: safe(a.name) || "me",
    city: clean(a.city) || "",
    niche: topic(a),
    sebi: clean(a.sebi),
    quals: safe(a.qualifications),
  }),

  eventName: (e) => (e.label && safe(e.label) ? safe(e.label) : "Event"),

  templateLists: (): Record<string, TemplateList> => ({}),

  facesAllowed: (a) => a.consent === "yes",
  bannedWording: CREATOR_BANNED_WORDING,

  pins: ({ a, valid, inWindow, firstReelDay, eventDays, pin, pinned, occasions }) => {
    if (a.stage === "new") pin("post", 2, "CP10", "New account: introduce yourself first");
    // Brand collaborations: only ever created here, always with the disclosure in the title and the note.
    for (const c of collabsFor(a)) {
      const d = inWindow(clean(c.date));
      if (!valid(d)) continue;
      const v = { collab_label: DISCLOSURE[c.type], brand: safe(c.brand) || "a brand partner" };
      if (d >= firstReelDay) pin("reel", d, "CR11", `${v.collab_label} with ${v.brand}`, v);
      else pin("post", d, "CP05", `${v.collab_label} with ${v.brand}`, v);
    }
    for (const l of launchesFor(a)) {
      const d = inWindow(clean(l.date));
      const v = { event: safe(l.name) };
      if (valid(d - 7)) pin("post", d - 7, "CP06", `A week before ${v.event}`, v);
      if (valid(d - 3) && d - 3 >= firstReelDay) pin("reel", d - 3, "CR13", `3 days before ${v.event}`, v);
      if (valid(d)) {
        pin("reel", Math.max(d, firstReelDay), "CR12", `${v.event}: launch day`, v);
        pin("post", d, "CP21", `${v.event}: launch day`, v);
      }
      if (valid(d + 3)) pin("post", d + 3, "CP07", `Follow-up after ${v.event}`, v);
    }
    // Weekly series: the same weekday every week (at most four episodes in the plan).
    let episodes = 0;
    for (const s of seriesFor(a))
      for (let d = firstReelDay; d <= PLAN_DAYS && episodes < 4; d++)
        if (String(new Date(addDays(a.startDate, d - 1) + "T00:00:00Z").getUTCDay()) === s.weekday) {
          pin("reel", d, "CR05", `Weekly series: ${safe(s.name)}`, { series: safe(s.name) });
          episodes++;
        }
    for (const e of eventDays) pin("post", Math.max(1, e.day - 2), "CP06", `2 days before ${e.name}`, { event: e.name });
    const year = Number(a.startDate.slice(0, 4));
    for (const y of [year, year + 1]) {
      const d = inWindow(`${y}-06-30`);
      if (valid(d) && !pinned("post", d)) pin("post", d, "CP22", "World Social Media Day");
    }
    for (const o of occasions()) if (!pinned("post", o.day) && !breaks(o.name)) pin("post", o.day, "CP25", o.name, { event: o.name });
  },

  shootStory: { id: "CS03", title: "Behind the scenes of today's shoot", hook: "Quick clips from filming" },

  pinnedStories: ({ a, inWindow, valid, story, days }) => {
    for (const c of collabsFor(a)) {
      const d = inWindow(clean(c.date));
      if (valid(d)) story(d, "CS03", `${DISCLOSURE[c.type]}: ${safe(c.brand) || "a brand partner"}`, `${DISCLOSURE[c.type]} — disclosure label and paid-partnership tool on`, `${DISCLOSURE[c.type]} with ${safe(c.brand) || "a brand partner"}`);
    }
    for (const l of launchesFor(a)) {
      const d = inWindow(clean(l.date));
      for (let k = 3; k >= 1; k--) story(d - k, "CS04", `Countdown: ${safe(l.name)}`, "Countdown sticker", `Before ${safe(l.name)}`);
    }
    for (const s of seriesFor(a))
      for (const d of days) if (String(new Date(d.date + "T00:00:00Z").getUTCDay()) === s.weekday) story(d.day, "CS10", `New episode today: ${safe(s.name)}`, "Out this evening", "Weekly series");
  },

  platformText: {
    facebookCaption: "Caption adapted for Facebook, disclosures kept upfront",
    whatsappStatus: (v) => `Status: new post from ${v.creator} this week`,
    whatsappDeliverable: "Community channel updates and collaboration enquiry replies",
    youtubeVideo: (v) => `Long-form: ${v.niche}, in depth (8–15 min)`,
    youtubeVideoHook: "Built from this month's best-performing reels; disclosures upfront where relevant",
    websiteBlog: ({ vars }) => `${vars.niche}: a beginner's guide`,
    linkedin: ({ vars }) => [
      { day: 9, title: `What I've learned creating content about ${vars.niche}` },
      { day: 23, title: "How I work with brands — and how I disclose collaborations" },
    ],
    pinterest: "5 pins repurposed from this month's carousels",
    x: "Thread repurposed from this week's best post",
  },

  finalize: ({ a, days }) => {
    const add = (x: { note?: string }, n: string) => (x.note = x.note ? `${x.note} ${n}` : n);
    for (const d of days)
      for (const x of d.items) {
        if (a.niche === "finance") add(x, sebiOk(a) ? `SEBI Reg. No. ${clean(a.sebi)} — investments are subject to market risks.` : "Not investment advice.");
        if (a.niche === "health") add(x, "Not medical advice; results vary.");
      }
  },

  firstShootLabel: "Shoot day: batch-filming reels",

  clientPart: ({ a, shootCount, shoots }) => [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours.",
    shootCount ? `Batch-film on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}) — we bring the scripts and shot list.` : "Send raw clips every week; we edit and schedule.",
    "Share every brand collaboration (paid, gifted, barter or affiliate) before it goes live — we add the disclosure and switch on the paid-partnership tool.",
    a.niche === "finance" ? (sebiOk(a) ? "Keep your SEBI registration current; we show the number exactly as you gave it." : "Without a SEBI registration we keep to financial-literacy education — no stock tips or advice.") : "Never buy followers or engagement; we grow the account the honest way.",
    a.kids === "consent" ? "Children appear only with a parent's consent and never in an exploitative way." : "Children do not appear in the plan.",
  ],

  oryzaPart: ({ shootCount }) => [
    "Content pillars, scripts, hooks, captions and designs.",
    shootCount ? `${shootCount} batch-filming day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your raw clips into reels and posts.",
    "Repurposing: reels → Shorts → carousels and threads.",
    "Scheduling, community replies in working hours and collaboration enquiries passed to you.",
    "A monthly report: reach, followers, saves, shares and the top content.",
  ],

  monthThemes: (m, { a }) => {
    const themes = [`${topic(a)}: the next series of tips and tutorials`];
    if (m === 6) themes.unshift("World Social Media Day (30 Jun)");
    for (const l of launchesFor(a)) if (Number(clean(l.date).slice(5, 7)) === m) themes.unshift(`${safe(l.name)} launch`);
    themes.push("Community Q&A and lives");
    return themes.slice(0, 4);
  },

  snapshot: ({ a, vars, primary }) => [
    { label: "Creator", value: vars.creator === "me" ? "You" : vars.creator },
    { label: "Niche", value: `${label(creatorOptions.niches, a.niche)} · ${topic(a)}` },
    { label: "Followers", value: label(creatorOptions.followers, a.followers) },
    { label: "Main goal", value: label(creatorOptions.goals, primary) },
    { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, 29))}` },
  ],

  compliance: ({ a }) => {
    const out = [
      "This is guidance, not legal advice — confirm with your professional body or legal team.",
      "Every paid, gifted, barter or affiliate item carries an upfront disclosure (“Paid partnership”, “Gifted”, “Ad”) and uses the platform's paid-partnership tool, as ASCI's influencer guidelines require. Collaboration items exist only with that disclosure.",
      "No fake giveaways, no buying followers or engagement, no misleading before / after.",
    ];
    if (a.niche === "finance")
      out.push(sebiOk(a) ? `SEBI registration provided (${clean(a.sebi)}): market views carry the number and a risk note.` : "No SEBI registration provided: financial-literacy education only — no investment advice, stock tips or return promises — each item marked “not investment advice”.");
    if (a.niche === "health")
      out.push(qualsOk(a) ? `Advice stays within your qualifications (${safe(a.qualifications)}); no medical or guaranteed-result claims.` : "No qualifications provided: no health advice templates are scheduled — general content only, with no medical or guaranteed-result claims.");
    out.push(a.kids === "consent" ? "Children appear only with a parent's consent and never in an exploitative way." : "Children do not appear.");
    const dropped = [clean(a.topic) && breaks(a.topic), a.launches.some((l) => clean(l.name) && breaks(l.name)), a.series.some((s) => clean(s.name) && breaks(s.name)), a.collabs.some((c) => clean(c.brand) && breaks(c.brand))].some(Boolean);
    if (dropped) out.push("Some text you entered used wording we can't publish (guarantees, stock tips, medical claims or engagement schemes), so it was left out or replaced with a neutral name.");
    return out;
  },
};
