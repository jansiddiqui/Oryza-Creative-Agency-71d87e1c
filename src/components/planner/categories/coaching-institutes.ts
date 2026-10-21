/** Planner questions for coaching institutes. */
import { coachingOptions } from "@/data/playbooks/coaching";
import { generateCoachingPlan, type CoachingAnswers } from "@/lib/engine/coaching-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyBatch = { name: "", course: "", start: "", timing: "", mode: "offline" };
const emptyResult = { student: "", exam: "", score: "", course: "", duration: "", paid: "", consent: "" };
const emptyExam = { name: "", date: "" };

export const config: PlannerConfig = {
  slug: "coaching-institutes",
  label: "Coaching institutes",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "jee", goals: ["admissions"], courses: ["", ""], age: "school", mode: "offline",
    batches: [{ ...emptyBatch }], demo: "", onCamera: "some", results: [], fees: "", scholarship: "", material: "no", testSeries: "no",
    exams: [], events: [], stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("coaching-institutes"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your institute",
      questions: [
        { kind: "text", key: "name", label: "Institute name", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "Type", name: "Type", options: coachingOptions.types },
        { kind: "list", key: "courses", label: "Exams or courses you teach", itemLabel: "Course", placeholder: "e.g. JEE Main Physics", max: 6 },
        { kind: "choice", key: "age", label: "Who are your students?", name: "Students", options: coachingOptions.ages },
        { kind: "choice", key: "mode", label: "How do you teach?", name: "Mode", options: coachingOptions.modes },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: coachingOptions.goals, star: true },
      ],
    },
    {
      id: "batches",
      title: "Batches, demo classes and fees",
      questions: [
        {
          kind: "group", key: "batches", label: "Batches", itemLabel: "Batch", max: 4, empty: emptyBatch,
          fields: [
            { key: "name", label: "Batch name", type: "text" },
            { key: "course", label: "Course", type: "text" },
            { key: "start", label: "Start date", type: "date" },
            { key: "timing", label: "Timings", type: "text", placeholder: "e.g. Mon–Sat, 4–7 pm" },
            { key: "mode", label: "Mode", type: "choice", options: coachingOptions.modes },
          ],
        },
        { kind: "text", key: "demo", label: "Demo-class days and times", placeholder: "e.g. Every Saturday, 11 am" },
        { kind: "text", key: "fees", label: "Fees (optional)", hint: "Exactly as you want them shown." },
        { kind: "text", key: "scholarship", label: "Scholarship (optional)", hint: "Rules exactly as you want them shown." },
        { kind: "choice", key: "material", label: "Do you provide study material?", name: "Study material", options: yesNo("Yes", "No") },
        { kind: "choice", key: "testSeries", label: "Do you run a test series?", name: "Test series", options: yesNo("Yes", "No") },
      ],
    },
    {
      id: "results",
      title: "Verified results and exam dates",
      questions: [
        {
          kind: "group", key: "results", label: "Verified results to share (optional)", itemLabel: "Result", max: 6, empty: emptyResult,
          hint: "A result is shared only when every field is filled and consent is “Yes” — otherwise the planner leaves it out.",
          fields: [
            { key: "student", label: "Student name", type: "text" },
            { key: "exam", label: "Exam", type: "text" },
            { key: "score", label: "Score or rank, exactly as you verified it", type: "text", wide: true },
            { key: "course", label: "Course the student took with you", type: "text" },
            { key: "duration", label: "Course duration", type: "text", placeholder: "e.g. 2 years" },
            { key: "paid", label: "Was it a paid course?", type: "choice", options: [{ id: "", label: "Choose" }, ...yesNo("Yes", "No")] },
            { key: "consent", label: "Written consent (a parent's if under 18)?", type: "choice", options: [{ id: "", label: "Choose" }, ...yesNo("Yes", "No")] },
          ],
        },
        {
          kind: "group", key: "exams", label: "Upcoming exam dates (optional)", itemLabel: "Exam", max: 4, empty: emptyExam,
          hint: "Countdowns carry calm revision tips — never pressure.",
          fields: [
            { key: "name", label: "Exam", type: "text" },
            { key: "date", label: "Date", type: "date" },
          ],
        },
        { kind: "events", key: "events", label: "Seminars, tests and result days", options: coachingOptions.events, defaultKind: "seminar", withLabel: "Name (optional)" },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        cameraQ("Are your teachers comfortable on camera?"),
        consent3("Written consent from students (and parents for minors) to appear?", "Without it, no student close-ups or testimonials appear. Minors only with a parent's consent."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("coaching institutes"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as CoachingAnswers;
    return generateCoachingPlan({
      ...withDates(a),
      courses: a.courses.filter((c) => c.trim()),
      batches: a.batches.filter((b) => b.name.trim()),
      results: a.results.filter((r) => r.student.trim()),
      exams: a.exams.filter((x) => x.name.trim() && x.date),
      startDate,
    });
  },
};
