import type { Playbook, Template } from "@/lib/engine/types";
import { DOCTOR_APPROVES, EMERGENCY_LINE, medicalRules, withCameraRule } from "../medical";

/**
 * Doctors (personal brand) playbook v1 — written by Oryza strategists, consumed by the rule engine.
 * Variables: {doctor} {city} {speciality} {opd} {event} {quals}
 * Tags as for hospitals (cam:*, has:opd, has:online, has:emergency, consent:yes, spec:*, season:*, goal:*).
 * {quals} is exactly what the doctor typed (or empty) — the engine never writes qualifications.
 */
const A = DOCTOR_APPROVES;

const reels: Template[] = [
  { id: "DR01", format: "reel", pillar: "person", who: "Oryza shoots", note: A, title: "Meet {doctor}{quals}", hook: "Who I am, what I treat and where you can see me — in 30 seconds", shots: ["Doctor intro to camera (30 s)", "Clinic b-roll"], cta: "Book a consultation", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "DR02", format: "reel", pillar: "expertise", who: "Oryza shoots", note: A, title: "{speciality}: one common question, explained", hook: "The question patients ask most, answered in plain words", shots: ["Doctor to camera (30 s)", "Simple diagram insert"], cta: "Ask yours in the DMs", repeatable: true, boosts: ["primary:authority"] },
  { id: "DR03", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Myth vs fact", hook: "One myth I hear every week — and what's actually true", shots: ["Doctor to camera (20 s)"], cta: "Send this to someone who believes it", blockedBy: ["cam:none"], boosts: ["primary:authority"] },
  { id: "DR04", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "When to see a doctor: 3 signs", hook: "Calm, practical signs that mean it's time for a visit", shots: ["Doctor to camera (30 s)"], cta: "Book a consultation", boosts: ["primary:footfall"] },
  { id: "DR05", format: "reel", pillar: "person", who: "Oryza shoots", title: "Why I chose {speciality}", hook: "One honest reason, in under a minute", shots: ["Doctor to camera (40 s)", "Clinic b-roll"], cta: "Follow for more", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "DR06", format: "reel", pillar: "clinic", who: "Oryza shoots", title: "A visit to the clinic in 30 seconds", hook: "Reception → waiting → consultation: what to expect", shots: ["Clinic entrance", "Reception", "Consultation room (empty)"], cta: "See the timings in the bio", boosts: ["primary:footfall", "primary:discovery"] },
  { id: "DR07", format: "reel", pillar: "trust", who: "Oryza shoots", note: A, title: "Answering your DMs", hook: "Three questions from this month, three short answers", shots: ["Doctor to camera (45 s)"], cta: "Ask yours in the DMs", blockedBy: ["cam:none"], repeatable: true },
  { id: "DR08", format: "reel", pillar: "expertise", who: "Oryza shoots", note: A, title: "What happens in a first consultation", hook: "Step by step, so you know what to expect", shots: ["Doctor to camera", "Consultation-room b-roll (no patients)"], cta: "Book your first visit", boosts: ["primary:footfall"] },
  { id: "DR09", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Preventive tip of the week", hook: "One small habit I recommend to almost every patient", shots: ["Doctor to camera (15 s)"], cta: "Save and share", repeatable: true },
  { id: "DR10", format: "reel", pillar: "clinic", who: "Oryza shoots", title: "How to book with {doctor}", hook: "Call, WhatsApp or walk in — the simplest way to get an appointment", shots: ["Reception desk", "Phone call close-up (screen not visible)"], cta: "WhatsApp to book", boosts: ["primary:footfall", "primary:discovery"] },
  { id: "DR11", format: "reel", pillar: "clinic", who: "Oryza shoots", title: "Online consultation: how it works", hook: "Book a slot, keep your reports ready, join the video call", shots: ["Doctor at desk on a video call (screen facing away)"], cta: "WhatsApp to book an online consultation", requires: ["has:online"], boosts: ["primary:online"] },
  { id: "DR12", format: "reel", pillar: "expertise", who: "Oryza shoots", note: A, title: "Your reports: what I look at first", hook: "How a doctor reads a common report — general guidance, not a diagnosis", shots: ["Doctor with a blank sample report", "Close-up of hands pointing"], cta: "Bring your reports to your visit", boosts: ["primary:authority"] },
  { id: "DR13", format: "reel", pillar: "trust", who: "Oryza shoots", title: "Five questions to ask your doctor", hook: "Make every visit more useful — save these before your next one", shots: ["Doctor to camera (30 s)"], cta: "Save this", boosts: ["primary:trust"] },
  { id: "DR14", format: "reel", pillar: "person", who: "Oryza shoots", title: "A day in my practice", hook: "Morning rounds to evening OPD — what a doctor's day looks like", shots: ["Arrival at clinic", "Preparing for OPD", "Clinic b-roll", "Evening wrap-up"], cta: "Follow for more" },
  { id: "DR15", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Heat and health: signs to act on", hook: "Staying safe in the heat — and when to see a doctor", shots: ["Doctor to camera (30 s)"], cta: "Share with your family", boosts: ["season:summer"] },
  { id: "DR16", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Monsoon care: fever and water safety", hook: "Simple steps at home, and when a fever needs a doctor", shots: ["Doctor to camera (30 s)"], cta: "Save for the season", boosts: ["season:monsoon"] },
  { id: "DR17", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Winter care: what I remind families", hook: "Warmth, movement and medicines for elders in winter", shots: ["Doctor to camera (30 s)"], cta: "Send to someone caring for a parent", boosts: ["season:winter"] },
  { id: "DR18", format: "reel", pillar: "trust", who: "Oryza shoots", faces: true, note: "Written patient consent on file before filming; no outcome or cure claims.", title: "A patient's experience, in their words", hook: "How the visit felt — never a treatment claim", shots: ["Patient interview (written consent)"], cta: "Book a consultation", requires: ["consent:yes"] },
  { id: "DR19", format: "reel", pillar: "expertise", who: "Oryza shoots", note: A, title: "Medicines: one mistake to avoid", hook: "A common habit with medicines — and what to do instead", shots: ["Doctor to camera (20 s)"], cta: "Share with family", boosts: ["primary:authority"] },
  { id: "DR20", format: "reel", pillar: "person", who: "Oryza shoots", title: "How I keep learning", hook: "Journals, conferences, teaching — how a doctor stays up to date", shots: ["Doctor reading at desk", "Doctor to camera (20 s)"], cta: "Follow for more", boosts: ["primary:authority"] },
  { id: "DR21", format: "reel", pillar: "awareness", who: "Oryza edits", note: A, title: "{event}: highlights and takeaways", hook: "The day in 30 seconds — no identifiable patients", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "DR22", format: "reel", pillar: "clinic", who: "Oryza shoots", title: "Now open: {event}", hook: "What's new, timings and how to book", shots: ["New clinic or service walkthrough", "Doctor to camera"], cta: "WhatsApp to book", pinnedOnly: true, repeatable: true },
  { id: "DR24", format: "reel", pillar: "expertise", who: "Oryza edits", note: A, title: "Explained in 30 seconds: {speciality}", hook: "A designed explainer with {doctor}'s voice-over — one question, one clear answer", cta: "Save and share", repeatable: true, boosts: ["cam:none", "cam:some"] },
  { id: "DR25", format: "reel", pillar: "awareness", who: "Oryza edits", note: A, title: "Myth vs fact, animated", hook: "One myth, one fact — designed text with {doctor}'s voice-over", cta: "Send this to someone who believes it", repeatable: true, boosts: ["cam:none"] },
  { id: "DR26", format: "reel", pillar: "clinic", who: "Oryza shoots", title: "How the clinic stays clean and safe", hook: "Our hygiene routine between consultations, step by step", shots: ["Cleaning routine (hands, wide)", "Hand-hygiene station", "Consultation room reset"], cta: "Ask us anything about safety" },
  { id: "DR23", format: "reel", pillar: "clinic", who: "Oryza shoots", note: A, title: "When not to wait for an appointment", hook: "The situations where you should go to emergency care straight away", shots: ["Doctor to camera (30 s)"], cta: EMERGENCY_LINE, requires: ["has:emergency"] },
];

const posts: Template[] = [
  { id: "DP01", format: "post", pillar: "person", who: "Oryza designs", note: A, title: "Meet {doctor}{quals}", hook: "Speciality, where I practise and how to book — qualifications exactly as provided", cta: "Book a consultation", boosts: ["primary:trust"] },
  { id: "DP02", format: "post", pillar: "clinic", who: "Oryza designs", title: "Clinic timings and how to book", hook: "OPD: {opd}. Call, WhatsApp or walk in.", cta: "Save this", requires: ["has:opd"], boosts: ["primary:footfall", "primary:discovery"] },
  { id: "DP03", format: "post", pillar: "expertise", who: "Oryza designs", note: A, title: "{speciality}: 5 questions patients ask", hook: "Carousel — one question per slide, a plain answer on each", cta: "Save and share", repeatable: true, boosts: ["primary:authority"] },
  { id: "DP04", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Myth vs fact", hook: "Carousel — the myth, then the fact, one pair per slide", cta: "Share with someone who needs it" },
  { id: "DP05", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "When to see a doctor: 5 signs", hook: "Clear, calm signs that mean it's time for a visit", cta: "Save this", boosts: ["primary:footfall"] },
  { id: "DP06", format: "post", pillar: "clinic", who: "Oryza designs", title: "How to reach the clinic", hook: "Landmark, parking and the easiest route", cta: "Save for your visit", boosts: ["primary:discovery", "primary:footfall"] },
  { id: "DP07", format: "post", pillar: "trust", who: "Oryza designs", title: "What to bring to your consultation", hook: "Old reports, a list of medicines, your questions — a simple checklist", cta: "Save for your visit" },
  { id: "DP08", format: "post", pillar: "person", who: "Oryza designs", title: "{event} wishes from {doctor}", hook: "A warm greeting — no health claims, no promotion", pinnedOnly: true, repeatable: true },
  { id: "DP09", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "{event}: what you can do", hook: "Three practical steps from {doctor}", cta: "Share with family", pinnedOnly: true, repeatable: true },
  { id: "DP10", format: "post", pillar: "awareness", who: "Oryza designs", title: "{event}: date, place and how to register", hook: "Who should come, what to bring and how to register", cta: "Register on WhatsApp", pinnedOnly: true, repeatable: true },
  { id: "DP11", format: "post", pillar: "awareness", who: "Oryza designs", title: "Thank you for coming: {event}", hook: "Photos of the set-up and team — no identifiable patients", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "DP12", format: "post", pillar: "clinic", who: "Oryza designs", title: "Now open: {event}", hook: "What's new, timings and how to book", cta: "WhatsApp to book", pinnedOnly: true, repeatable: true },
  { id: "DP13", format: "post", pillar: "expertise", who: "Oryza designs", title: "Join me: {event}", hook: "Topic, date, time and how to join", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "DP14", format: "post", pillar: "person", who: "Oryza designs", title: "Welcome to {doctor}'s page", hook: "What I'll share here and how to reach the clinic", cta: "Follow and share", pinnedOnly: true },
  { id: "DP15", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Preventive check-ups by age", hook: "Which check-ups matter when — no packages or prices", cta: "Save this" },
  { id: "DP16", format: "post", pillar: "trust", who: "Oryza designs", title: "How I approach every consultation", hook: "Listen first, explain clearly, decide together — in my own words", cta: "Book a consultation", boosts: ["primary:trust"] },
  { id: "DP17", format: "post", pillar: "clinic", who: "Oryza designs", title: "Online consultations: book in 3 steps", hook: "How to book, what to keep ready, when to come in person", cta: "WhatsApp to book", requires: ["has:online"], boosts: ["primary:online"] },
  { id: "DP18", format: "post", pillar: "trust", who: "Oryza designs", faces: true, note: "Written patient consent on file; no outcome or cure claims.", title: "A patient's experience", hook: "Their words about the care they received — never a treatment claim", cta: "Book a consultation", requires: ["consent:yes"] },
  { id: "DP19", format: "post", pillar: "expertise", who: "Oryza designs", note: A, title: "Tip card: {speciality}", hook: "One practical tip, designed to save and share", cta: "Save this", repeatable: true },
  { id: "DP20", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Medicines: safe-use reminders", hook: "Five simple rules I repeat every day", cta: "Share with family" },
  { id: "DP21", format: "post", pillar: "trust", who: "Oryza designs", title: "Fees, follow-ups and reports: your questions", hook: "Clear answers to practical questions — no package prices", cta: "Call the clinic for details" },
  { id: "DP22", format: "post", pillar: "clinic", who: "Oryza designs", title: "Your feedback helps others find care", hook: "If your visit helped, a short honest review on Google helps others — never paid, never scripted", cta: "Leave an honest review", boosts: ["primary:discovery"] },
  { id: "DP23", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "A simple daily health routine", hook: "Sleep, water, movement, food — a printable card", cta: "Save and print" },
  { id: "DP24", format: "post", pillar: "clinic", who: "Oryza designs", title: "This week at the clinic", hook: "A collage of the week's moments — no patients", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "DP25", format: "post", pillar: "expertise", who: "Oryza designs", note: A, title: "Explained: a common test", hook: "What the test is for and how to prepare — general guidance", cta: "Save before your test", boosts: ["primary:authority"] },
];

const stories: Template[] = [
  { id: "DS01", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, title: "Poll: what should I explain next?", hook: "Two topics to choose from" },
  { id: "DS02", format: "story", pillar: "trust", who: "Oryza designs", repeatable: true, note: A, title: "Question box: ask {doctor}", hook: "Answers shared next week" },
  { id: "DS03", format: "story", pillar: "person", who: "Oryza shoots", repeatable: true, title: "Behind the scenes today", hook: "Clinic preparation, no patients" },
  { id: "DS04", format: "story", pillar: "clinic", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "DS05", format: "story", pillar: "clinic", who: "Oryza designs", repeatable: true, title: "Clinic timings: {opd}", hook: "How to book in one tap", requires: ["has:opd"] },
  { id: "DS06", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, note: A, title: "Quiz: true or false?", hook: "Answer in the next story" },
  { id: "DS07", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, note: A, title: "Tip of the day", hook: "One line, one habit" },
  { id: "DS08", format: "story", pillar: "clinic", who: "Oryza designs", repeatable: true, title: "Online consultations available today", hook: "Book in one tap", requires: ["has:online"] },
  { id: "DS09", format: "story", pillar: "clinic", who: "Oryza designs", repeatable: true, title: "Emergency? Don't wait for a reply", hook: EMERGENCY_LINE, requires: ["has:emergency"] },
  { id: "DS10", format: "story", pillar: "trust", who: "Oryza designs", repeatable: true, faces: true, title: "Thank-you messages", hook: "Reposted only with the patient's written permission", requires: ["consent:yes"] },
];

export const doctorPlaybook: Playbook = {
  category: "doctors",
  audiences: [
    { name: "People searching for a specialist nearby", share: 40, needs: "The right expertise, availability, how to book" },
    { name: "Existing and returning patients", share: 25, needs: "Clear guidance, reminders, follow-up information" },
    { name: "Families caring for someone", share: 20, needs: "Calm explanations, what to expect, when to come in" },
    { name: "Peers and referring doctors", share: 15, needs: "Clinical focus, professionalism, availability" },
  ],
  pillars: [
    { id: "expertise", name: "Expertise explained", share: 25 },
    { id: "awareness", name: "Prevention and when to see a doctor", share: 20 },
    { id: "person", name: "The doctor behind the white coat", share: 15 },
    { id: "clinic", name: "Clinic, timings and booking", share: 20 },
    { id: "trust", name: "Questions patients ask", share: 20 },
  ],
  tone: "Warm, plain-spoken and expert. Bilingual Hindi–English captions. Facts only from the doctor; never alarming, never boastful.",
  rules: [...medicalRules, "Doctors follow their medical council's guidance on publicity; Oryza flags anything that may conflict before it is published."],
  templates: [...reels, ...posts, ...stories].map(withCameraRule),
};

export const doctorOptions = {
  goals: [
    { id: "trust", label: "Patient trust" },
    { id: "authority", label: "Authority in my speciality" },
    { id: "discovery", label: "Being found on Google" },
    { id: "footfall", label: "More clinic visits" },
    { id: "online", label: "Online consultations" },
  ],
  events: [
    { id: "camp", label: "Health camp" },
    { id: "clinic", label: "New clinic or location" },
    { id: "service", label: "New service" },
    { id: "talk", label: "Talk or interview" },
    { id: "other", label: "Other event" },
  ],
} as const;
