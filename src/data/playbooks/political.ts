import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Political leaders playbook v1 — non-partisan: every template works for any party or an independent, and
 * no template names or assumes a party, symbol or colour.
 * Variables: {leader} {area} {district} {issue} {issues_list} {meeting} {grievance_line} {event}
 * {work} {work_date} {work_place} (client-provided facts only).
 * Tags: role:*, cam:*, team:*, has:meeting, has:issues, has:work, has:grievance, election:yes, consent:yes.
 * Day tags (checked per day): day:mcc (Model Code of Conduct in force), day:silence, day:poll.
 */

/** Wording the engine never publishes: religion or caste appeals, attacks, hate, forces, children, unverifiable superlatives. */
export const POLITICAL_BANNED_WORDING =
  /\b(caste|castes|jaati|jati|religio\w*|dharm\w*|vote bank|traitors?|anti[- ]national|deshdrohi|opponents?|rivals?|deepfake|army|soldiers?|jawans?|defence forces|armed forces|children|child|kids|bachche|guaranteed?|best|no\.?\s?1|number one|corrupt\w*|liars?|chor|scam\w*|enemy|enemies)\b|100\s?%/i;

const FACT = "Client-provided fact — verify before posting: {work} ({work_date}, {work_place}).";
const CAMPAIGN = "Campaign content. During the Model Code of Conduct, paid promotion needs MCMC pre-certification; record every expense.";
const SCHEME = "Facts only from the official scheme notice. Not during the Model Code of Conduct; never a new announcement.";
const CONSENT = "Citizen appears only with written consent; no minors.";
const NEUTRAL = "Neutral civic message — no party name, symbol, colour or appeal for votes.";

