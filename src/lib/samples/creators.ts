import { generateCreatorsPlan } from "../engine/creators-engine";

/**
 * A fictional food creator — always labelled “sample”, never presented as client work. Its one collaboration uses
 * a placeholder brand to show how the disclosure appears.
 */
export const sampleCreatorsPlan = generateCreatorsPlan({
  name: "Sample Creator",
  city: "Kanpur",
  niche: "food",
  topic: "quick home cooking",
  goals: ["growth", "deals"],
  styles: ["tutorial", "talking"],
  followers: "10k",
  language: "Hinglish",
  stage: "active",
  consent: "no",
  shoot: "1",
  pkg: "growth",
  platforms: ["instagram", "youtube"],
  optimize: ["instagram", "youtube"],
  startDate: "2026-10-26",
  events: [],
  collabs: [{ brand: "Sample Brand (placeholder)", date: "2026-11-05", type: "gifted" }],
  launches: [],
  series: [{ name: "10-minute Tuesdays", weekday: "2" }],
  sebi: "",
  qualifications: "",
  kids: "none",
  onCamera: "all",
});
