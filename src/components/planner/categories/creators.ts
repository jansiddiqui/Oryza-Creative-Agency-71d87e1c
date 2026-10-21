/** Planner questions for creators & personal brands. */
import { creatorOptions } from "@/data/playbooks/creators";
import { generateCreatorsPlan, type CreatorAnswers } from "@/lib/engine/creators-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyCollab = { brand: "", date: "", type: "paid" };
const emptyLaunch = { name: "", date: "" };
const emptySeries = { name: "", weekday: "1" };

export const config: PlannerConfig = {
  slug: "creators",
  label: "Creators",
  nameKey: "name",
  initial: {
    name: "", city: "", niche: "general", topic: "", goals: ["growth"], styles: ["talking"], followers: "1k", language: "Hinglish", collabs: [], launches: [], series: [],
    sebi: "", qualifications: "", kids: "none", onCamera: "all", events: [],
    stage: "active", consent: "no", shoot: "1", pkg: "growth", platforms: corePlatforms("creators"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About you and your content",
      questions: [
        { kind: "text", key: "name", label: "Your creator name", required: true, half: true },
        { kind: "text", key: "language", label: "Language", half: true },
        { kind: "choice", key: "niche", label: "Niche", name: "Niche", options: creatorOptions.niches },
        { kind: "text", key: "topic", label: "Your niche in your words", placeholder: "e.g. money basics for students" },
        { kind: "multi", key: "styles", label: "Content style", options: creatorOptions.styles },
        { kind: "choice", key: "followers", label: "Rough follower count on your main platform", name: "Followers", options: creatorOptions.followers },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: creatorOptions.goals, star: true },
      ],
    },
    {
      id: "rules",
      title: "Finance, health and family content",
      questions: [
        { kind: "text", key: "sebi", label: "SEBI registration number (only if you give investment advice)", hint: "Without it the plan keeps to financial-literacy education — no stock tips or return promises.", when: (a) => a.niche === "finance" },
        { kind: "text", key: "qualifications", label: "Your qualifications (health, fitness or beauty advice)", hint: "Advice stays within these. No medical or guaranteed-result claims.", when: (a) => a.niche === "health" },
        { kind: "choice", key: "kids", label: "Do children appear in your content?", name: "Children", options: [{ id: "none", label: "No" }, { id: "consent", label: "Yes, with a parent's consent" }] },
      ],
    },
    {
      id: "dates",
      title: "Series, collabs and launches",
      questions: [
        {
          kind: "group", key: "series", label: "Weekly series (optional)", itemLabel: "Series", max: 2, empty: emptySeries,
          fields: [
            { key: "name", label: "Series name", type: "text", placeholder: "e.g. Money Monday" },
            { key: "weekday", label: "Day", type: "choice", options: creatorOptions.weekdays },
          ],
        },
        {
          kind: "group", key: "collabs", label: "Upcoming brand collaborations (optional)", itemLabel: "Collab", max: 4, empty: emptyCollab,
          hint: "Every collaboration gets an upfront disclosure and the platform's paid-partnership tool.",
          fields: [
            { key: "brand", label: "Brand", type: "text" },
            { key: "date", label: "Posting date", type: "date" },
            { key: "type", label: "Type", type: "choice", options: creatorOptions.collabTypes },
          ],
        },
        {
          kind: "group", key: "launches", label: "Your product or course launches (optional)", itemLabel: "Launch", max: 2, empty: emptyLaunch,
          fields: [
            { key: "name", label: "What you're launching", type: "text" },
            { key: "date", label: "Launch date", type: "date" },
          ],
        },
      ],
    },
    {
      id: "presence",
      title: "Capacity and access",
      questions: [
        stageQ,
        cameraQ("Are you comfortable on camera?"),
        consent3("Consent from people featured (shout-outs, community wins)?", "Community members appear only with their permission."),
        { kind: "choice", key: "shoot", label: "How much filming time can you give?", name: "Shoot", options: shootOptions("I'll send my own clips") },
        platformsQ("creators"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as CreatorAnswers;
    return generateCreatorsPlan({
      ...withDates(a),
      collabs: a.collabs.filter((c) => c.brand.trim() && c.date),
      launches: a.launches.filter((l) => l.name.trim() && l.date),
      series: a.series.filter((s) => s.name.trim()),
      startDate,
    });
  },
};