const reels: Template[] = [
  { id: "LR01", format: "reel", pillar: "connect", who: "Oryza shoots", title: "Public meeting highlights: {event}", hook: "What people raised and what happens next — no promises beyond what was decided", cta: "Come to the next meeting", pinnedOnly: true, repeatable: true },
  { id: "LR02", format: "reel", pillar: "connect", who: "Oryza shoots", title: "On the ground in {area}", hook: "A walk through the area — listening first, notes taken, follow-up dates shared", shots: ["Leader walking the lanes (residents only with consent)", "Leader listening and noting", "Leader to camera: next steps (20 s)"], cta: "Tell us about your lane", blockedBy: ["cam:none"], boosts: ["primary:connect"] },
  { id: "LR03", format: "reel", pillar: "work", who: "Oryza shoots", note: `${FACT} Before/after only with real, dated photos.`, title: "Work update: {work}", hook: "{work_place} · {work_date} — filmed as it is today", shots: ["The work site today", "Real before photo (dated) if you have one", "Leader or team member to camera (15 s)"], cta: "Report an issue in your area", requires: ["has:work"], boosts: ["primary:work"] },
  { id: "LR04", format: "reel", pillar: "voice", who: "Oryza shoots", faces: true, note: CONSENT, title: "A complaint, resolved", hook: "The citizen's words, the problem and how it was fixed — facts as provided", shots: ["Citizen interview (written consent, adults only)", "The fixed issue today"], cta: "Report an issue to the office", requires: ["consent:yes"], blockedBy: ["day:mcc"], boosts: ["primary:grievance"] },
  { id: "LR05", format: "reel", pillar: "info", who: "Oryza edits", note: SCHEME, title: "A scheme explained: who can apply and how", hook: "Eligibility, documents and where to apply — from the official notice", cta: "Share with someone eligible", blockedBy: ["day:mcc"], repeatable: true },
  { id: "LR06", format: "reel", pillar: "people", who: "Oryza shoots", title: "A day with {leader}", hook: "Morning meetings to evening visits — behind the scenes", shots: ["Morning at the office", "Meetings (no government premises during MCC)", "Visit b-roll", "Evening wrap-up to camera"], cta: "Follow for more", blockedBy: ["cam:none"], boosts: ["primary:connect", "primary:youth"] },
  { id: "LR07", format: "reel", pillar: "voice", who: "Oryza shoots", title: "Your questions, answered", hook: "Three questions from this week's messages, answered in plain words", shots: ["Leader to camera (45 s)"], cta: "Send your question", blockedBy: ["cam:none"], repeatable: true },
  { id: "LR08", format: "reel", pillar: "info", who: "Oryza shoots", title: "How to reach the office", hook: "{grievance_line}", shots: ["Office exterior and entrance", "Front desk", "Phone or WhatsApp close-up (screen not visible)"], cta: "Save this", requires: ["has:grievance"], boosts: ["primary:grievance"] },
  { id: "LR09", format: "reel", pillar: "connect", who: "Oryza edits", title: "{event}: highlights", hook: "Young people, ideas and energy — adults only in frame", cta: "Follow for the next event", pinnedOnly: true, repeatable: true },
  { id: "LR10", format: "reel", pillar: "voice", who: "Oryza shoots", note: "Residents' views only with consent; no statistics unless you provide the source.", title: "Listening: {issue}", hook: "What residents of {area} told us — and the next step", shots: ["Leader with residents (consent)", "The issue as it is today", "Leader to camera: next step (15 s)"], cta: "Add your suggestion in the comments", requires: ["has:issues"], blockedBy: ["cam:none"], repeatable: true, boosts: ["primary:connect", "primary:grievance"] },
  { id: "LR11", format: "reel", pillar: "people", who: "Oryza shoots", title: "Thank you to the team", hook: "The volunteers and office staff behind every day's work", shots: ["Team at work (consent)", "Leader thanks the team"], cta: "Join as a volunteer" },
  { id: "LR12", format: "reel", pillar: "info", who: "Oryza edits", note: NEUTRAL, title: "Check your name in the voter list", hook: "The official way, step by step", cta: "Share with a first-time voter", boosts: ["primary:youth", "primary:campaign"] },
  { id: "LR13", format: "reel", pillar: "info", who: "Oryza edits", note: NEUTRAL, title: "Polling day: please vote", hook: "Carry your ID, check your booth, vote — every vote matters", pinnedOnly: true },
  { id: "LR14", format: "reel", pillar: "people", who: "Oryza edits", note: "Neutral thank-you that works for any result. Approve the final words on result day.", title: "Thank you, {area}", hook: "To every voter, worker and official — thank you. The work continues.", pinnedOnly: true },
  { id: "LR15", format: "reel", pillar: "connect", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "LR16", format: "reel", pillar: "people", who: "Oryza shoots", note: CAMPAIGN, title: "Why I'm standing from {area}", hook: "In my own words: what I want to work on — {issues_list}", shots: ["Leader to camera (45 s)", "Area b-roll"], cta: "Share if you agree", requires: ["election:yes"], blockedBy: ["cam:none"], boosts: ["primary:campaign"] },
  { id: "LR17", format: "reel", pillar: "connect", who: "Oryza shoots", note: CAMPAIGN, title: "Door to door in {area}", hook: "Listening, lane by lane — residents only with consent", shots: ["Door-to-door walk", "Conversations (consent, adults only)"], cta: "Tell us what matters in your lane", requires: ["election:yes"], boosts: ["primary:campaign"] },
  { id: "LR18", format: "reel", pillar: "info", who: "Oryza edits", title: "Who to call: water, power and sanitation complaints", hook: "Official helplines and how to follow up — numbers as published by the departments", cta: "Save this" },
  { id: "LR19", format: "reel", pillar: "voice", who: "Oryza edits", title: "How a complaint is tracked in our office", hook: "From the day you register it to the follow-up call — step by step", cta: "Report an issue", requires: ["has:grievance"], boosts: ["primary:grievance"] },
  { id: "LR20", format: "reel", pillar: "people", who: "Oryza edits", title: "The week in {area}, in 30 seconds", hook: "Meetings, visits and follow-ups from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "LR21", format: "reel", pillar: "connect", who: "Oryza shoots", title: "Ideas from young people in {area}", hook: "College students and first-time voters share one idea each (18+, with consent)", shots: ["Short interviews (18+, written consent)", "Leader responds (20 s)"], cta: "Share your idea", blockedBy: ["cam:none"], boosts: ["primary:youth"] },
  { id: "LR22", format: "reel", pillar: "work", who: "Oryza edits", note: `${FACT} Real photos only.`, title: "Done: {work}", hook: "What was done, where and when — facts as provided", cta: "Report an issue in your area", requires: ["has:work"], boosts: ["primary:work"] },
];

const posts: Template[] = [
  { id: "LP01", format: "post", pillar: "info", who: "Oryza designs", title: "Reach the office", hook: "{grievance_line}", cta: "Save this", requires: ["has:grievance"], boosts: ["primary:grievance"] },
  { id: "LP02", format: "post", pillar: "work", who: "Oryza designs", note: `${FACT} Real photos only.`, title: "Work update: {work}", hook: "Where: {work_place} · When: {work_date}", cta: "Report an issue in your area", requires: ["has:work"], boosts: ["primary:work"] },
  { id: "LP03", format: "post", pillar: "connect", who: "Oryza designs", title: "Public meeting: {meeting}", hook: "Bring your issue in writing, with any documents", cta: "Save the date", requires: ["has:meeting"], repeatable: true, boosts: ["primary:connect", "primary:grievance"] },
  { id: "LP04", format: "post", pillar: "people", who: "Oryza designs", note: "Greeting only — no appeal for votes, no images of defence forces.", title: "{event} wishes from {leader}", hook: "A warm greeting for everyone in {area}", pinnedOnly: true, repeatable: true },
  { id: "LP05", format: "post", pillar: "connect", who: "Oryza designs", title: "Join us: {event}", hook: "Date, time, place — everyone is welcome", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "LP06", format: "post", pillar: "connect", who: "Oryza designs", title: "Thank you for coming: {event}", hook: "Photos from the day — adults only, with consent", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "LP07", format: "post", pillar: "info", who: "Oryza designs", note: SCHEME, title: "Scheme guide: eligibility and documents", hook: "One scheme per carousel, from the official notice", cta: "Share with someone eligible", blockedBy: ["day:mcc"], repeatable: true },
  { id: "LP08", format: "post", pillar: "voice", who: "Oryza designs", note: "Ask for views; no statistics unless you provide the source.", title: "{issue}: your suggestions", hook: "Tell us what would help most in your lane", cta: "Comment or WhatsApp the office", requires: ["has:issues"], repeatable: true, boosts: ["primary:connect"] },
  { id: "LP09", format: "post", pillar: "info", who: "Oryza designs", title: "How to register a complaint", hook: "What to write, what to attach and how to follow up", cta: "Save this", boosts: ["primary:grievance"] },
  { id: "LP10", format: "post", pillar: "info", who: "Oryza designs", note: NEUTRAL, title: "Voter ID: apply or correct your details", hook: "The official forms and where to submit them", cta: "Share with a first-time voter", boosts: ["primary:youth"] },
  { id: "LP11", format: "post", pillar: "info", who: "Oryza designs", note: NEUTRAL, title: "Polling day: please vote", hook: "Carry your ID, check your booth, vote", pinnedOnly: true },
  { id: "LP12", format: "post", pillar: "people", who: "Oryza designs", note: "Neutral thank-you that works for any result. Approve the final words on result day.", title: "Thank you, {area}", hook: "To every voter, worker and official — thank you. The work continues.", pinnedOnly: true },
  { id: "LP13", format: "post", pillar: "people", who: "Oryza designs", title: "About {leader}", hook: "Role, area and how to reach the office — facts only", cta: "Follow for updates", boosts: ["primary:connect"] },
  { id: "LP14", format: "post", pillar: "people", who: "Oryza designs", title: "This week in {area}", hook: "A collage of the week's meetings and visits", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "LP15", format: "post", pillar: "voice", who: "Oryza designs", faces: true, note: CONSENT, title: "Resolved: a citizen's complaint", hook: "Their words, the problem and the fix — facts as provided", cta: "Report an issue", requires: ["consent:yes"], blockedBy: ["day:mcc"] },
  { id: "LP16", format: "post", pillar: "people", who: "Oryza designs", title: "Thank you, volunteers", hook: "The people behind the work — names only with consent", cta: "Join as a volunteer" },
  { id: "LP17", format: "post", pillar: "voice", who: "Oryza designs", note: `${CAMPAIGN} Only commitments you provide; no unverified claims or statistics.`, title: "What I will work on for {area}", hook: "{issues_list}", cta: "Share if you agree", requires: ["election:yes", "has:issues"], boosts: ["primary:campaign"] },
  { id: "LP18", format: "post", pillar: "connect", who: "Oryza designs", note: CAMPAIGN, title: "Meet {leader} in your area", hook: "This week's visit schedule, lane by lane", cta: "Save the date", requires: ["election:yes"], repeatable: true, boosts: ["primary:campaign"] },
  { id: "LP19", format: "post", pillar: "info", who: "Oryza designs", title: "Useful helplines", hook: "Official numbers for water, power, sanitation and police — as published", cta: "Save this" },
  { id: "LP20", format: "post", pillar: "info", who: "Oryza designs", note: SCHEME, title: "For students: scholarships and skills", hook: "Official schemes, eligibility and deadlines — from the notices", cta: "Share with a student", blockedBy: ["day:mcc"], boosts: ["primary:youth"] },
  { id: "LP21", format: "post", pillar: "voice", who: "Oryza designs", note: "Your words, approved by you before publishing.", title: "{leader} on {issue}", hook: "A short message in your own words", cta: "Share your view", requires: ["has:issues"], repeatable: true },
  { id: "LP22", format: "post", pillar: "voice", who: "Oryza designs", title: "Your questions, answered", hook: "Five questions from this month, short answers", cta: "Send your question", repeatable: true },
  { id: "LP23", format: "post", pillar: "work", who: "Oryza designs", note: `${FACT} Before/after only with real, dated photos.`, title: "Before and now: {work}", hook: "Real photos from {work_place}", cta: "Report an issue in your area", requires: ["has:work"] },
  { id: "LP24", format: "post", pillar: "people", who: "Oryza designs", title: "Meet the office team", hook: "Who to ask for what — names and roles with consent", cta: "Save this", blockedBy: ["team:none"] },
  { id: "LP25", format: "post", pillar: "connect", who: "Oryza designs", title: "Visit schedule this month", hook: "Areas and dates for ward visits", cta: "Save the date", repeatable: true },
];

const stories: Template[] = [
  { id: "LS01", format: "story", pillar: "voice", who: "Oryza designs", repeatable: true, title: "Poll: which issue should we take up next?", hook: "Two issues to choose from" },
  { id: "LS02", format: "story", pillar: "voice", who: "Oryza designs", repeatable: true, title: "Question box: ask {leader}", hook: "Answers shared this week" },
  { id: "LS03", format: "story", pillar: "people", who: "Oryza shoots", repeatable: true, title: "Behind the scenes today", hook: "Quick clips from the day" },
  { id: "LS04", format: "story", pillar: "connect", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "LS05", format: "story", pillar: "connect", who: "Oryza designs", repeatable: true, title: "Public meeting: {meeting}", hook: "Bring your issue in writing", requires: ["has:meeting"] },
  { id: "LS06", format: "story", pillar: "info", who: "Oryza designs", repeatable: true, title: "Reach the office: {grievance_line}", hook: "Tap to message", requires: ["has:grievance"] },
  { id: "LS07", format: "story", pillar: "info", who: "Oryza designs", repeatable: true, note: NEUTRAL, title: "Quiz: how well do you know your civic rights?", hook: "Answer in the next story" },
  { id: "LS08", format: "story", pillar: "connect", who: "Oryza shoots", repeatable: true, title: "On the ground today", hook: "Where we are and who we met" },
  { id: "LS09", format: "story", pillar: "voice", who: "Oryza designs", repeatable: true, faces: true, title: "Messages from citizens", hook: "Reposted only with written permission", requires: ["consent:yes"] },
  { id: "LS10", format: "story", pillar: "work", who: "Oryza designs", repeatable: true, title: "Update: work in progress", hook: "One photo, one line — facts as provided", requires: ["has:work"] },
];

export const politicalRules = [
  "Oryza is non-partisan: party names, symbols and colours appear only from assets you provide.",
  "Never: appeals based on religion or caste, attacks on anyone's personal life, hate speech, unverified claims or statistics, manipulated or deepfake media, images of the defence forces, or children in campaign content.",
  "Work-done posts use only the facts you provide (name, date, place) and are marked “client-provided fact — verify before posting”.",
  "When you enter election dates, the plan switches to Model Code of Conduct mode from the MCC start date: no new schemes or projects announced, no government offices or resources in content, paid political ads need MCMC pre-certification, and every expense is recorded.",
  "Nothing is posted on polling day or in the 48 hours before it. A neutral voting reminder on polling day is added only if you turn it on after your election team confirms.",
  "Citizens appear only with written consent; no minors.",
  "This is guidance, not legal advice — your legal or election team must confirm before anything is published.",
];

export const politicalPlaybook: Playbook = {
  category: "political-leaders",
  audiences: [
    { name: "Residents of the constituency or ward", share: 45, needs: "Access, responsiveness, visible follow-up on local issues" },
    { name: "First-time and young voters", share: 20, needs: "Plain information, ways to take part, a leader they can reach" },
    { name: "Party workers and volunteers", share: 20, needs: "Schedules, recognition, material to share" },
    { name: "Local media and community leaders", share: 15, needs: "Facts, dates and clear statements" },
  ],
  pillars: [
    { id: "connect", name: "Constituency connect and events", share: 30 },
    { id: "work", name: "Work done (facts you provide)", share: 20 },
    { id: "voice", name: "Citizens' issues and grievances", share: 20 },
    { id: "info", name: "Civic information and schemes", share: 15 },
    { id: "people", name: "The leader and the team", share: 15 },
  ],
  tone: "Respectful, plain-spoken and local. Captions in the languages you choose. Facts only as provided; no attacks, no hype.",
  rules: politicalRules,
  templates: [...reels, ...posts, ...stories],
};

export const politicalOptions = {
  roles: [
    { id: "mla", label: "MLA" },
    { id: "mp", label: "MP" },
    { id: "councillor", label: "Councillor / parshad" },
    { id: "aspirant", label: "Aspiring candidate" },
    { id: "office", label: "Party office-bearer" },
  ],
  goals: [
    { id: "connect", label: "Constituency connect" },
    { id: "work", label: "Show work done" },
    { id: "grievance", label: "Grievance resolution visibility" },
    { id: "events", label: "Event reach" },
    { id: "youth", label: "Youth outreach" },
    { id: "campaign", label: "Election campaign" },
  ],
  languages: [
    { id: "hindi", label: "Hindi" },
    { id: "english", label: "English" },
    { id: "urdu", label: "Urdu" },
    { id: "awadhi", label: "Awadhi" },
    { id: "bhojpuri", label: "Bhojpuri" },
  ],
  events: [
    { id: "meeting", label: "Public meeting / janta darbar" },
    { id: "visit", label: "Ward or constituency visit" },
    { id: "youth", label: "Youth, sports or education event" },
    { id: "inauguration", label: "Inauguration of a completed work" },
    { id: "festival", label: "Local festival" },
    { id: "other", label: "Other event" },
  ],
  weekdays: [
    { id: "none", label: "No fixed day" },
    { id: "1", label: "Monday" },
    { id: "2", label: "Tuesday" },
    { id: "3", label: "Wednesday" },
    { id: "4", label: "Thursday" },
    { id: "5", label: "Friday" },
    { id: "6", label: "Saturday" },
    { id: "0", label: "Sunday" },
  ],
} as const;
