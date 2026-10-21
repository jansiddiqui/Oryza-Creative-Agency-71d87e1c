/**
 * Oryza Plan Engine — shared core.
 * Pure, rule-based and deterministic: the same answers always produce the same plan. No AI or external API.
 *
 * The core owns the mechanics every category shares: tags, pillar targets per goal, slots per package,
 * pinned dates, template scoring and cool-downs, stories, other platforms, shoot days and shot lists,
 * deliverables and summaries. A CategoryConfig supplies the category's playbook, tag rules, pinned-date
 * rules, wording and month themes (see ./categories/*).
 */
import { categoryBySlug } from "@/data/categories";
import { fixedDays, yearlyFestivals } from "@/data/calendar-india";
import { platformById, type PlatformId } from "@/data/platforms";
import { addDays, dayOf, fmtDate, monthName, weekdayName } from "./dates";
import type { Plan, PlanDay, PlanItem, Playbook, Template } from "./types";

export type PackageId = "starter" | "growth" | "premium";

export const packages: Record<
  PackageId,
  { name: string; reels: number; posts: number; storyDaysPerWeek: number; storiesPerDay: number; shoots: number }
> = {
  starter: { name: "Starter", reels: 8, posts: 8, storyDaysPerWeek: 4, storiesPerDay: 1, shoots: 1 },
  growth: { name: "Growth", reels: 12, posts: 15, storyDaysPerWeek: 7, storiesPerDay: 2, shoots: 2 },
  premium: { name: "Premium", reels: 16, posts: 18, storyDaysPerWeek: 7, storiesPerDay: 3, shoots: 3 },
};

export const PLAN_DAYS = 30;
const TIME = { reel: "8:30 pm", post: "1:30 pm", story: "Through the day" } as const;
export const PLATFORM_ORDER: PlatformId[] = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"];

/** Answers every category shares. Categories extend this with their own questions. */
export interface BaseAnswers {
  name: string;
  city: string;
  /** First goal is the primary goal. */
  goals: string[];
  events: { kind: string; date: string; label?: string }[];
  stage: "new" | "revive" | "active";
  consent: "yes" | "some" | "no";
  shoot: "1" | "2" | "weekly" | "own";
  pkg: PackageId;
  platforms: PlatformId[];
  optimize: PlatformId[];
  /** Day 1 of the plan (ISO yyyy-mm-dd). */
  startDate: string;
}

export interface PlanEvent {
  kind: string;
  date: string;
  label?: string;
  day: number;
  name: string;
}

interface Slot {
  day: number;
  format: "reel" | "post";
  template?: Template;
  vars?: Record<string, string>;
  pinnedReason?: string;
}

type ItemInput = Omit<PlanItem, "time"> & { time?: string };

/** Available to pinned-date rules (before free slots are filled). */
export interface PinContext<A extends BaseAnswers> {
  a: A;
  has: (tag: string) => boolean;
  vars: Record<string, string>;
  valid: (day: number) => boolean;
  inWindow: (iso?: string) => number;
  eventDays: PlanEvent[];
  firstReelDay: number;
  pin: (format: Slot["format"], day: number, templateId: string, reason: string, vars?: Record<string, string>) => void;
  /** Is a slot of this format already pinned on this day? */
  pinned: (format: Slot["format"], day: number) => boolean;
  /** Fixed national days and this year's festivals that fall inside the plan. */
  occasions: () => { day: number; name: string }[];
}

/** Available to stories, other platforms and summaries (after slots are filled). */
export interface BuildContext<A extends BaseAnswers> extends PinContext<A> {
  days: PlanDay[];
  D: (day: number) => PlanDay;
  tpl: (id: string) => Template;
  story: (day: number, templateId: string, title: string, hook: string, reason?: string) => void;
  add: (day: number, item: ItemInput) => void;
  sel: Set<PlatformId>;
  ownPhotos: boolean;
  shootDays: number[];
  shootCount: number;
  primary: string;
  igPosts: () => { d: PlanDay; x: PlanItem }[];
  igReels: () => { d: PlanDay; x: PlanItem }[];
  /** Did the plan schedule any free-slot template with this "who"? */
  usesWho: (who: Template["who"]) => boolean;
}

export interface SummaryContext<A extends BaseAnswers> extends BuildContext<A> {
  shoots: { day: number; date: string; label: string; shots: string[] }[];
}

