import { generateSchoolPlan } from "./engine/school-engine";
import { generateDoctorPlan, generateHospitalPlan } from "./engine/medical-engine";
import { generateRealEstatePlan } from "./engine/real-estate-engine";
import { generatePoliticalPlan } from "./engine/political-engine";

/**
 * A fictional example school used to show what the planner produces.
 * Always labelled “sample” wherever it appears — it is not client work.
 */
export const samplePlan = generateSchoolPlan({
  name: "Sample Public School",
  city: "Kanpur",
  board: "cbse",
  level: "12",
  goals: ["admissions"],
  admissionOpen: "2026-11-02",
  admissionClose: "2026-11-20",
  events: [{ kind: "sports", date: "2026-11-05" }],
  usps: ["sports", "safety"],
  achievements: ["State-level chess winner", "Inter-school science fair winner"],
  stage: "revive",
  consent: "some",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "website"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
});

const medicalSample = {
  city: "Kanpur",
  stage: "revive" as const,
  consent: "no" as const,
  shoot: "2" as const,
  pkg: "growth" as const,
  optimize: ["instagram" as const, "gbp" as const],
  startDate: "2026-10-26",
  qualifications: "",
  awarenessDays: [],
};

/** A fictional hospital — always labelled “sample”, never presented as client work. */
export const sampleHospitalPlan = generateHospitalPlan({
  ...medicalSample,
  name: "Sample Care Hospital",
  practice: "multi",
  specialities: ["general", "diabetes", "eye"],
  doctors: "few",
  onCamera: "some",
  goals: ["camps", "footfall"],
  opd: "Mon–Sat, 9 am – 2 pm",
  emergency: "yes",
  online: "no",
  events: [{ kind: "camp", date: "2026-11-08", label: "Eye check-up camp" }],
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "youtube", "website"],
});

/** A fictional doctor — always labelled “sample”, never presented as client work. */
export const sampleDoctorPlan = generateDoctorPlan({
  ...medicalSample,
  name: "Dr. Sample",
  practice: "own",
  specialities: ["diabetes"],
  doctors: "1",
  onCamera: "all",
  goals: ["authority", "discovery"],
  opd: "Mon–Sat, 6 – 9 pm",
  emergency: "no",
  online: "yes",
  events: [{ kind: "talk", date: "2026-11-07", label: "Diabetes awareness talk" }],
  platforms: ["instagram", "whatsapp", "youtube", "gbp", "linkedin"],
});

/** A fictional builder — always labelled “sample”, never presented as client work. The RERA number is a placeholder. */
export const sampleRealEstatePlan = generateRealEstatePlan({
  name: "Sample Homes",
  city: "Kanpur",
  role: "builder",
  goals: ["visits", "trust"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "gbp", "website"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "visitday", date: "2026-11-07", label: "Site-visit weekend" }],
  projects: [
    { name: "Sample Greens", type: "apartments", location: "Kanpur", stage: "uc", rera: "SAMPLE-RERA-0000", units: "2 and 3 BHK", price: "", possession: "As declared to RERA", launch: "", booking: "2026-11-12", handover: "", sample: "yes" },
  ],
  reraSite: "",
  agentRera: "",
  amenities: ["security", "park", "power"],
  visit: "Sat–Sun, 10 am – 6 pm",
  siteAccess: "yes",
  banks: "",
  distances: [],
  offer: "",
  onCamera: "some",
});

/** A fictional representative in an election month — always labelled “sample”, never presented as client work. */
export const samplePoliticalPlan = generatePoliticalPlan({
  name: "Sample Leader",
  city: "Kanpur",
  role: "councillor",
  goals: ["connect", "grievance"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "youtube", "x"],
  optimize: ["instagram", "x"],
  startDate: "2026-10-26",
  events: [{ kind: "visit", date: "2026-11-01", label: "Ward visit" }],
  party: "",
  area: "Sample Ward",
  district: "Kanpur Nagar",
  languages: ["hindi", "english"],
  issues: ["Drainage", "Street lights"],
  meetingDay: "1",
  meetingTime: "10 am – 1 pm at the ward office",
  election: "upcoming",
  mccStart: "2026-11-05",
  pollingDate: "2026-11-19",
  pollReminder: "no",
  resultDate: "2026-11-22",
  onCamera: "all",
  team: "small",
  grievance: "office",
  grievanceContact: "Ward office (sample address)",
  work: [],
});
