import type { DoctorAnswers, HospitalAnswers } from "./medical-engine";

/** Fixed answer sets whose plans are fingerprinted in __fixtures__/medical-golden.json. */
const hospital: HospitalAnswers = {
  name: "Golden Care Hospital", city: "Kanpur", goals: ["camps", "footfall"], stage: "revive", consent: "no", shoot: "2", pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "youtube", "website"], optimize: ["instagram", "gbp"], startDate: "2026-11-02",
  practice: "multi", specialities: ["general", "eye"], doctors: "few", onCamera: "some", qualifications: "", opd: "Mon–Sat, 9 am – 2 pm",
  emergency: "yes", online: "yes", awarenessDays: [],
  events: [{ kind: "camp", date: "2026-11-12", label: "Eye check-up camp" }, { kind: "doctor", date: "2026-11-24", label: "Dr. Golden joins" }, { kind: "talk", date: "2026-11-18" }],
};
const doctor: DoctorAnswers = {
  name: "Dr. Golden", city: "Kanpur", goals: ["authority"], stage: "active", consent: "no", shoot: "1", pkg: "growth",
  platforms: ["instagram", "whatsapp", "gbp", "youtube", "linkedin"], optimize: [], startDate: "2026-11-02",
  practice: "own", specialities: ["diabetes", "general"], doctors: "1", onCamera: "all", qualifications: "MBBS, MD", opd: "Mon–Sat, 6 – 9 pm",
  emergency: "no", online: "yes", awarenessDays: [],
  events: [{ kind: "talk", date: "2026-11-10", label: "Diabetes awareness talk" }, { kind: "clinic", date: "2026-11-20" }],
};
const all = ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website", "linkedin", "x", "pinterest"] as HospitalAnswers["platforms"];

export const hospitalVariants: Record<string, HospitalAnswers> = {
  base: hospital,
  starter: { ...hospital, pkg: "starter" },
  premium: { ...hospital, pkg: "premium", consent: "yes" },
  offCamera: { ...hospital, onCamera: "none", shoot: "weekly" },
  ownPhotos: { ...hospital, shoot: "own", stage: "new" },
  allPlatforms: { ...hospital, platforms: all, optimize: all },
  september: { ...hospital, startDate: "2026-09-14", specialities: ["cardiology"], events: [], goals: ["awareness"] },
  newYear: { ...hospital, startDate: "2026-12-20", goals: ["launch"], practice: "single", doctors: "1" },
  minimal: { ...hospital, name: "", city: "", goals: [], events: [], specialities: [], platforms: [], optimize: [], opd: "", emergency: "no", online: "no" },
};
export const doctorVariants: Record<string, DoctorAnswers> = {
  base: doctor,
  starter: { ...doctor, pkg: "starter", onCamera: "none" },
  premium: { ...doctor, pkg: "premium", consent: "yes", emergency: "yes" },
  discovery: { ...doctor, goals: ["discovery", "online"], shoot: "2" },
  allPlatforms: { ...doctor, platforms: all },
  oncology: { ...doctor, specialities: ["oncology"], startDate: "2027-01-20", events: [] },
  badQuals: { ...doctor, qualifications: "MBBS, best doctor award", events: [{ kind: "camp", date: "2026-11-12", label: "Free camp" }] },
  minimal: { ...doctor, name: "", city: "", goals: [], events: [], specialities: [], platforms: [], optimize: [], opd: "", qualifications: "" },
};