export interface CategoryConfig<A extends BaseAnswers> {
  slug: string;
  version: string;
  playbook: Playbook;
  defaultGoal: string;
  /** Pillar shares (summing to 100) for the primary goal, after any category adjustments. */
  pillarMix: (primary: string, has: (tag: string) => boolean) => Record<string, number>;
  /** Category tags added to the shared ones (stage, consent, shoot, pkg, goals, primary). */
  tags: (a: A, window: { end: string }) => Iterable<string>;
  /** Variables available to every template ({name}, {city}…). */
  vars: (a: A) => Record<string, string>;
  eventName: (e: { kind: string; label?: string }) => string;
  /**
   * Templates that take their variables from a list: consumed once each, or cycled. A list item is either one
   * value (stored under key) or a set of variables. A template whose list is empty is never scheduled.
   */
  templateLists?: (a: A) => Record<string, TemplateList>;
  /** May templates that show identifiable faces be used? */
  facesAllowed: (a: A) => boolean;
  /** Compliance: templates whose wording matches are never scheduled. */
  bannedWording?: RegExp;
  pins: (ctx: PinContext<A>) => void;
  /**
   * Day-dependent tags (e.g. "day:mcc"). Template requires/blockedBy entries starting with "day:" are checked
   * against the tags of the day the template would be scheduled on.
   */
  dayTags?: (a: A) => (day: number) => Set<string>;
  /** Events the category does not promote at all (e.g. in an election silence period). */
  keepEvent?: (a: A, e: PlanEvent) => boolean;
  /** Plan days on which no free reel, post, story or shoot is scheduled (pinned items may still be placed on them). */
  closedDays?: (a: A) => number[];
  /** Last pass over the finished calendar before the summaries (e.g. per-day notes, removing items). */
  finalize?: (ctx: BuildContext<A>) => void;
  shootStory: { id: string; title: string; hook: string };
  pinnedStories: (ctx: BuildContext<A>) => void;
  platformText: {
    facebookCaption: string;
    whatsappStatus: (vars: Record<string, string>) => string;
    whatsappDeliverable: string;
    youtubeVideo: (vars: Record<string, string>) => string;
    youtubeVideoHook: string;
    websiteBlog: (ctx: BuildContext<A>) => string;
    linkedin: (ctx: BuildContext<A>) => { day: number; title: string }[];
    pinterest: string;
    x: string;
  };
  facebookAfterEvents?: (ctx: BuildContext<A>) => void;
  whatsappBeforeReminders?: (ctx: BuildContext<A>) => void;
  gbpExtra?: (ctx: BuildContext<A>) => void;
  websiteExtra?: (ctx: BuildContext<A>) => void;
  firstShootLabel: string;
  clientPart: (ctx: SummaryContext<A>) => string[];
  oryzaPart: (ctx: SummaryContext<A>) => string[];
  monthThemes: (month: number, ctx: SummaryContext<A>) => string[];
  snapshot: (ctx: SummaryContext<A>) => { label: string; value: string }[];
  /** Compliance notes shown with the plan (omitted from the plan when absent). */
  compliance?: (ctx: SummaryContext<A>) => string[];
}

/**
 * A template's list of variables. With `shared`, every template naming the same pool draws from one list:
 * each item is used at most `maxUses` times in the month, never twice in the same format.
 */
export interface TemplateList {
  key: string;
  list: (string | Record<string, string>)[];
  mode: "consume" | "cycle";
  shared?: { pool: string; maxUses: number };
}

export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/** Shared tags plus the category's own. */
export function buildTags<A extends BaseAnswers>(config: CategoryConfig<A>, a: A): Set<string> {
  const end = addDays(a.startDate, PLAN_DAYS - 1);
  const t = new Set<string>([`stage:${a.stage}`, `consent:${a.consent}`, `shoot:${a.shoot}`, `pkg:${a.pkg}`]);
  a.goals.forEach((g) => t.add(`goal:${g}`));
  if (a.goals[0]) t.add(`primary:${a.goals[0]}`);
  for (const x of config.tags(a, { end })) t.add(x);
  return t;
}

/** Does any of the template's wording break the category's compliance wording rules? */
export const breaksWording = (t: Template, banned?: RegExp) => Boolean(banned && [t.title, t.hook, t.cta ?? ""].some((s) => banned.test(s)));

