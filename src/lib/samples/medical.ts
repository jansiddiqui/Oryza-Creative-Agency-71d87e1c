import { generateDoctorPlan, generateHospitalPlan } from "../engine/medical-engine";

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
