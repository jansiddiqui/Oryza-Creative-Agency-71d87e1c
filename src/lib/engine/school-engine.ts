/**
 * Oryza Plan Engine — schools.
 * Pure, rule-based and deterministic: the same answers always produce the same plan.
 * No AI or external API is used anywhere in this file.
 */
import { categoryBySlug } from "@/data/categories";
import { platformById, type PlatformId } from "@/data/platforms";
import { schoolPlaybook as pb, schoolOptions } from "@/data/playbooks/school";
import { fixedDays, yearlyFestivals, schoolMonthThemes } from "@/data/calendar-india";
import type { Plan, PlanDay, PlanItem, Template } from "./types";
import { addDays, dayOf, fmtDate, monthName, weekdayName } from "./dates";

export type Board = "cbse" | "icse" | "state" | "intl" | "play";
export type Level = "preprimary" | "primary" | "10" | "12";
export type Goal = "admissions" | "reputation" | "engagement" | "hiring";
export type EventKind = "annual" | "sports" | "results" | "ptm" | "openday" | "trip" | "other";
export type PackageId = "starter" | "growth" | "premium";

export interface SchoolAnswers {
  name: string;
  city: string;
  board: Board;
  level: Level;
  /** First goal is the primary goal. */
  goals: Goal[];
  admissionOpen?: string;
  admissionClose?: string;
  events: { kind: EventKind; date: string; label?: string }[];
  usps: string[];
  achievements: string[];
  stage: "new" | "revive" | "active";
  consent: "yes" | "some" | "no";
  shoot: "1" | "2" | "weekly" | "own";
  pkg: PackageId;
  platforms: PlatformId[];
  optimize: PlatformId[];
  /** Day 1 of the plan (ISO yyyy-mm-dd). */
  startDate: string;
}

export const packages: Record<
  PackageId,
  { name: string; reels: number; posts: number; storyDaysPerWeek: number; storiesPerDay: number; shoots: number }
> = {
  starter: { name: "Starter", reels: 8, posts: 8, storyDaysPerWeek: 4, storiesPerDay: 1, shoots: 1 },
  growth: { name: "Growth", reels: 12, posts: 15, storyDaysPerWeek: 7, storiesPerDay: 2, shoots: 2 },
  premium: { name: "Premium", reels: 16, posts: 18, storyDaysPerWeek: 7, storiesPerDay: 3, shoots: 3 },
};

const DAYS = 30;
const TIME = { reel: "8:30 pm", post: "1:30 pm", story: "Through the day" } as const;
const SUBJECTS = ["Maths", "Science", "English", "Hindi", "Art", "Computer"];

const PILLAR_MIX: Record<Goal, Record<string, number>> = {
  admissions: { campus: 20, teachers: 15, proof: 20, guidance: 15, admissions: 30 },
  reputation: { campus: 20, teachers: 30, proof: 30, guidance: 15, admissions: 5 },
  engagement: { campus: 35, teachers: 15, proof: 15, guidance: 25, admissions: 10 },
  hiring: { campus: 25, teachers: 35, proof: 20, guidance: 10, admissions: 10 },
};

const eventLabel = (e: { kind: EventKind; label?: string }) =>
  e.label?.trim() || schoolOptions.events.find((x) => x.id === e.kind)?.label || "Event";

interface Slot {
  day: number;
  format: "reel" | "post";
  template?: Template;
  vars?: Record<string, string>;
  pinnedReason?: string;
}