export function generatePlan<A extends BaseAnswers>(config: CategoryConfig<A>, a: A): Plan {
  const pb = config.playbook;
  const DAYS = PLAN_DAYS;
  const pkg = packages[a.pkg];
  const tags = buildTags(config, a);
  const has = (tag: string) => tags.has(tag);
  const baseVars = config.vars(a);
  const inWindow = (iso?: string) => (iso ? dayOf(a.startDate, iso) : 0);
  const dayTagsOf = config.dayTags?.(a);
  const dayHas = (day: number, tag: string) => dayTagsOf?.(day).has(tag) ?? false;
  const tagOk = (t: Template, day: number) =>
    !t.requires?.some((r) => !(r.startsWith("day:") ? dayHas(day, r) : has(r))) && !t.blockedBy?.some((b) => (b.startsWith("day:") ? dayHas(day, b) : has(b)));
  const valid = (d: number) => d >= 1 && d <= DAYS;

  // ---------- 1. Pillar targets ----------
  const primary = a.goals[0] ?? config.defaultGoal;
  const mix = config.pillarMix(primary, has);
  const totalContent = pkg.reels + pkg.posts;
  const target: Record<string, number> = {};
  for (const [p, share] of Object.entries(mix)) target[p] = (share / 100) * totalContent;

  // ---------- 2. Shoot days ----------
  const shootCount = a.shoot === "own" ? 0 : a.shoot === "1" ? 1 : a.shoot === "2" ? Math.min(2, pkg.shoots) : pkg.shoots;
  const eventDays: PlanEvent[] = a.events
    .map((e) => ({ ...e, day: inWindow(e.date), name: config.eventName(e) }))
    .filter((e) => valid(e.day) && (config.keepEvent?.(a, e) ?? true))
    .sort((x, y) => x.day - y.day);
  const shootDays: number[] = [];
  const closed = new Set(config.closedDays?.(a) ?? []);
  if (shootCount >= 1) {
    let first = 1;
    while (closed.has(first) && first < DAYS) first++;
    shootDays.push(first);
  }
  const extraCandidates = [...eventDays.map((e) => e.day).filter((d) => d > 3), 15, 22, 8].filter((d) => !closed.has(d));
  for (const d of extraCandidates) {
    if (shootDays.length >= shootCount) break;
    if (shootDays.every((s) => Math.abs(s - d) >= 5)) shootDays.push(d);
  }
  shootDays.sort((x, y) => x - y);
  const firstReelDay = shootCount ? shootDays[0] + 2 : 3;

  // ---------- 3. Slots ----------
  const slots: Slot[] = [];
  const reelSpan = DAYS - firstReelDay + 1;
  for (let i = 0; i < pkg.reels; i++) slots.push({ day: firstReelDay + Math.floor((i * reelSpan) / pkg.reels), format: "reel" });
  for (let i = 0; i < pkg.posts; i++) {
    let d = 2 + Math.floor((i * (DAYS - 1)) / pkg.posts);
    if (slots.some((s) => s.format === "reel" && s.day === d) && d < DAYS && !slots.some((s) => s.day === d + 1)) d += 1;
    slots.push({ day: d, format: "post" });
  }

  const tpl = (id: string) => {
    const t = pb.templates.find((x) => x.id === id);
    if (!t) throw new Error(`${config.slug}: unknown template ${id}`);
    return t;
  };
  const pin: PinContext<A>["pin"] = (format, day, id, reason, vars = {}) => {
    if (!valid(day)) return;
    const free = slots
      .filter((s) => s.format === format && !s.template)
      .sort((x, y) => Math.abs(x.day - day) - Math.abs(y.day - day) || x.day - y.day)[0];
    if (!free) return;
    free.day = day;
    free.template = tpl(id);
    free.vars = vars;
    free.pinnedReason = reason;
  };
  const pinned: PinContext<A>["pinned"] = (format, day) => slots.some((s) => s.format === format && s.day === day && s.template);
  const occasions = () => {
    const out: { day: number; name: string }[] = [];
    for (let d = 1; d <= DAYS; d++) {
      const iso = addDays(a.startDate, d - 1);
      const fixed = fixedDays.find((f) => f.md === iso.slice(5));
      const fest = yearlyFestivals.find((f) => f.date === iso);
      if (fixed) out.push({ day: d, name: fixed.name });
      if (fest) out.push({ day: d, name: fest.name });
    }
    return out;
  };
  const pinCtx: PinContext<A> = { a, has, vars: baseVars, valid, inWindow, eventDays, firstReelDay, pin, pinned, occasions };
  if (closed.size)
    for (const s of slots) {
      const lo = s.format === "reel" ? firstReelDay : 2;
      for (let step = 0; closed.has(s.day) && step < DAYS; step++) {
        const options = [s.day - step, s.day + step].filter((d) => d >= lo && d <= DAYS && !closed.has(d));
        if (options.length) s.day = options[0];
      }
    }
  config.pins(pinCtx);

  // Move free slots off days already holding a pinned item of the same format.
  for (const s of slots.filter((x) => !x.template)) {
    const clash = () => slots.some((o) => o !== s && o.format === s.format && o.day === s.day);
    for (let step = 1; clash() && step < DAYS; step++) {
      const options = [s.day + step, s.day - step].filter(
        (d) => d >= (s.format === "reel" ? firstReelDay : 2) && d <= DAYS && !closed.has(d) && !slots.some((o) => o.format === s.format && o.day === d),
      );
      if (options.length) s.day = options[0];
    }
  }
  slots.sort((x, y) => x.day - y.day || (x.format === "reel" ? -1 : 1));

  // ---------- 4. Fill free slots by score ----------
  const lists = config.templateLists?.(a) ?? {};
  const listIdx: Record<string, number> = {};
  const poolUses: Record<string, { n: number; formats: Set<string> }[]> = {};
  /** The least-used item of a shared pool this template may still use, or -1. */
  const poolPick = (t: Template, l: TemplateList) => {
    if (!l.shared) return -1;
    const st = (poolUses[l.shared.pool] ??= l.list.map(() => ({ n: 0, formats: new Set<string>() })));
    let best = -1;
    for (let i = 0; i < st.length; i++) if (st[i].n < l.shared.maxUses && !st[i].formats.has(t.format) && (best < 0 || st[i].n < st[best].n)) best = i;
    return best;
  };
  const used: Record<string, number> = {};
  const lastUse: Record<string, number> = {};
  for (const s of slots.filter((x) => x.template)) {
    used[s.template!.pillar] = (used[s.template!.pillar] ?? 0) + 1;
    lastUse[s.template!.id] = s.day;
  }
  const facesOk = config.facesAllowed(a);
  const eligible = (t: Template, day: number, ignoreCooldown = false) => {
    if (t.pinnedOnly) return false;
    if (t.minDay && day < t.minDay) return false;
    if (!tagOk(t, day)) return false;
    if (t.faces && !facesOk) return false;
    if (breaksWording(t, config.bannedWording)) return false;
    const l = lists[t.id];
    if (l && !l.list.length) return false;
    if (l?.mode === "consume" && (listIdx[t.id] ?? 0) >= l.list.length) return false;
    if (l?.shared && poolPick(t, l) < 0) return false;
    if (a.shoot === "own" && t.who === "Client arranges") return false;
    if (!ignoreCooldown && lastUse[t.id] !== undefined) {
      const gap = day - lastUse[t.id];
      if (t.repeatable ? gap < 5 : true) return false;
    }
    return true;
  };
  const score = (t: Template) => ((target[t.pillar] ?? 0) - (used[t.pillar] ?? 0)) * 10 + (t.boosts?.filter((b) => has(b)).length ?? 0) * 4;

  for (const s of slots) {
    if (s.template) continue;
    const pool = pb.templates.filter((t) => t.format === s.format);
    let candidates = pool.filter((t) => eligible(t, s.day));
    if (!candidates.length) {
      candidates = pool.filter((t) => eligible(t, s.day, true));
      const minUse = (t: Template) => (lastUse[t.id] === undefined ? -1 : lastUse[t.id]);
      candidates.sort((x, y) => minUse(x) - minUse(y));
      candidates = candidates.slice(0, 1);
    }
    if (!candidates.length) continue;
    const best = candidates.map((t, i) => ({ t, sc: score(t) - i * 0.01 })).sort((x, y) => y.sc - x.sc)[0].t;
    s.template = best;
    s.vars = {};
    const l = lists[best.id];
    if (l?.shared) {
      const i = poolPick(best, l);
      const v = l.list[i];
      if (typeof v === "string") s.vars[l.key] = v;
      else Object.assign(s.vars, v);
      poolUses[l.shared.pool][i].n++;
      poolUses[l.shared.pool][i].formats.add(best.format);
    } else if (l && l.list.length) {
      const i = listIdx[best.id] ?? 0;
      const v = l.mode === "consume" ? l.list[i] : l.list[i % l.list.length];
      if (typeof v === "string") s.vars[l.key] = v;
      else Object.assign(s.vars, v);
      listIdx[best.id] = i + 1;
    }
    used[best.pillar] = (used[best.pillar] ?? 0) + 1;
    lastUse[best.id] = s.day;
  }

  // ---------- 5. Build days ----------
  const days: PlanDay[] = Array.from({ length: DAYS }, (_, i) => {
    const date = addDays(a.startDate, i);
    return { day: i + 1, date, weekday: weekdayName(date), items: [] };
  });
  const D = (d: number) => days[d - 1];
  const pillarName = (id: string) => pb.pillars.find((p) => p.id === id)?.name ?? "Community";
  const ownPhotos = a.shoot === "own";

  for (const s of slots) {
    if (!s.template) continue;
    const t = s.template;
    const vars = { ...baseVars, ...s.vars };
    const item: PlanItem = {
      templateId: t.id,
      platform: "instagram",
      format: t.format,
      title: fill(t.title, vars),
      hook: fill(t.hook, vars),
      cta: t.cta ? fill(t.cta, vars) : undefined,
      who: ownPhotos && t.who === "Oryza shoots" ? "Oryza edits (your photos/videos)" : t.who,
      pillar: pillarName(t.pillar),
      time: TIME[t.format],
      pinnedReason: s.pinnedReason,
    };
    if (t.note) item.note = fill(t.note, vars);
    D(s.day).items.push(item);
  }

  const story: BuildContext<A>["story"] = (d, id, title, hook, reason) => {
    if (!valid(d)) return;
    if (closed.has(d) && !reason) return;
    if (D(d).items.some((x) => x.format === "story" && x.title === title)) return;
    const t = tpl(id);
    const item: PlanItem = { templateId: id, platform: "instagram", format: "story", title, hook, time: TIME.story, pinnedReason: reason, who: t.who };
    if (t.note) item.note = fill(t.note, baseVars);
    D(d).items.push(item);
  };
  const add: BuildContext<A>["add"] = (d, item) => {
    if (valid(d)) D(d).items.push({ time: "1:30 pm", ...item });
  };
  const sel = new Set<PlatformId>(a.platforms.length ? a.platforms : ["instagram"]);
  const igPosts = () => days.flatMap((d) => d.items.filter((x) => x.platform === "instagram" && x.format === "post").map((x) => ({ d, x })));
  const igReels = () => days.flatMap((d) => d.items.filter((x) => x.platform === "instagram" && x.format === "reel").map((x) => ({ d, x })));
  const ctx: BuildContext<A> = {
    ...pinCtx,
    days,
    D,
    tpl,
    story,
    add,
    sel,
    ownPhotos,
    shootDays,
    shootCount,
    primary,
    igPosts,
    igReels,
    usesWho: (who) => slots.some((s) => s.template?.who === who),
  };

  // Stories: shoot days, the category's pinned stories, then the daily rotation.
  for (const sd of shootDays.filter((d) => !eventDays.some((e) => e.day === d))) story(sd, config.shootStory.id, config.shootStory.title, config.shootStory.hook, "Shoot day");
  config.pinnedStories(ctx);
  const rotation = pb.templates.filter(
    (t) =>
      t.format === "story" &&
      !t.pinnedOnly &&
      !t.requires?.some((r) => !r.startsWith("day:") && !has(r)) &&
      !t.blockedBy?.some((b) => !b.startsWith("day:") && has(b)) &&
      !(t.faces && !facesOk) &&
      !breaksWording(t, config.bannedWording),
  );
  let rot = 0;
  for (const day of days) {
    const wd = new Date(day.date + "T00:00:00Z").getUTCDay();
    const isStoryDay = pkg.storyDaysPerWeek >= 7 || [1, 3, 5, 6].includes(wd);
    if (!isStoryDay || !rotation.length || closed.has(day.day)) continue;
    let guard = 0;
    while (day.items.filter((x) => x.format === "story").length < pkg.storiesPerDay && guard++ < 20) {
      const t = rotation[rot++ % rotation.length];
      if (dayTagsOf && !tagOk(t, day.day)) continue;
      story(day.day, t.id, fill(t.title, baseVars), fill(t.hook, baseVars));
    }
  }

  // ---------- 6. Other platforms ----------
  const text = config.platformText;
  if (sel.has("facebook")) {
    for (const { d, x } of igPosts()) add(d.day, { templateId: x.templateId, platform: "facebook", format: "post", title: `Native post: ${x.title}`, hook: text.facebookCaption, who: "Oryza designs", time: "7:30 pm" });
    for (const e of eventDays) add(Math.max(1, e.day - 7), { templateId: "FB-EVENT", platform: "facebook", format: "event", title: `Facebook event: ${e.name}`, who: "Oryza", time: "11:00 am", pinnedReason: `7 days before ${e.name}` });
    config.facebookAfterEvents?.(ctx);
  }
  if (sel.has("whatsapp")) {
    config.whatsappBeforeReminders?.(ctx);
    for (const e of eventDays) add(Math.max(1, e.day - 1), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: ${e.name} reminder`, who: "Oryza", time: "6:00 pm", pinnedReason: `Day before ${e.name}` });
    for (const day of days) {
      const wd = new Date(day.date + "T00:00:00Z").getUTCDay();
      if (wd === 1 || wd === 4) add(day.day, { templateId: "WA-S", platform: "whatsapp", format: "status", title: text.whatsappStatus(baseVars), who: "Oryza", time: "9:00 am" });
    }
  }
  if (sel.has("gbp")) {
    for (const w of [1, 8, 15, 22]) {
      const inWeek = igPosts().filter(({ d }) => d.day >= w && d.day < w + 7);
      const pick = inWeek.find(({ x }) => x.pinnedReason) ?? inWeek[0];
      if (pick) add(pick.d.day, { templateId: "GBP-P", platform: "gbp", format: "gpost", title: `Google post: ${pick.x.title}`, hook: "With Call / WhatsApp button", who: "Oryza", time: "12:00 pm" });
    }
    add(26, { templateId: "GBP-PH", platform: "gbp", format: "gpost", title: "Upload 15 new photos from this month's shoots", who: "Oryza", time: "12:00 pm" });
    config.gbpExtra?.(ctx);
  }
  if (sel.has("youtube")) {
    igReels()
      .filter((_, i) => i % 2 === 0)
      .forEach(({ d, x }) => add(Math.min(DAYS, d.day + 1), { templateId: "YT-S", platform: "youtube", format: "short", title: `Short: ${x.title}`, who: "Oryza edits", time: "6:00 pm" }));
    if (!ownPhotos) add(28, { templateId: "YT-V", platform: "youtube", format: "video", title: text.youtubeVideo(baseVars), hook: text.youtubeVideoHook, who: "Oryza edits", time: "7:00 pm" });
  }
  if (sel.has("website")) {
    add(12, { templateId: "WEB-B", platform: "website", format: "blog", title: `Blog: ${text.websiteBlog(ctx)}`, who: "Oryza", time: "11:00 am" });
    config.websiteExtra?.(ctx);
  }
  if (sel.has("linkedin")) for (const li of text.linkedin(ctx)) add(li.day, { templateId: "LI-P", platform: "linkedin", format: "post", title: li.title, who: "Oryza designs", time: "10:00 am" });
  if (sel.has("pinterest")) for (const d of [5, 12, 19, 26]) add(d, { templateId: "PIN", platform: "pinterest", format: "pin", title: text.pinterest, who: "Oryza", time: "8:00 pm" });
  if (sel.has("x")) for (const d of [3, 10, 17, 24]) add(d, { templateId: "X-P", platform: "x", format: "post", title: text.x, who: "Oryza", time: "11:00 am" });

  config.finalize?.(ctx);
  const fmtOrder = ["reel", "post", "story"];
  for (const d of days)
    d.items.sort((x, y) => PLATFORM_ORDER.indexOf(x.platform) - PLATFORM_ORDER.indexOf(y.platform) || fmtOrder.indexOf(x.format) - fmtOrder.indexOf(y.format));

  // ---------- 7. Shoot days with merged shot lists ----------
  const shoots = shootDays.map((sd, i) => {
    const next = shootDays[i + 1] ?? DAYS + 1;
    const shots = new Set<string>();
    for (const s of slots) {
      if (s.day >= sd + 2 && s.day < next + 2 && s.template?.shots && s.template.who !== "Client arranges") s.template.shots.forEach((x) => shots.add(x));
    }
    const ev = eventDays.find((e) => e.day === sd);
    if (ev) shots.add(`Full coverage of ${ev.name}: highlights, photos for the photo story, live stories`);
    if (sel.has("gbp")) shots.add("15 still photos for Google Business Profile");
    const label = ev ? `Shoot day: ${ev.name}` : i === 0 ? config.firstShootLabel : "Shoot day";
    D(sd).shoot = { label, shots: [...shots] };
    return { day: sd, date: D(sd).date, label, shots: [...shots] };
  });
  const sctx: SummaryContext<A> = { ...ctx, shoots };

  // ---------- 8. Summaries ----------
  const count = (p: PlatformId, f?: string) => days.reduce((n, d) => n + d.items.filter((x) => x.platform === p && (!f || x.format === f)).length, 0);
  const cat = categoryBySlug[config.slug];
  const deliverables = PLATFORM_ORDER.filter((p) => sel.has(p)).map((p) => {
    const lines: string[] = [];
    if (p === "instagram") lines.push(`${count(p, "reel")} reels`, `${count(p, "post")} posts`, `${count(p, "story")} stories`);
    if (p === "facebook") lines.push(`${count(p, "post")} native posts`, `${count(p, "event")} events`);
    if (p === "whatsapp") lines.push(`${count(p, "broadcast")} broadcasts`, `${count(p, "status")} status updates`, text.whatsappDeliverable);
    if (p === "youtube") lines.push(`${count(p, "short")} Shorts`, `${count(p, "video")} long video`);
    if (p === "gbp") lines.push(`${count(p)} Google updates`, "Reply to every review");
    if (p === "website") lines.push(`${count(p)} website updates`, "Indexing check");
    if (p === "linkedin") lines.push(`${count(p)} posts`);
    if (p === "pinterest") lines.push(`${count(p) * 5} pins`);
    if (p === "x") lines.push(`${count(p)} posts`);
    lines.push(...platformById[p].monthly.slice(-1));
    return { platform: p, name: platformById[p].name, lines };
  });

  const optimization = PLATFORM_ORDER.filter((p) => sel.has(p) && a.optimize.includes(p)).map((p) => ({
    platform: p,
    name: platformById[p].name,
    items: platformById[p].optimization,
  }));

  const startMonth = Number(a.startDate.slice(5, 7));
  const nextMonths = [1, 2].map((k) => {
    const m = ((startMonth - 1 + k) % 12) + 1;
    return { month: monthName(m), themes: config.monthThemes(m, sctx) };
  });

  const pkgSummary = `${pkg.reels} reels, ${pkg.posts} posts, stories ${pkg.storyDaysPerWeek >= 7 ? "daily" : `${pkg.storyDaysPerWeek} days a week`}, ${shootCount} shoot day${shootCount === 1 ? "" : "s"}`;

  const plan: Plan = {
    version: config.version,
    snapshot: config.snapshot(sctx),
    audiences: pb.audiences,
    platforms: PLATFORM_ORDER.map((p) => ({ id: p, name: platformById[p].name, fit: cat.fit[p], selected: sel.has(p), job: platformById[p].job })),
    optimization,
    pillars: Object.entries(mix).map(([id, pct]) => ({ name: pillarName(id), pct })).sort((x, y) => y.pct - x.pct),
    days,
    deliverables,
    shootDays: shoots,
    clientPart: config.clientPart(sctx),
    oryzaPart: config.oryzaPart(sctx),
    nextMonths,
    pkg: { id: a.pkg, name: pkg.name, summary: pkgSummary },
    rules: pb.rules,
  };
  const compliance = config.compliance?.(sctx);
  if (compliance) plan.compliance = compliance;
  return plan;
}

export { fmtDate, addDays, PLAN_DAYS as DAYS };
