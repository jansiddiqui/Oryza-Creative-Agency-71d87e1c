import { generateRealEstatePlan } from "../engine/real-estate-engine";

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
