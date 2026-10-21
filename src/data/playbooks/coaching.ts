import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Coaching institutes playbook v1 (JEE/NEET, boards tuition, government exams, skill, language and computer
 * courses) — written by Oryza strategists, consumed by the rule engine.
 * Variables: {brand} {city} {course} {courses_list} {demo} {fees} {scholarship} {event} {exam}
 * Result variables (only from complete, verified entries): {student} {r_exam} {score} {r_course} {duration} {paid_line}
 * Tags: type:*, age:minor|adult, has:demo, has:batch, has:fees, has:scholarship, has:material, has:testseries,
 * has:results, has:online, has:offline, cam:*, consent:yes, has:exam.
 */

/**
 * Wording the engine never publishes: guaranteed selection, ranks, marks or jobs, superlatives, fake seat
 * scarcity, and fear- or pressure-based messaging about exams.
 */
export const COACHING_BANNED_WORDING =
  /\b(guarantee\w*|assured|sure[- ]shot|pakka|best|no\.?\s?1|number one|india'?s top|top coaching|top institute|toppers? factory|last \d+ seats|only \d+ seats|seats? (filling|left)|limited seats|hurry|last chance|fail(s|ed|ure|ures)?|weak students?|don'?t waste|wasting|pressure|panic|scared|fear|or else|do or die|now or never)\b|100\s?%/i;

const RESULT =
  "Disclosure on the creative and caption, exactly as verified: {student} — {score} in {r_exam}; course taken: {r_course} ({duration}); {paid_line}. Written consent on file (a parent's for a minor).";
const FACT = "Facts from your faculty; you approve before publishing.";
const CONSENT = "Students appear only with written consent (a parent's for minors).";

