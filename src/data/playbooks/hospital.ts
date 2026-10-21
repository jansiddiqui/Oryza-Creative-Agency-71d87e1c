import type { Playbook, Template } from "@/lib/engine/types";
import { DOCTOR_APPROVES, EMERGENCY_LINE, medicalRules, withCameraRule } from "../medical";

/**
 * Hospitals & clinics playbook v1 — written by Oryza strategists, consumed by the rule engine.
 * Variables: {name} {city} {speciality} {opd} {event}
 * Tags: practice:multi|clinic|single, doctors:1|few|many, cam:all|some|one|none, has:opd, has:emergency,
 * has:online, has:event, consent:yes, spec:<id>, season:summer|monsoon|winter, goal:*, primary:*.
 * Every template with medical information carries the doctor-approval note.
 */
const A = DOCTOR_APPROVES;

const reels: Template[] = [
  { id: "HR01", format: "reel", pillar: "doctors", who: "Oryza shoots", note: A, title: "Meet our {speciality} team", hook: "One doctor, three quick answers: what the department treats, when to come, one everyday tip", shots: ["Doctor intro to camera (30 s)", "Doctor with the team in the department", "Department b-roll"], cta: "Book an OPD visit", blockedBy: ["cam:none"], boosts: ["primary:trust", "primary:launch"] },
  { id: "HR02", format: "reel", pillar: "access", who: "Oryza shoots", title: "A day in our OPD", hook: "Registration → waiting area → consultation → pharmacy, in 30 seconds", shots: ["Registration desk (no patient faces)", "Waiting area, wide", "Corridor walk-through", "Pharmacy counter (no labels in focus)"], cta: "See our OPD timings in the bio", boosts: ["primary:footfall"] },
  { id: "HR03", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Myth vs fact", hook: "One common health myth, answered by our doctor in 20 seconds", shots: ["Doctor to camera (20 s)"], cta: "Send this to someone who believes it", blockedBy: ["cam:none"], boosts: ["primary:awareness"] },
  { id: "HR04", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "When to see a {speciality} doctor", hook: "Three signs it's time to book a visit — calm, clear and practical", shots: ["Doctor to camera (30 s)", "Department b-roll"], cta: "Book a consultation", boosts: ["primary:awareness", "primary:footfall"] },
  { id: "HR05", format: "reel", pillar: "facility", who: "Oryza shoots", title: "How we keep our wards and theatres clean", hook: "Our cleaning and sterilisation routine, step by step", shots: ["Housekeeping routine (hands, wide)", "Sterilisation area", "Hand-hygiene station"], cta: "Ask us anything about safety", boosts: ["primary:trust"] },
  { id: "HR06", format: "reel", pillar: "facility", who: "Oryza shoots", title: "Facility tour: one department in 30 seconds", hook: "What to expect when you walk in — so the first visit feels familiar", shots: ["Department walkthrough", "Waiting area", "Consultation room (empty)"], cta: "Save before your visit" },
  { id: "HR07", format: "reel", pillar: "doctors", who: "Oryza shoots", title: "Why I became a doctor", hook: "One doctor, one honest reason, one sentence", shots: ["Doctor one-line answer to camera"], cta: "Follow to meet our team", blockedBy: ["cam:none"] },
  { id: "HR08", format: "reel", pillar: "community", who: "Oryza shoots", title: "Our nurses at work", hook: "A thank-you to the people who are there through every shift", shots: ["Nursing station (staff consent)", "Shift handover, hands only", "Ward corridor"], cta: "Thank a nurse in the comments" },
  { id: "HR09", format: "reel", pillar: "access", who: "Oryza shoots", title: "How to book an appointment in 3 steps", hook: "Phone, WhatsApp or walk-in — the simplest way to see our doctors", shots: ["Reception desk", "Phone call close-up (screen not visible)", "Corridor b-roll"], cta: "WhatsApp us to book", boosts: ["primary:footfall"] },
  { id: "HR10", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Doctor answers your question", hook: "Picked from this month's DMs — one question, one clear answer", shots: ["Doctor to camera (30 s)"], cta: "Ask yours in the DMs", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "HR11", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Preventive tip of the week", hook: "One small habit our doctors want you to start this week", shots: ["Doctor to camera (15 s)", "Simple demonstration b-roll"], cta: "Save and share", repeatable: true },
  { id: "HR12", format: "reel", pillar: "access", who: "Oryza shoots", note: A, title: "What to do in a medical emergency", hook: "Call first, then come — what our emergency team needs you to know", shots: ["Emergency entrance (no patients)", "Ambulance bay", "Doctor to camera"], cta: EMERGENCY_LINE, requires: ["has:emergency"] },
  { id: "HR13", format: "reel", pillar: "doctors", who: "Oryza shoots", note: A, title: "Welcome: {event}", hook: "Speciality, OPD days and how to book — qualifications exactly as provided", shots: ["New doctor to camera", "Department b-roll"], cta: "Book a consultation", pinnedOnly: true, repeatable: true },
  { id: "HR14", format: "reel", pillar: "doctors", who: "Oryza shoots", note: A, title: "Now open: {event}", hook: "What the new service is for, OPD days and how to book", shots: ["Department walkthrough", "Lead doctor to camera"], cta: "WhatsApp us to book", pinnedOnly: true, repeatable: true },
  { id: "HR15", format: "reel", pillar: "community", who: "Oryza edits", title: "{event} highlights", hook: "The day in 30 seconds — the team at work, no identifiable patients", cta: "Follow for the next camp dates", pinnedOnly: true, repeatable: true },
  { id: "HR16", format: "reel", pillar: "community", who: "Oryza edits", note: A, title: "{event}: three takeaways", hook: "The key points from the talk, in our doctor's words", cta: "Share with someone who should know", pinnedOnly: true, repeatable: true },
  { id: "HR17", format: "reel", pillar: "facility", who: "Oryza shoots", title: "Five moments of hand hygiene", hook: "Shown by our nurses — the routine behind every patient visit", shots: ["Hand-hygiene demonstration (hands)", "Ward hand-rub station"], cta: "Share with someone caring for a patient" },
  { id: "HR18", format: "reel", pillar: "access", who: "Oryza shoots", title: "How to reach us and where to park", hook: "From the main road to our reception in 20 seconds", shots: ["Drive-in from the main road", "Parking", "Entrance and reception"], cta: "Save for your visit", boosts: ["primary:footfall"] },
  { id: "HR19", format: "reel", pillar: "doctors", who: "Oryza shoots", title: "A minute with our nursing head", hook: "What good care looks like on a busy day", shots: ["Nursing head to camera", "Ward b-roll"], cta: "Follow for more from our team", blockedBy: ["practice:single"] },
  { id: "HR20", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Heat and health: signs to act on", hook: "Our doctor on staying safe in the heat — and when to come in", shots: ["Doctor to camera (30 s)"], cta: "Share with your family", boosts: ["season:summer"] },
  { id: "HR21", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Monsoon care: water and mosquito safety", hook: "Simple steps at home, and when a fever needs a doctor", shots: ["Doctor to camera (30 s)", "Home-care b-roll"], cta: "Save for the season", boosts: ["season:monsoon"] },
  { id: "HR22", format: "reel", pillar: "awareness", who: "Oryza shoots", note: A, title: "Winter care for elders", hook: "Warmth, movement and medicines — what our doctors remind families", shots: ["Doctor to camera (30 s)"], cta: "Send to someone caring for a parent", boosts: ["season:winter"] },
  { id: "HR23", format: "reel", pillar: "facility", who: "Oryza shoots", title: "Lab and pharmacy: what to expect", hook: "Sample collection, report timings and pharmacy hours — explained", shots: ["Lab sample area (no patients)", "Pharmacy counter"], cta: "Ask about report timings" },
  { id: "HR24", format: "reel", pillar: "doctors", who: "Oryza shoots", faces: true, note: "Written patient consent on file before filming; no outcome or cure claims.", title: "A patient's experience, in their words", hook: "How the visit felt — care, clarity, the team — never a treatment claim", shots: ["Patient interview (written consent)"], cta: "Book a consultation", requires: ["consent:yes"] },
  { id: "HR26", format: "reel", pillar: "awareness", who: "Oryza edits", note: A, title: "Explained in 30 seconds: {speciality}", hook: "A designed explainer with the doctor's voice-over — one question, one clear answer", cta: "Save and share", repeatable: true, boosts: ["cam:none", "cam:some"] },
  { id: "HR27", format: "reel", pillar: "facility", who: "Oryza edits", title: "Our team's hands at work", hook: "Care in close-up — hands, equipment and routine, no faces", cta: "Follow for more", repeatable: true, boosts: ["cam:none"] },
  { id: "HR25", format: "reel", pillar: "access", who: "Oryza shoots", title: "Online consultation: how it works", hook: "Book, get a time slot, join the video call — three steps", shots: ["Doctor at desk on a video call (screen facing away)"], cta: "WhatsApp us to book an online consultation", requires: ["has:online"], boosts: ["primary:footfall"] },
];

const posts: Template[] = [
  { id: "HP01", format: "post", pillar: "access", who: "Oryza designs", title: "OPD timings and how to book", hook: "OPD: {opd}. Call, WhatsApp or walk in.", cta: "Save this", requires: ["has:opd"], boosts: ["primary:footfall"] },
  { id: "HP02", format: "post", pillar: "doctors", who: "Oryza designs", note: A, title: "Meet our doctors", hook: "Carousel: one doctor per slide — speciality and OPD days, qualifications exactly as provided", cta: "Book a consultation", blockedBy: ["doctors:1"], boosts: ["primary:trust"] },
  { id: "HP03", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Myth vs fact: {speciality}", hook: "Carousel — one myth per slide, the fact on the next", cta: "Save and share" },
  { id: "HP04", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "When to see a doctor: 5 signs", hook: "Clear, calm signs that mean it's time for a visit", cta: "Save this", boosts: ["primary:awareness"] },
  { id: "HP05", format: "post", pillar: "facility", who: "Oryza designs", title: "{name} at a glance", hook: "Departments, facilities and services in one clean carousel", cta: "Save before your visit", boosts: ["primary:trust"] },
  { id: "HP06", format: "post", pillar: "access", who: "Oryza designs", note: A, title: "Our departments and what they treat", hook: "One department per slide, in plain words", cta: "Find the right department", blockedBy: ["practice:single"] },
  { id: "HP07", format: "post", pillar: "community", who: "Oryza designs", title: "{event} wishes from {name}", hook: "A warm greeting — no health claims, no promotion", pinnedOnly: true, repeatable: true },
  { id: "HP08", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "{event}: what you can do", hook: "Three practical steps, approved by our doctors", cta: "Share with family", pinnedOnly: true, repeatable: true },
  { id: "HP09", format: "post", pillar: "community", who: "Oryza designs", title: "{event}: how to register", hook: "Date, time, place, who should come, what to bring and how to register", cta: "Register on WhatsApp", pinnedOnly: true, repeatable: true },
  { id: "HP10", format: "post", pillar: "community", who: "Oryza designs", title: "Thank you for coming: {event}", hook: "Photos of the team and the set-up — no identifiable patients", cta: "Follow for the next camp dates", pinnedOnly: true, repeatable: true },
  { id: "HP11", format: "post", pillar: "doctors", who: "Oryza designs", note: A, title: "Welcome: {event}", hook: "Speciality, OPD days and how to book — qualifications exactly as provided", cta: "Book a consultation", pinnedOnly: true, repeatable: true },
  { id: "HP12", format: "post", pillar: "doctors", who: "Oryza designs", note: A, title: "Now open: {event}", hook: "What the service is for, who it helps, OPD days and booking", cta: "WhatsApp us to book", pinnedOnly: true, repeatable: true },
  { id: "HP13", format: "post", pillar: "community", who: "Oryza designs", title: "Join our awareness talk: {event}", hook: "Topic, speaker, date, time and how to join", cta: "Register on WhatsApp", pinnedOnly: true, repeatable: true },
  { id: "HP14", format: "post", pillar: "access", who: "Oryza designs", title: "Welcome to {name} on Instagram", hook: "Who we are, what we'll share here and how to reach us", cta: "Follow and share", pinnedOnly: true },
  { id: "HP15", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Preventive check-ups: who needs which", hook: "By age group, in plain words — no packages or prices", cta: "Save this", boosts: ["primary:awareness"] },
  { id: "HP16", format: "post", pillar: "facility", who: "Oryza designs", title: "How we keep you safe", hook: "Hygiene, fire safety and trained staff — one slide each", cta: "Ask us anything", boosts: ["primary:trust"] },
  { id: "HP17", format: "post", pillar: "access", who: "Oryza designs", title: "What to bring to your first visit", hook: "ID, old reports, a list of medicines — a simple checklist", cta: "Save for your visit", boosts: ["primary:footfall"] },
  { id: "HP18", format: "post", pillar: "access", who: "Oryza designs", note: A, title: "Emergency: what to do first", hook: "Calm steps for the first minutes, from our emergency team", cta: EMERGENCY_LINE, requires: ["has:emergency"] },
  { id: "HP19", format: "post", pillar: "community", who: "Oryza designs", title: "Thank you, nurses", hook: "The team behind every shift — names and faces only with staff consent", cta: "Say thank you in the comments" },
  { id: "HP20", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Doctor's answer: question of the week", hook: "A real question from our DMs, answered simply", cta: "Ask yours in the DMs", repeatable: true },
  { id: "HP21", format: "post", pillar: "access", who: "Oryza designs", title: "Insurance and payment: your questions answered", hook: "What patients ask at reception — no package prices", cta: "Call us for details", boosts: ["primary:footfall"], blockedBy: ["practice:single"] },
  { id: "HP22", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "Medicines: 5 safe-use reminders", hook: "Simple rules our doctors repeat every day", cta: "Share with family" },
  { id: "HP23", format: "post", pillar: "facility", who: "Oryza designs", title: "The team behind the scenes", hook: "Lab, pharmacy and housekeeping — the people who keep care running", cta: "Thank them in the comments" },
  { id: "HP24", format: "post", pillar: "awareness", who: "Oryza designs", note: A, title: "A simple healthy plate", hook: "An everyday Indian thali, balanced — a guide from our doctors", cta: "Save for your next meal", boosts: ["spec:diabetes", "spec:general"] },
  { id: "HP25", format: "post", pillar: "access", who: "Oryza designs", title: "Online consultations: book in 3 steps", hook: "How to book, what you need and when to come in person", cta: "WhatsApp us to book", requires: ["has:online"] },
  { id: "HP26", format: "post", pillar: "doctors", who: "Oryza designs", faces: true, note: "Written patient consent on file; no outcome or cure claims.", title: "A patient's experience", hook: "Their words about the care they received — never a treatment claim", cta: "Book a consultation", requires: ["consent:yes"] },
  { id: "HP27", format: "post", pillar: "community", who: "Oryza designs", title: "Our community work this month", hook: "Camps, talks and awareness drives — what the team did", cta: "Follow for the next one", requires: ["has:event"] },
  { id: "HP28", format: "post", pillar: "facility", who: "Oryza designs", title: "This week at {name}", hook: "A collage of the week's team moments", cta: "Follow for more", repeatable: true, minDay: 7 },
];

const stories: Template[] = [
  { id: "HS01", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, title: "Poll: which topic should our doctor explain next?", hook: "Two topics to choose from" },
  { id: "HS02", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, note: A, title: "Question box: ask our doctors", hook: "Answers shared next week" },
  { id: "HS03", format: "story", pillar: "facility", who: "Oryza shoots", repeatable: true, title: "Behind the scenes today", hook: "Team preparation, no patients" },
  { id: "HS04", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "HS05", format: "story", pillar: "access", who: "Oryza designs", repeatable: true, title: "OPD reminder: {opd}", hook: "Timings and how to book", requires: ["has:opd"] },
  { id: "HS06", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, note: A, title: "Quiz: true or false?", hook: "Answer in the next story" },
  { id: "HS07", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, note: A, title: "Health tip of the day", hook: "One line, one habit" },
  { id: "HS08", format: "story", pillar: "awareness", who: "Oryza designs", repeatable: true, title: "Daily reminder: water, hand-washing, movement", hook: "Simple check-in sticker" },
  { id: "HS09", format: "story", pillar: "access", who: "Oryza designs", repeatable: true, title: "Emergency? Call first", hook: EMERGENCY_LINE, requires: ["has:emergency"] },
  { id: "HS10", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, faces: true, title: "Thank-you messages we received", hook: "Reposted only with the patient's written permission", requires: ["consent:yes"] },
  { id: "HS11", format: "story", pillar: "access", who: "Oryza designs", repeatable: true, title: "Online consultations available today", hook: "How to book in one tap", requires: ["has:online"] },
];

export const hospitalPlaybook: Playbook = {
  category: "hospitals-clinics",
  audiences: [
    { name: "Patients looking for care nearby", share: 40, needs: "The right doctor, timings, how to book, what to expect" },
    { name: "Families who decide for them", share: 30, needs: "Trust, safety, clear communication, a calm experience" },
    { name: "Existing patients", share: 20, needs: "Reminders, health tips, follow-up and report information" },
    { name: "Local community and future staff", share: 10, needs: "Camps, awareness, reputation, careers" },
  ],
  pillars: [
    { id: "doctors", name: "Doctors and care teams", share: 25 },
    { id: "awareness", name: "Health awareness", share: 25 },
    { id: "facility", name: "Facilities, hygiene and safety", share: 15 },
    { id: "access", name: "OPD, booking and services", share: 20 },
    { id: "community", name: "Camps, health days and community", share: 15 },
  ],
  tone: "Calm, clear and caring. Bilingual Hindi–English captions. Facts only from the doctors; never alarming, never boastful.",
  rules: medicalRules,
  templates: [...reels, ...posts, ...stories].map(withCameraRule),
};

export const hospitalOptions = {
  goals: [
    { id: "footfall", label: "More patients and OPD footfall" },
    { id: "trust", label: "Trust and reputation" },
    { id: "awareness", label: "Health awareness" },
    { id: "launch", label: "New speciality or doctor launch" },
    { id: "camps", label: "Health camps" },
  ],
  events: [
    { id: "camp", label: "Health camp" },
    { id: "doctor", label: "New doctor joins" },
    { id: "speciality", label: "New speciality or department" },
    { id: "talk", label: "Awareness talk" },
    { id: "facility", label: "New facility or equipment" },
    { id: "other", label: "Other event" },
  ],
} as const;
