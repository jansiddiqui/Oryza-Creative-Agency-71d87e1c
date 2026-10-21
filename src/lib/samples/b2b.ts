import { generateB2bPlan } from "../engine/b2b-engine";

/**
 * A fictional leather-goods manufacturer — always labelled “sample”, never presented as client work. It names no
 * customers and shows no certification numbers or figures (none were provided).
 */
export const sampleB2bPlan = generateB2bPlan({
  name: "Sample Leather Works",
  city: "Kanpur",
  type: "manufacturer",
  goals: ["enquiries", "dealers"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["linkedin", "gbp", "website", "instagram", "whatsapp"],
  optimize: ["linkedin", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "fair", date: "2026-11-06", label: "Sample trade fair" }],
  products: ["Leather safety gloves", "Work boots"],
  industries: ["Construction", "Manufacturing"],
  certifications: [],
  capacity: "",
  moq: "",
  leadTime: "",
  markets: "",
  years: "",
  sustainability: "",
  customers: [],
  factory: "yes",
  staffConsent: "no",
  onCamera: "some",
});