const reels: Template[] = [
  { id: "CR01", format: "reel", pillar: "faculty", who: "Oryza shoots", title: "Meet the faculty: {course}", hook: "Who teaches, how they teach and one tip they give every batch", shots: ["Teacher intro to camera (30 s)", "Teaching at the board", "Classroom wide"], cta: "Book a demo class", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "CR02", format: "reel", pillar: "learning", who: "Oryza shoots", note: FACT, title: "{course}: one concept in 60 seconds", hook: "A short, clear explanation from our faculty — the way we teach it in class", shots: ["Teacher at the board (60 s)", "Close-up of the worked example"], cta: "Save and share with a classmate", repeatable: true, boosts: ["primary:demo", "primary:trust"] },
  { id: "CR03", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "Exam tip of the week", hook: "One practical habit for the next seven days", cta: "Save this", repeatable: true },
  { id: "CR04", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "Myth vs fact about exams", hook: "One thing students believe — and what actually helps", cta: "Send this to a friend", boosts: ["primary:trust"] },
  { id: "CR05", format: "reel", pillar: "admissions", who: "Oryza shoots", title: "Try a demo class", hook: "Demo classes: {demo}. Sit in, ask questions, decide calmly", shots: ["Demo class in progress (students with consent or from behind)", "Teacher welcoming a new student"], cta: "Book a demo class", requires: ["has:demo"], boosts: ["primary:demo", "primary:admissions"] },
  { id: "CR06", format: "reel", pillar: "campus", who: "Oryza shoots", title: "A tour of {brand}", hook: "Classrooms, library and the doubt desk — what a day here looks like", shots: ["Entrance", "Classroom", "Library or self-study area", "Doubt desk"], cta: "Visit us", requires: ["has:offline"], boosts: ["primary:admissions"] },
  { id: "CR07", format: "reel", pillar: "campus", who: "Oryza shoots", title: "The self-study room", hook: "Quiet, lit and open for long hours — where the revision happens", shots: ["Library wide (students from behind)", "Desk close-ups"], cta: "Ask about timings", requires: ["has:offline"] },
  { id: "CR08", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "A calm study routine that works", hook: "Study blocks, breaks, sleep — a realistic day, not a heroic one", cta: "Save and try it this week", boosts: ["primary:trust"] },
  { id: "CR09", format: "reel", pillar: "wellbeing", who: "Oryza edits", title: "Sleep and breaks are part of preparation", hook: "Why rest helps you remember more — a gentle reminder", cta: "Share with someone preparing" },
  { id: "CR10", format: "reel", pillar: "wellbeing", who: "Oryza shoots", title: "For parents: how to support without stress", hook: "Listen, keep routines, celebrate effort — a teacher's advice", shots: ["Teacher to camera (40 s)"], cta: "Share with another parent", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "CR11", format: "reel", pillar: "learning", who: "Oryza shoots", note: FACT, title: "Doubt clearing, live from class", hook: "One student question, one patient answer", shots: ["Doubt session (students from behind or with consent)", "Teacher explaining"], cta: "Bring your doubts to a demo class", repeatable: true },
  { id: "CR12", format: "reel", pillar: "learning", who: "Oryza edits", title: "How our test series works", hook: "Test, analysis, feedback, repeat — what you get after every test", cta: "Ask about the test series", requires: ["has:testseries"] },
  { id: "CR13", format: "reel", pillar: "learning", who: "Oryza edits", title: "Inside our study material", hook: "Notes, practice sheets and revision cards — a quick flip-through", cta: "Ask for a sample", requires: ["has:material"] },
  { id: "CR14", format: "reel", pillar: "results", who: "Oryza shoots", faces: true, note: CONSENT, title: "An alumni story", hook: "Where they are now and what helped — in their own words, no score claims", shots: ["Alumni interview (written consent)"], cta: "Book a demo class", requires: ["consent:yes"] },
  { id: "CR15", format: "reel", pillar: "results", who: "Oryza edits", note: RESULT, title: "Verified result: {student}", hook: "{score} in {r_exam} · Course: {r_course}, {duration} · {paid_line}", cta: "Follow for exam tips", requires: ["has:results"] },
  { id: "CR16", format: "reel", pillar: "admissions", who: "Oryza edits", title: "Batch timings and how to join", hook: "Batches, timings and the next start date — as you provide", cta: "WhatsApp to enquire", requires: ["has:batch"], boosts: ["primary:admissions"] },
  { id: "CR17", format: "reel", pillar: "learning", who: "Oryza edits", title: "How our online classes work", hook: "Live class, recording, doubt support — what to expect", cta: "Book an online demo", requires: ["has:online"] },
  { id: "CR18", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "After {course}: what next?", hook: "Paths students usually take — general guidance, no promises", cta: "Ask our counsellor", boosts: ["primary:trust"] },
  { id: "CR19", format: "reel", pillar: "learning", who: "Oryza shoots", note: FACT, title: "One shortcut, explained", hook: "A method our faculty uses — and when not to use it", shots: ["Teacher at the board (40 s)"], cta: "Save this", repeatable: true, blockedBy: ["cam:none"] },
  { id: "CR20", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "A previous-year question, solved calmly", hook: "Read, plan, solve, check — step by step", cta: "Try the next one yourself", repeatable: true },
  { id: "CR21", format: "reel", pillar: "learning", who: "Oryza edits", note: FACT, title: "How to read your syllabus", hook: "Turn the syllabus into a weekly plan you can actually follow", cta: "Save this" },
  { id: "CR22", format: "reel", pillar: "wellbeing", who: "Oryza edits", title: "Time management for students", hook: "Small blocks, clear goals, honest breaks", cta: "Save and share" },
  { id: "CR23", format: "reel", pillar: "faculty", who: "Oryza shoots", title: "Ask a teacher", hook: "Three student questions, three short answers", shots: ["Teacher to camera (45 s)"], cta: "Send your question", blockedBy: ["cam:none"], repeatable: true },
  { id: "CR24", format: "reel", pillar: "admissions", who: "Oryza edits", title: "New batch: {event}", hook: "Course, start date, timings and mode — as you provide", cta: "Book a demo class", pinnedOnly: true, repeatable: true },
  { id: "CR25", format: "reel", pillar: "campus", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds — students only with consent", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
];

const posts: Template[] = [
  { id: "CP01", format: "post", pillar: "admissions", who: "Oryza designs", title: "Courses at {brand}", hook: "{courses_list} — who each course is for, in plain words", cta: "WhatsApp to enquire", boosts: ["primary:admissions"] },
  { id: "CP02", format: "post", pillar: "admissions", who: "Oryza designs", title: "Batches and timings", hook: "Start dates, timings and mode — exactly as you provide", cta: "WhatsApp to enquire", requires: ["has:batch"], boosts: ["primary:admissions"] },
  { id: "CP03", format: "post", pillar: "admissions", who: "Oryza designs", title: "Book a demo class", hook: "Demo classes: {demo}", cta: "Book a demo class", requires: ["has:demo"], repeatable: true, boosts: ["primary:demo"] },
  { id: "CP04", format: "post", pillar: "admissions", who: "Oryza designs", note: "Fees exactly as you provided them.", title: "Fees and what's included", hook: "{fees}", cta: "Ask for the fee sheet", requires: ["has:fees"] },
  { id: "CP05", format: "post", pillar: "admissions", who: "Oryza designs", note: "Scholarship rules exactly as you provided them.", title: "Scholarships", hook: "{scholarship}", cta: "Ask how to apply", requires: ["has:scholarship"] },
  { id: "CP06", format: "post", pillar: "faculty", who: "Oryza designs", title: "Meet our faculty", hook: "One teacher per slide — subject and experience as you provide", cta: "Book a demo class", boosts: ["primary:trust"] },
  { id: "CP07", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "{course}: 5 important topics", hook: "A carousel — what to revise first and why", cta: "Save this", repeatable: true },
  { id: "CP08", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "Myth vs fact", hook: "One myth per slide, the fact on the next", cta: "Share with a classmate" },
  { id: "CP09", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "A weekly revision timetable", hook: "A printable plan with breaks built in", cta: "Save and print" },
  { id: "CP10", format: "post", pillar: "wellbeing", who: "Oryza designs", title: "It's okay to take a break", hook: "Rest, movement, sleep — they are part of preparation", cta: "Share with someone preparing" },
  { id: "CP11", format: "post", pillar: "wellbeing", who: "Oryza designs", title: "For parents: five ways to help", hook: "Routines, calm conversations, effort over outcome", cta: "Share with another parent", boosts: ["primary:trust"] },
  { id: "CP12", format: "post", pillar: "results", who: "Oryza designs", note: RESULT, title: "Verified result: {student}", hook: "{score} in {r_exam} · Course: {r_course}, {duration} · {paid_line}", cta: "Book a demo class", requires: ["has:results"], boosts: ["primary:results"] },
  { id: "CP13", format: "post", pillar: "campus", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting for our students and teachers", pinnedOnly: true, repeatable: true },
  { id: "CP14", format: "post", pillar: "admissions", who: "Oryza designs", title: "New batch starts: {event}", hook: "Course, start date, timings and mode — as you provide", cta: "Book a demo class", pinnedOnly: true, repeatable: true },
  { id: "CP15", format: "post", pillar: "admissions", who: "Oryza designs", title: "Demo classes before {event}", hook: "Sit in on a class before the batch starts: {demo}", cta: "Book a demo class", pinnedOnly: true, repeatable: true },
  { id: "CP16", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "{exam}: a calm 10-day revision plan", hook: "What to revise each day, with rest built in", cta: "Save this", pinnedOnly: true, repeatable: true },
  { id: "CP17", format: "post", pillar: "learning", who: "Oryza designs", title: "{exam} tomorrow: what to carry", hook: "Admit card, ID, stationery, water — and a good night's sleep", cta: "Share with a classmate", pinnedOnly: true, repeatable: true },
  { id: "CP18", format: "post", pillar: "campus", who: "Oryza designs", title: "Join us: {event}", hook: "Date, time, place and how to register", cta: "WhatsApp to register", pinnedOnly: true, repeatable: true },
  { id: "CP19", format: "post", pillar: "campus", who: "Oryza designs", title: "This week at {brand}", hook: "Classes, doubt sessions and tests from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "CP20", format: "post", pillar: "learning", who: "Oryza designs", title: "How to use our test analysis", hook: "Read your report, find patterns, plan the next week", cta: "Ask about the test series", requires: ["has:testseries"] },
  { id: "CP21", format: "post", pillar: "learning", who: "Oryza designs", title: "Online or classroom?", hook: "How each mode works at {brand} — choose what suits you", cta: "Book a demo class", requires: ["has:online", "has:offline"] },
  { id: "CP22", format: "post", pillar: "results", who: "Oryza designs", faces: true, note: CONSENT, title: "A student's words", hook: "What helped them prepare — never a score or selection claim", cta: "Book a demo class", requires: ["consent:yes"] },
  { id: "CP23", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "Formula / rule card: {course}", hook: "One card to save and revise", cta: "Save this", repeatable: true },
  { id: "CP24", format: "post", pillar: "campus", who: "Oryza designs", title: "How to reach {brand}", hook: "Landmark, timings and how to visit", cta: "Save the location", requires: ["has:offline"], boosts: ["primary:admissions"] },
  { id: "CP25", format: "post", pillar: "faculty", who: "Oryza designs", title: "How we teach", hook: "Concept first, practice next, doubts always — our approach in four steps", cta: "Book a demo class" },
  { id: "CP26", format: "post", pillar: "learning", who: "Oryza designs", note: FACT, title: "Exam-day checklist", hook: "Sleep, breakfast, documents, time plan — calm and simple", cta: "Save this" },
];

const stories: Template[] = [
  { id: "CS01", format: "story", pillar: "learning", who: "Oryza designs", repeatable: true, title: "Poll: which topic should we explain next?", hook: "Two topics to choose from" },
  { id: "CS02", format: "story", pillar: "faculty", who: "Oryza designs", repeatable: true, title: "Question box: ask our faculty", hook: "Answers shared this week" },
  { id: "CS03", format: "story", pillar: "campus", who: "Oryza shoots", repeatable: true, title: "In class today", hook: "Quick clips — students from behind or with consent" },
  { id: "CS04", format: "story", pillar: "admissions", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "CS05", format: "story", pillar: "admissions", who: "Oryza designs", repeatable: true, title: "Demo classes: {demo}", hook: "Tap to book", requires: ["has:demo"] },
  { id: "CS06", format: "story", pillar: "learning", who: "Oryza designs", repeatable: true, title: "Quiz: one question", hook: "Answer in the next story" },
  { id: "CS07", format: "story", pillar: "learning", who: "Oryza designs", repeatable: true, title: "Tip of the day", hook: "One small habit" },
  { id: "CS08", format: "story", pillar: "wellbeing", who: "Oryza designs", repeatable: true, title: "Check-in: how are you feeling about studies?", hook: "Emoji slider — no judgement" },
  { id: "CS09", format: "story", pillar: "results", who: "Oryza designs", repeatable: true, faces: true, title: "Messages from students", hook: "Reposted only with written permission", requires: ["consent:yes"] },
  { id: "CS10", format: "story", pillar: "learning", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "{exam} in a few days", hook: "Sleep well, revise light, you've got this" },
];

export const coachingRules = [
  "No guaranteed selection, rank, marks or job, no “100% results” and no “best”, “No.1” or “India's top” claims.",
  "Every result post needs the student's written consent (a parent's for minors), the score or rank exactly as you verified it, the course the student actually took and its duration, and whether it was a paid course — a result missing any of these is never scheduled.",
  "No fear-based or pressure content about exams; a calm, mental-health-friendly tone; no student is ever shamed.",
  "Fees and scholarships only as you provide them; no fake “last 5 seats”.",
  "Minor students' faces only with a parent's written consent.",
  "This is guidance, not legal advice — it follows the CCPA guidelines on misleading advertisements in the coaching sector, and you must confirm every claim before publishing.",
];

export const coachingPlaybook: Playbook = {
  category: "coaching-institutes",
  audiences: [
    { name: "Students choosing a course or batch", share: 40, needs: "Clarity on courses, faculty, timings, a demo before deciding" },
    { name: "Parents who decide and pay", share: 35, needs: "Trust, transparency on fees and results, a calm environment" },
    { name: "Current students", share: 15, needs: "Tips, tests, doubt support, motivation without stress" },
    { name: "Alumni and the local community", share: 10, needs: "Recognition, updates, referrals" },
  ],
  pillars: [
    { id: "learning", name: "Concepts, tips and study help", share: 35 },
    { id: "faculty", name: "Faculty and how we teach", share: 15 },
    { id: "admissions", name: "Courses, batches and demo classes", share: 20 },
    { id: "results", name: "Verified results and alumni", share: 10 },
    { id: "campus", name: "Campus life", share: 10 },
    { id: "wellbeing", name: "Wellbeing and parents", share: 10 },
  ],
  tone: "Encouraging, clear and calm. Bilingual Hindi–English captions. Effort over outcome; never fear, never pressure.",
  rules: coachingRules,
  templates: [...reels, ...posts, ...stories],
};

export const coachingOptions = {
  types: [
    { id: "jee", label: "JEE / NEET" },
    { id: "boards", label: "Board exams / school tuition" },
    { id: "govt", label: "Government exams" },
    { id: "skill", label: "Skill courses" },
    { id: "language", label: "Language courses" },
    { id: "computer", label: "Computer courses" },
  ],
  goals: [
    { id: "admissions", label: "Admissions for a batch" },
    { id: "demo", label: "Demo-class sign-ups" },
    { id: "trust", label: "Trust with parents" },
    { id: "results", label: "Results visibility" },
    { id: "launch", label: "New course launch" },
  ],
  ages: [
    { id: "school", label: "School students (under 18)" },
    { id: "college", label: "College students and adults" },
    { id: "mixed", label: "Both" },
  ],
  modes: [
    { id: "offline", label: "Classroom" },
    { id: "online", label: "Online" },
    { id: "hybrid", label: "Both" },
  ],
  events: [
    { id: "seminar", label: "Career seminar or parent orientation" },
    { id: "test", label: "Scholarship or admission test" },
    { id: "results", label: "Result day (with verified results)" },
    { id: "launch", label: "New course launch" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Fixed-date days for coaching (Teachers' Day comes from the national calendar). */
export const coachingDays = [{ md: "01-12", name: "National Youth Day" }];
