import type { SchoolAnswers } from "./school-engine";

/**
 * A wide spread of school answers used to prove the shared-core refactor changes nothing:
 * every package, consent and shoot option, goal, board/level, platform set, and month windows
 * that hit fixed days (New Year, Republic Day, Independence Day, Teachers' Day, Children's Day, Christmas).
 */
const base: SchoolAnswers = {
  name: "Sunrise Public School", city: "Kanpur", board: "cbse", level: "12",
  goals: ["admissions"], admissionOpen: "2026-11-02", admissionClose: "2026-11-20",
  events: [{ kind: "sports", date: "2026-11-05" }, { kind: "ptm", date: "2026-11-13" }],
  usps: ["sports", "safety"], achievements: ["State chess champion", "100% board results", "Science fair winner"],
  stage: "revive", consent: "some", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "website", "youtube"], optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
};
const all = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] as const;

export const schoolVariants: Record<string, SchoolAnswers> = {
  base,
  starter: { ...base, pkg: "starter" },
  premium: { ...base, pkg: "premium", shoot: "weekly" },
  consentYes: { ...base, consent: "yes" },
  consentNo: { ...base, consent: "no" },
  ownPhotos: { ...base, shoot: "own" },
  oneShoot: { ...base, shoot: "1" },
  newAccount: { ...base, stage: "new" },
  allPlatforms: { ...base, platforms: [...all], optimize: [...all] },
  reputation: { ...base, goals: ["reputation", "engagement"] },
  engagement: { ...base, goals: ["engagement"], consent: "yes" },
  hiring: { ...base, goals: ["hiring"], platforms: [...all] },
  playSchool: { ...base, board: "play", level: "preprimary", achievements: [], usps: ["activities", "safety", "transport"] },
  primary: { ...base, level: "primary", board: "icse", usps: ["smart", "activities"] },
  closedSeason: { ...base, admissionOpen: undefined, admissionClose: undefined },
  closeOnly: { ...base, admissionOpen: "2026-09-01", admissionClose: "2026-11-10" },
  manyEvents: {
    ...base,
    events: [
      { kind: "annual", date: "2026-10-28" }, { kind: "sports", date: "2026-11-05" }, { kind: "results", date: "2026-11-09" },
      { kind: "ptm", date: "2026-11-13" }, { kind: "openday", date: "2026-11-18", label: "Open house" }, { kind: "trip", date: "2026-11-21" },
    ],
  },
  newYearWindow: { ...base, startDate: "2026-12-21", admissionOpen: "2027-01-04", admissionClose: "2027-01-15", events: [] },
  augustWindow: { ...base, startDate: "2026-08-03", admissionOpen: undefined, admissionClose: undefined, events: [{ kind: "other", date: "2026-08-20", label: "Science exhibition" }] },
  februaryExams: { ...base, startDate: "2027-02-01", goals: ["engagement", "admissions"], admissionOpen: "2027-02-10", admissionClose: "2027-03-31" },
  minimal: {
    ...base, admissionOpen: undefined, admissionClose: undefined, events: [], achievements: [], usps: [], platforms: [], optimize: [],
    level: "preprimary", board: "play", shoot: "own", stage: "new", goals: [],
  },
};