export function buildTags(a: SchoolAnswers): Set<string> {
  const end = addDays(a.startDate, DAYS - 1);
  const t = new Set<string>([
    `board:${a.board}`,
    `level:${a.level}`,
    `stage:${a.stage}`,
    `consent:${a.consent}`,
    `shoot:${a.shoot}`,
    `pkg:${a.pkg}`,
  ]);
  a.goals.forEach((g) => t.add(`goal:${g}`));
  if (a.goals[0]) t.add(`primary:${a.goals[0]}`);
  a.usps.forEach((u) => t.add(`usp:${u}`));
  if (a.achievements.filter((x) => x.trim()).length) t.add("has:proof");
  if (a.events.length) t.add("has:event");
  const open = a.admissionOpen && a.admissionOpen <= end && (!a.admissionClose || a.admissionClose >= a.startDate);
  t.add(open ? "season:open" : "season:closed");
  const m = Number(a.startDate.slice(5, 7));
  if ([2, 3, 9].includes(m)) t.add("month:exam");
  return t;
}

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function generateSchoolPlan(a: SchoolAnswers): Plan {
  const pkg = packages[a.pkg];
  const tags = buildTags(a);
  const has = (tag: string) => tags.has(tag);
  const level = schoolOptions.levels.find((l) => l.id === a.level)!;
  const board = schoolOptions.boards.find((b) => b.id === a.board)!;
  const achievements = a.achievements.map((x) => x.trim()).filter(Boolean);
  const baseVars: Record<string, string> = {
    school: a.name.trim() || "your school",
    city: a.city.trim() || "your city",
    board: board.label,
    classes: level.classes,
    admission_open: a.admissionOpen ? fmtDate(a.admissionOpen) : "",
    admission_last_date: a.admissionClose ? fmtDate(a.admissionClose) : "",
  };
  const inWindow = (iso?: string) => (iso ? dayOf(a.startDate, iso) : 0);
  const valid = (d: number) => d >= 1 && d <= DAYS;

  // ---------- 1. Pillar targets ----------
  const primary: Goal = a.goals[0] ?? "admissions";
  const mix = { ...PILLAR_MIX[primary] };
  if (!has("season:open")) {
    const moved = mix.admissions - 5;
    mix.admissions = 5;
    mix.guidance += Math.ceil(moved / 2);
    mix.campus += Math.floor(moved / 2);
  }
  const totalContent = pkg.reels + pkg.posts;
  const target: Record<string, number> = {};
  for (const [p, share] of Object.entries(mix)) target[p] = (share / 100) * totalContent;

  // ---------- 2. Shoot days ----------
  const shootCount =
    a.shoot === "own" ? 0 : a.shoot === "1" ? 1 : a.shoot === "2" ? Math.min(2, pkg.shoots) : pkg.shoots;
  const eventDays = a.events
    .map((e) => ({ ...e, day: inWindow(e.date), name: eventLabel(e) }))
    .filter((e) => valid(e.day))
    .sort((x, y) => x.day - y.day);
  const shootDays: number[] = [];
  if (shootCount >= 1) shootDays.push(1);
  const extraCandidates = [...eventDays.map((e) => e.day).filter((d) => d > 3), 15, 22, 8];
  for (const d of extraCandidates) {
    if (shootDays.length >= shootCount) break;
    if (shootDays.every((s) => Math.abs(s - d) >= 5)) shootDays.push(d);
  }
  shootDays.sort((x, y) => x - y);
  const firstReelDay = shootCount ? shootDays[0] + 2 : 3;

  // ---------- 3. Slots ----------
  const slots: Slot[] = [];
  const reelSpan = DAYS - firstReelDay + 1;
  for (let i = 0; i < pkg.reels; i++)
    slots.push({ day: firstReelDay + Math.floor((i * reelSpan) / pkg.reels), format: "reel" });
  for (let i = 0; i < pkg.posts; i++) {
    let d = 2 + Math.floor((i * (DAYS - 1)) / pkg.posts);
    if (slots.some((s) => s.format === "reel" && s.day === d) && d < DAYS && !slots.some((s) => s.day === d + 1))
      d += 1;
    slots.push({ day: d, format: "post" });
  }

  const tpl = (id: string) => pb.templates.find((t) => t.id === id)!;
  const pin = (format: Slot["format"], day: number, id: string, reason: string, vars: Record<string, string> = {}) => {
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

  // Pinned rules, highest priority first.
  const openDay = inWindow(a.admissionOpen);
  const closeDay = inWindow(a.admissionClose);
  if (a.stage === "new") pin("post", 2, "P15", "New account: introduce the school first");
  if (valid(openDay)) {
    pin("reel", Math.max(openDay, firstReelDay), "R07", "Admissions open");
    pin("post", openDay, "P04", "Admissions open");
  }
  if (valid(closeDay)) pin("post", Math.max(1, closeDay - 3), "P13", "3 days before the last date");
  for (const e of eventDays) {
    pin("reel", e.day + 1, "R10", `Day after ${e.name}`, { event: e.name });
    pin("post", e.day + 2, "P14", `Two days after ${e.name}`, { event: e.name });
  }
  const occasions: { day: number; name: string }[] = [];
  for (let d = 1; d <= DAYS; d++) {
    const iso = addDays(a.startDate, d - 1);
    const fixed = fixedDays.find((f) => f.md === iso.slice(5));
    const fest = yearlyFestivals.find((f) => f.date === iso);
    if (fixed) occasions.push({ day: d, name: fixed.name });
    if (fest) occasions.push({ day: d, name: fest.name });
  }
  for (const o of occasions) pin("post", o.day, "P10", o.name, { event: o.name });

  // Move free slots off days already holding a pinned item of the same format.
  for (const s of slots.filter((x) => !x.template)) {
    const clash = () => slots.some((o) => o !== s && o.format === s.format && o.day === s.day);
    for (let step = 1; clash() && step < DAYS; step++) {
      const options = [s.day + step, s.day - step].filter(
        (d) => d >= (s.format === "reel" ? firstReelDay : 2) && d <= DAYS && !slots.some((o) => o.format === s.format && o.day === d),
      );
      if (options.length) s.day = options[0];
    }
  }
  slots.sort((x, y) => x.day - y.day || (x.format === "reel" ? -1 : 1));

  // ---------- 4. Fill free slots by score ----------
  const used: Record<string, number> = {}; // pillar → count
  const lastUse: Record<string, number> = {};
  let achievementIdx = 0;
  let subjectIdx = 0;
  for (const s of slots.filter((x) => x.template)) {
    used[s.template!.pillar] = (used[s.template!.pillar] ?? 0) + 1;
    lastUse[s.template!.id] = s.day;
  }
  const eligible = (t: Template, day: number, ignoreCooldown = false) => {
    if (t.pinnedOnly) return false;
    if (t.minDay && day < t.minDay) return false;
    if (t.requires?.some((r) => !has(r))) return false;
    if (t.blockedBy?.some((b) => has(b))) return false;
    if (t.faces && a.consent !== "yes") return false;
    if (t.id === "P02" && achievementIdx >= achievements.length) return false;
    if (a.shoot === "own" && t.who === "Client arranges") return false;
    if (!ignoreCooldown && lastUse[t.id] !== undefined) {
      const gap = day - lastUse[t.id];
      if (t.repeatable ? gap < 5 : true) return false;
    }
    return true;
  };
  const score = (t: Template) =>
    ((target[t.pillar] ?? 0) - (used[t.pillar] ?? 0)) * 10 + (t.boosts?.filter((b) => has(b)).length ?? 0) * 4;

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
    const best = candidates
      .map((t, i) => ({ t, sc: score(t) - i * 0.01 }))
      .sort((x, y) => y.sc - x.sc)[0].t;
    s.template = best;
    s.vars = {};
    if (best.id === "P02") s.vars.achievement = achievements[achievementIdx++];
    if (best.id === "R02") s.vars.subject = SUBJECTS[subjectIdx++ % SUBJECTS.length];
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
    D(s.day).items.push({
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
    });
  }

  // Stories
  const story = (d: number, id: string, title: string, hook: string, reason?: string) => {
    if (!valid(d)) return;
    if (D(d).items.some((x) => x.format === "story" && x.title === title)) return;
    D(d).items.push({ templateId: id, platform: "instagram", format: "story", title, hook, time: TIME.story, pinnedReason: reason, who: tpl(id).who });
  };
  for (const sd of shootDays.filter((d) => !eventDays.some((e) => e.day === d))) story(sd, "S03", "Behind the scenes of today's shoot", "Quick clips while we film", "Shoot day");
  if (valid(openDay)) {
    story(openDay - 2, "S04", "Countdown: admissions open", "Countdown sticker", "Before admissions open");
    story(openDay - 1, "S04", "Countdown: admissions open", "Countdown sticker", "Before admissions open");
  }
  if (valid(closeDay))
    for (let k = 3; k >= 1; k--) story(closeDay - k, "S04", `Countdown: last date ${baseVars.admission_last_date}`, "Countdown sticker", "Before the last date");
  for (const e of eventDays) {
    story(e.day - 3, "S04", `Countdown: ${e.name}`, "Countdown sticker", `Before ${e.name}`);
    story(e.day, "S03", `Live from ${e.name}`, "6–8 stories through the event", e.name);
  }
  const rotation = pb.templates.filter((t) => t.format === "story" && !t.pinnedOnly && !t.requires?.some((r) => !has(r)));
  let rot = 0;
  for (const day of days) {
    const wd = new Date(day.date + "T00:00:00Z").getUTCDay();
    const isStoryDay = pkg.storyDaysPerWeek >= 7 || [1, 3, 5, 6].includes(wd);
    if (!isStoryDay) continue;
    let guard = 0;
    while (day.items.filter((x) => x.format === "story").length < pkg.storiesPerDay && guard++ < 20) {
      const t = rotation[rot++ % rotation.length];
      story(day.day, t.id, fill(t.title, baseVars), fill(t.hook, baseVars));
    }
  }

  // ---------- 6. Other platforms ----------
  const sel = new Set<PlatformId>(a.platforms.length ? a.platforms : ["instagram"]);
  const igPosts = () => days.flatMap((d) => d.items.filter((x) => x.platform === "instagram" && x.format === "post").map((x) => ({ d, x })));
  const igReels = () => days.flatMap((d) => d.items.filter((x) => x.platform === "instagram" && x.format === "reel").map((x) => ({ d, x })));
  const add = (d: number, item: Omit<PlanItem, "time"> & { time?: string }) => {
    if (valid(d)) D(d).items.push({ time: "1:30 pm", ...item });
  };

  if (sel.has("facebook")) {
    for (const { d, x } of igPosts()) add(d.day, { templateId: x.templateId, platform: "facebook", format: "post", title: `Native post: ${x.title}`, hook: "Longer Hindi–English caption for parents", who: "Oryza designs", time: "7:30 pm" });
    for (const e of eventDays) add(Math.max(1, e.day - 7), { templateId: "FB-EVENT", platform: "facebook", format: "event", title: `Facebook event: ${e.name}`, who: "Oryza", time: "11:00 am", pinnedReason: `7 days before ${e.name}` });
    if (valid(openDay)) add(openDay, { templateId: "FB-EVENT", platform: "facebook", format: "event", title: "Facebook event: admission open day", who: "Oryza", time: "11:00 am", pinnedReason: "Admissions open" });
  }
  if (sel.has("whatsapp")) {
    if (valid(openDay)) add(openDay, { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: "Broadcast to parent list: admissions open", who: "Oryza", time: "10:00 am", pinnedReason: "Admissions open" });
    if (valid(closeDay)) add(Math.max(1, closeDay - 3), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: last date ${baseVars.admission_last_date}`, who: "Oryza", time: "10:00 am", pinnedReason: "3 days before the last date" });
    for (const e of eventDays) add(Math.max(1, e.day - 1), { templateId: "WA-B", platform: "whatsapp", format: "broadcast", title: `Broadcast: ${e.name} reminder`, who: "Oryza", time: "6:00 pm", pinnedReason: `Day before ${e.name}` });
    for (const day of days) {
      const wd = new Date(day.date + "T00:00:00Z").getUTCDay();
      if (wd === 1 || wd === 4) add(day.day, { templateId: "WA-S", platform: "whatsapp", format: "status", title: `Status: this week at ${baseVars.school}`, who: "Oryza", time: "9:00 am" });
    }
  }
  if (sel.has("gbp")) {
    const weeks = [1, 8, 15, 22];
    for (const w of weeks) {
      const inWeek = igPosts().filter(({ d }) => d.day >= w && d.day < w + 7);
      const pick = inWeek.find(({ x }) => x.pinnedReason) ?? inWeek[0];
      if (pick) add(pick.d.day, { templateId: "GBP-P", platform: "gbp", format: "gpost", title: `Google post: ${pick.x.title}`, hook: "With Call / WhatsApp button", who: "Oryza", time: "12:00 pm" });
    }
    add(26, { templateId: "GBP-PH", platform: "gbp", format: "gpost", title: "Upload 15 new photos from this month's shoots", who: "Oryza", time: "12:00 pm" });
  }
  if (sel.has("youtube")) {
    igReels()
      .filter((_, i) => i % 2 === 0)
      .forEach(({ d, x }) => add(Math.min(DAYS, d.day + 1), { templateId: "YT-S", platform: "youtube", format: "short", title: `Short: ${x.title}`, who: "Oryza edits", time: "6:00 pm" }));
    if (!ownPhotos) add(28, { templateId: "YT-V", platform: "youtube", format: "video", title: `Campus tour of ${baseVars.school} (5–8 min)`, hook: "Filmed across shoot days, chaptered for parents", who: "Oryza edits", time: "7:00 pm" });
  }
  if (sel.has("website")) {
    const blogTitle = has("season:open")
      ? `Documents needed for admission in a ${board.label} school in ${baseVars.city}`
      : `How to choose the right school in ${baseVars.city}: a parent's checklist`;
    add(12, { templateId: "WEB-B", platform: "website", format: "blog", title: `Blog: ${blogTitle}`, who: "Oryza", time: "11:00 am" });
    if (valid(openDay)) add(openDay, { templateId: "WEB-A", platform: "website", format: "blog", title: "Admissions page update and homepage banner", who: "Oryza", time: "9:00 am", pinnedReason: "Admissions open" });
  }
  if (sel.has("linkedin")) {
    add(9, { templateId: "LI-P", platform: "linkedin", format: "post", title: has("goal:hiring") ? "Teacher openings at " + baseVars.school : `Leadership note from the principal of ${baseVars.school}`, who: "Oryza designs", time: "10:00 am" });
    add(23, { templateId: "LI-P", platform: "linkedin", format: "post", title: `Life at ${baseVars.school}: our teachers`, who: "Oryza designs", time: "10:00 am" });
  }
  if (sel.has("pinterest")) for (const d of [5, 12, 19, 26]) add(d, { templateId: "PIN", platform: "pinterest", format: "pin", title: "5 campus and activity pins", who: "Oryza", time: "8:00 pm" });
  if (sel.has("x")) for (const d of [3, 10, 17, 24]) add(d, { templateId: "X-P", platform: "x", format: "post", title: "School news update", who: "Oryza", time: "11:00 am" });

  const order: PlatformId[] = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"];
  const fmtOrder = ["reel", "post", "story"];
  for (const d of days)
    d.items.sort((x, y) => order.indexOf(x.platform) - order.indexOf(y.platform) || fmtOrder.indexOf(x.format) - fmtOrder.indexOf(y.format));

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
    const label = ev ? `Shoot day: ${ev.name}` : i === 0 ? "Shoot day: campus, teachers and facilities" : "Shoot day";
    D(sd).shoot = { label, shots: [...shots] };
    return { day: sd, date: D(sd).date, label, shots: [...shots] };
  });

  // ---------- 8. Summaries ----------
  const count = (p: PlatformId, f?: string) => days.reduce((n, d) => n + d.items.filter((x) => x.platform === p && (!f || x.format === f)).length, 0);
  const cat = categoryBySlug["schools"];
  const deliverables = order
    .filter((p) => sel.has(p))
    .map((p) => {
      const lines: string[] = [];
      if (p === "instagram") lines.push(`${count(p, "reel")} reels`, `${count(p, "post")} posts`, `${count(p, "story")} stories`);
      if (p === "facebook") lines.push(`${count(p, "post")} native posts`, `${count(p, "event")} events`);
      if (p === "whatsapp") lines.push(`${count(p, "broadcast")} broadcasts`, `${count(p, "status")} status updates`, "Admission quick replies kept up to date");
      if (p === "youtube") lines.push(`${count(p, "short")} Shorts`, `${count(p, "video")} long video`);
      if (p === "gbp") lines.push(`${count(p)} Google updates`, "Reply to every review");
      if (p === "website") lines.push(`${count(p)} website updates`, "Indexing check");
      if (p === "linkedin") lines.push(`${count(p)} posts`);
      if (p === "pinterest") lines.push(`${count(p) * 5} pins`);
      if (p === "x") lines.push(`${count(p)} posts`);
      lines.push(...platformById[p].monthly.slice(-1));
      return { platform: p, name: platformById[p].name, lines };
    });

  const optimization = order
    .filter((p) => sel.has(p) && a.optimize.includes(p))
    .map((p) => ({ platform: p, name: platformById[p].name, items: platformById[p].optimization }));

  const clientPart = [
    "Give Oryza access to the selected accounts in week 1.",
    "Approve each week's content within 24 hours.",
    shootCount ? `Make the campus, principal and 3–4 teachers available on shoot days (${shoots.map((s) => fmtDate(s.date)).join(", ")}).` : "Send photos and short videos every week using our media checklist.",
    a.consent === "yes" ? "Keep written photo consent records up to date." : "Collect written photo consent from parents — until then we avoid children's faces.",
    "Share achievements, notices and event dates as soon as you have them.",
  ];
  if (a.shoot !== "own" && slots.some((s) => s.template?.who === "Client arranges")) clientPart.push("Arrange one alumnus for a short interview.");

  const oryzaPart = [
    "Strategy, scripts, captions and designs for every item in the calendar.",
    shootCount ? `${shootCount} shoot day${shootCount > 1 ? "s" : ""} with a planned shot list.` : "Editing your photos and videos into reels and posts.",
    "Scheduling and publishing at the planned times.",
    "Replies to comments and DMs in working hours; admission inquiries passed to your WhatsApp.",
    "A monthly report: reach, followers, inquiries and the top content.",
  ];

  const startMonth = Number(a.startDate.slice(5, 7));
  const nextMonths = [1, 2].map((k) => {
    const m = ((startMonth - 1 + k) % 12) + 1;
    const themes = [...(schoolMonthThemes[m] ?? [])];
    if (a.admissionClose && Number(a.admissionClose.slice(5, 7)) === m) themes.unshift(`Admissions closing on ${baseVars.admission_last_date}`);
    return { month: monthName(m), themes };
  });

  const pkgSummary = `${pkg.reels} reels, ${pkg.posts} posts, stories ${pkg.storyDaysPerWeek >= 7 ? "daily" : `${pkg.storyDaysPerWeek} days a week`}, ${shootCount} shoot day${shootCount === 1 ? "" : "s"}`;

  return {
    version: "school-v1",
    snapshot: [
      { label: "School", value: `${baseVars.school}, ${baseVars.city}` },
      { label: "Board and classes", value: `${board.label} · ${level.classes}` },
      { label: "Main goal", value: schoolOptions.goals.find((g) => g.id === primary)?.label ?? "" },
      { label: "Strengths", value: a.usps.map((u) => schoolOptions.usps.find((x) => x.id === u)?.label).filter(Boolean).join(", ") || "To be discovered in the audit" },
      { label: "Plan period", value: `${fmtDate(a.startDate)} – ${fmtDate(addDays(a.startDate, DAYS - 1))}` },
    ],
    audiences: pb.audiences,
    platforms: order.map((p) => ({ id: p, name: platformById[p].name, fit: cat.fit[p], selected: sel.has(p), job: platformById[p].job })),
    optimization,
    pillars: Object.entries(mix).map(([id, pct]) => ({ name: pillarName(id), pct })).sort((x, y) => y.pct - x.pct),
    days,
    deliverables,
    shootDays: shoots,
    clientPart,
    oryzaPart,
    nextMonths,
    pkg: { id: a.pkg, name: pkg.name, summary: pkgSummary },
    rules: pb.rules,
  };
}
