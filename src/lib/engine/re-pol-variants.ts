import type { PoliticalAnswers } from "./political-engine";
import type { Project, RealEstateAnswers } from "./real-estate-engine";

/** Fixed answer sets whose plans are fingerprinted in __fixtures__/re-pol-golden.json (recorded from Phase 2C). */
const project = (over: Partial<Project> = {}): Project => ({
  name: "Golden Greens", type: "apartments", location: "Kalyanpur", stage: "uc", rera: "GOLDEN-RERA-1", units: "2 and 3 BHK", price: "Starting from ₹45 lakh",
  possession: "December 2028", launch: "", booking: "2026-11-12", handover: "", sample: "yes", ...over,
});
const re: RealEstateAnswers = {
  name: "Golden Homes", city: "Kanpur", role: "builder", goals: ["visits"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "visitday", date: "2026-11-14", label: "Site-visit weekend" }, { kind: "festive", date: "2026-11-08", label: "Dhanteras" }],
  projects: [project(), project({ name: "Golden Heights", rera: "", stage: "prelaunch", launch: "2026-11-20", booking: "" })],
  reraSite: "rera.example", agentRera: "", amenities: ["security", "park"], visit: "Sat–Sun, 10 am – 6 pm", siteAccess: "yes",
  banks: "Golden Bank", distances: ["Railway station: 8 km", "University: 6 km"], offer: "", onCamera: "some",
};
const pol: PoliticalAnswers = {
  name: "Golden Leader", city: "Kanpur", role: "mla", goals: ["connect", "work"], stage: "active", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "x"], optimize: [], startDate: "2026-11-02",
  events: [{ kind: "youth", date: "2026-11-06", label: "Youth cricket meet" }, { kind: "inauguration", date: "2026-11-15", label: "Road opening" }],
  party: "", area: "Golden Nagar", district: "Kanpur Nagar", languages: ["hindi"], issues: ["Drainage", "Street lights", ""],
  meetingDay: "1", meetingTime: "10 am – 1 pm at the office", election: "upcoming", mccStart: "2026-11-10", pollingDate: "2026-11-25", resultDate: "2026-11-28",
  pollReminder: "no", onCamera: "all", team: "small", grievance: "both", grievanceContact: "Office, Main Road",
  work: [{ work: "Community hall repaired", date: "2026-09-12", place: "Ward 4" }, { work: "Park lights fixed", date: "2026-10-01", place: "Ward 2" }],
};
const all = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] as RealEstateAnswers["platforms"];

export const realEstateVariants: Record<string, RealEstateAnswers> = {
  base: re,
  premium: { ...re, pkg: "premium", consent: "yes", offer: "Modular kitchen included, terms apply" },
  starter: { ...re, pkg: "starter", onCamera: "none", shoot: "own" },
  ready: { ...re, goals: ["inventory"], projects: [project({ stage: "ready", booking: "", handover: "2026-11-20" })], consent: "yes" },
  broker: { ...re, role: "broker", goals: ["resale"], agentRera: "GOLDEN-AGENT-9", projects: [] },
  noRera: { ...re, projects: [project({ rera: "" })], platforms: all },
  minimal: { ...re, name: "", city: "", goals: [], events: [], projects: [], amenities: [], visit: "", distances: [], platforms: [], optimize: [] },
};
export const politicalVariants: Record<string, PoliticalAnswers> = {
  base: pol,
  reminder: { ...pol, pollReminder: "yes", pkg: "premium", consent: "yes" },
  noElection: { ...pol, election: "none", mccStart: "", pollingDate: "", resultDate: "" },
  earlyPoll: { ...pol, mccStart: "2026-11-02", pollingDate: "2026-11-04", resultDate: "", pkg: "starter" },
  campaign: { ...pol, goals: ["campaign"], onCamera: "none", shoot: "own" },
  minimal: { ...pol, name: "", area: "", district: "", city: "", goals: [], events: [], issues: [], work: [], meetingDay: "none", meetingTime: "", grievanceContact: "", platforms: [], optimize: [], election: "none", mccStart: "", pollingDate: "", resultDate: "" },
};
