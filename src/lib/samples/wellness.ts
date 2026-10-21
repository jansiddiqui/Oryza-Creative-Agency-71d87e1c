import { generateWellnessPlan } from "../engine/wellness-engine";

/** A fictional unisex salon — always labelled “sample”, never presented as client work. No prices, offers or client results are shown. */
export const sampleWellnessPlan = generateWellnessPlan({
  name: "Sample Studio",
  city: "Kanpur",
  type: "unisex",
  goals: ["bookings", "trust"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "launch", date: "2026-11-06", label: "New hair-care service" }],
  services: ["Haircuts and styling", "Hair colour", "Bridal make-up"],
  timings: "Daily, 10 am – 8 pm",
  packages: "",
  classes: [],
  womenSlots: "",
  certifications: "",
  offers: [],
  onCamera: "some",
});
