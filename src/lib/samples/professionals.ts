import { generateProfessionalsPlan } from "../engine/professionals-engine";

/**
 * A fictional Chartered Accountancy practice (strict mode) — always labelled “sample”, never presented as client
 * work. It shows no deadlines (only clients' own, verified dates are ever used), no clients and no figures.
 */
export const sampleProfessionalsPlan = generateProfessionalsPlan({
  name: "Sample & Associates",
  city: "Kanpur",
  profession: "ca",
  goals: ["awareness", "authority"],
  stage: "revive",
  consent: "no",
  shoot: "1",
  pkg: "growth",
  platforms: ["linkedin", "gbp", "instagram", "youtube"],
  optimize: ["linkedin", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "webinar", date: "2026-11-05", label: "GST basics for small businesses" }],
  areas: ["GST", "Income tax", "Company compliance"],
  experience: "",
  credentials: "",
  team: "small",
  languages: "Hindi, English",
  deadlines: [],
  clients: [],
  onCamera: "some",
});
