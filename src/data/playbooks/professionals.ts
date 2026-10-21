import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Professionals playbook v1 — one playbook, three rule modes chosen by profession:
 * - mode:law  (lawyers / advocates — Bar Council of India rules restrict advertising and solicitation)
 * - mode:ca   (Chartered Accountants and Company Secretaries — ICAI / ICSI rules restrict solicitation)
 * - mode:std  (consultants, coaches and other professionals — standard rules)
 * Templates that solicit work, show testimonials or results, or mention fees are blocked in the strict modes;
 * the engine also replaces every call-to-action in strict modes and adds the required notes.
 * Variables: {name} {city} {area} {areas_list} {experience} {profile_line} {languages} {event} {deadline}
 * {deadline_date} {client} (standard mode, with permission only).
 */

/** Wording never published in any mode: superlatives, guarantees and income claims. */
export const PRO_BANNED_WORDING =
  /\b(best|no\.?\s?1|number one|top (lawyer|advocate|ca|consultant|coach|firm)s?|guarantee\w*|assured|six[- ]figures?|6[- ]figures?|double your (income|revenue)|get rich|overnight success)\b|100\s?%|#1/i;

/** Extra wording blocked in strict modes (lawyers; CAs and CSs): solicitation, results, fees, clients, testimonials. */
export const STRICT_BLOCKED =
  /\b(book (a |your )?(consultation|call|appointment)|contact (us|me) for your|hire (us|me)|free consultation|consult (us|me)|fees?|discounts?|offers?|won|wins|winning|case won|acquitt\w*|bail granted|success rate|clients?|testimonials?|saved ₹|tax sav\w+ of|refund guaranteed|expert|specialist|leading|top)\b/i;

export const LAW_NOTE = "For general information only, not legal advice.";
export const LAW_CTA = "Follow for more legal awareness";
export const CA_NOTE = "Follow current ICAI / ICSI guidelines; confirm before posting.";
export const CA_CTA = "Follow for more compliance updates";

const STRICT = ["mode:law", "mode:ca"];
const VERIFY = "Dates and figures only as you provided them — verify against the official notification before posting.";
const PERMISSION = "Client named only with their written permission; facts approved by them.";
const CONSENT = "Testimonial only from a real client, with written consent.";

const reels: Template[] = [
  { id: "PR01", format: "reel", pillar: "explain", who: "Oryza shoots", title: "{area}, explained in 60 seconds", hook: "One concept, in plain words — what it means for you", shots: ["To camera at the desk (60 s)"], cta: "Save and share", requires: ["has:areas"], blockedBy: ["cam:none"], repeatable: true, boosts: ["primary:awareness", "primary:authority"] },
  { id: "PR02", format: "reel", pillar: "explain", who: "Oryza edits", title: "Myth vs fact: {area}", hook: "One common belief — and what's actually true", cta: "Send this to someone who believes it", requires: ["has:areas"], repeatable: true },
  { id: "PR03", format: "reel", pillar: "explain", who: "Oryza edits", title: "How the process works: {area}", hook: "The steps, in order, with the documents usually needed", cta: "Save this", requires: ["has:areas"], repeatable: true, boosts: ["primary:awareness"] },
  { id: "PR04", format: "reel", pillar: "people", who: "Oryza shoots", title: "A day in the practice", hook: "Research, meetings, paperwork — what the work really looks like", shots: ["Arriving at the office", "At the desk", "Team discussion (consent)"], cta: "Follow for more", blockedBy: ["cam:none"] },
  { id: "PR05", format: "reel", pillar: "profile", who: "Oryza shoots", title: "Meet {name}", hook: "{profile_line}", shots: ["Introduction to camera (30 s)", "Office b-roll"], cta: "Follow for more", blockedBy: ["cam:none"], boosts: ["primary:visibility"] },
  { id: "PR06", format: "reel", pillar: "explain", who: "Oryza edits", title: "Three questions people ask about {area}", hook: "Short, general answers — the questions we hear most", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PR07", format: "reel", pillar: "explain", who: "Oryza edits", title: "Know your rights: {area}", hook: "What the law says, in plain words — general information", cta: "Share with family", requires: ["mode:law", "has:areas"], repeatable: true, boosts: ["primary:awareness"] },
  { id: "PR08", format: "reel", pillar: "updates", who: "Oryza edits", note: VERIFY, title: "Deadline coming up: {deadline}", hook: "Due {deadline_date} — who it applies to and what to keep ready", cta: "Save this", pinnedOnly: true, repeatable: true },
  { id: "PR09", format: "reel", pillar: "explain", who: "Oryza edits", title: "GST basics in 60 seconds", hook: "One rule explained simply — general information", cta: "Save this", requires: ["mode:ca"] },
  { id: "PR10", format: "reel", pillar: "events", who: "Oryza edits", title: "Join the session: {event}", hook: "Topic, date, time and how to join", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "PR11", format: "reel", pillar: "events", who: "Oryza edits", title: "{event}: key takeaways", hook: "Three points from the session", cta: "Follow for more", pinnedOnly: true, repeatable: true },
  { id: "PR12", format: "reel", pillar: "people", who: "Oryza shoots", title: "Meet the team", hook: "Who does what in the practice", shots: ["Team intros (consent)"], cta: "Follow for more", requires: ["has:team"], blockedBy: ["cam:none"] },
  { id: "PR13", format: "reel", pillar: "proof", who: "Oryza edits", note: PERMISSION, title: "Case study: working with {client}", hook: "The challenge, the approach and what changed — no promises about outcomes", cta: "Book a discovery call", requires: ["has:clients"], blockedBy: STRICT, boosts: ["primary:clients"] },
  { id: "PR14", format: "reel", pillar: "proof", who: "Oryza shoots", faces: true, note: CONSENT, title: "A client's experience", hook: "In their words — real, with consent", shots: ["Client interview (written consent)"], cta: "Book a discovery call", requires: ["consent:yes"], blockedBy: STRICT },
  { id: "PR15", format: "reel", pillar: "offer", who: "Oryza edits", title: "How working together works", hook: "Discovery call, plan, sessions, review — the steps", cta: "Book a discovery call", blockedBy: STRICT, boosts: ["primary:clients"] },
  { id: "PR16", format: "reel", pillar: "explain", who: "Oryza edits", title: "Common mistakes in {area}", hook: "What people often get wrong — and the general rule", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PR17", format: "reel", pillar: "explain", who: "Oryza edits", title: "Key terms, decoded", hook: "Five terms you'll hear, explained in one line each", cta: "Save this" },
  { id: "PR18", format: "reel", pillar: "updates", who: "Oryza edits", note: VERIFY, title: "What changed this month", hook: "A factual update — sources cited, as provided", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "PR19", format: "reel", pillar: "explain", who: "Oryza edits", title: "Your documents checklist", hook: "What to keep ready for a common process", cta: "Save this" },
  { id: "PR20", format: "reel", pillar: "people", who: "Oryza edits", title: "Why I chose this work", hook: "A short, personal story — no claims", cta: "Follow for more", blockedBy: ["cam:none"] },
  { id: "PR21", format: "reel", pillar: "explain", who: "Oryza edits", title: "The Constitution, explained simply", hook: "One article, what it means for citizens", cta: "Share with family", pinnedOnly: true },
  { id: "PR22", format: "reel", pillar: "offer", who: "Oryza edits", title: "Free resource: a starter guide on {area}", hook: "A short guide you can download — no strings, no promises", cta: "Get the guide", requires: ["has:areas"], blockedBy: STRICT },
  { id: "PR23", format: "reel", pillar: "explain", who: "Oryza edits", title: "Compliance calendar basics", hook: "How to plan the year's filings — general information", cta: "Save this", requires: ["mode:ca"] },
];

const posts: Template[] = [
  { id: "PP01", format: "post", pillar: "profile", who: "Oryza designs", title: "About {name}", hook: "{profile_line}", cta: "Follow for more", boosts: ["primary:visibility"] },
  { id: "PP02", format: "post", pillar: "explain", who: "Oryza designs", title: "{area}: a quick guide", hook: "A carousel — the basics in five slides", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PP03", format: "post", pillar: "explain", who: "Oryza designs", title: "Myth vs fact", hook: "One myth per slide, the general rule on the next", cta: "Share this" },
  { id: "PP04", format: "post", pillar: "explain", who: "Oryza designs", title: "FAQ: {area}", hook: "Five questions, short general answers", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PP05", format: "post", pillar: "updates", who: "Oryza designs", note: VERIFY, title: "Reminder: {deadline}", hook: "Due {deadline_date} — what to keep ready", cta: "Save this", pinnedOnly: true, repeatable: true },
  { id: "PP06", format: "post", pillar: "updates", who: "Oryza designs", note: VERIFY, title: "Today: {deadline}", hook: "Due today, {deadline_date} — check the official portal", cta: "Save this", pinnedOnly: true, repeatable: true },
  { id: "PP07", format: "post", pillar: "events", who: "Oryza designs", title: "Join us: {event}", hook: "Topic, date, time and how to join", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "PP08", format: "post", pillar: "profile", who: "Oryza designs", title: "{event}", hook: "A short note marking the day", pinnedOnly: true, repeatable: true },
  { id: "PP09", format: "post", pillar: "people", who: "Oryza designs", title: "Inside the practice", hook: "How we work: research, review, clear communication", cta: "Follow for more" },
  { id: "PP10", format: "post", pillar: "people", who: "Oryza designs", title: "Meet the team", hook: "One person per slide — role and focus", cta: "Follow for more", requires: ["has:team"] },
  { id: "PP11", format: "post", pillar: "explain", who: "Oryza designs", title: "Process map: {area}", hook: "From first step to last, in one visual", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PP12", format: "post", pillar: "explain", who: "Oryza designs", title: "Glossary: terms you'll hear", hook: "Ten terms, one line each", cta: "Save this" },
  { id: "PP13", format: "post", pillar: "proof", who: "Oryza designs", note: PERMISSION, title: "Case study: {client}", hook: "Challenge, approach and what changed — approved by the client, no promises", cta: "Book a discovery call", requires: ["has:clients"], blockedBy: STRICT },
  { id: "PP14", format: "post", pillar: "proof", who: "Oryza designs", faces: true, note: CONSENT, title: "In a client's words", hook: "A real testimonial, shared with consent", cta: "Book a discovery call", requires: ["consent:yes"], blockedBy: STRICT },
  { id: "PP15", format: "post", pillar: "offer", who: "Oryza designs", title: "Ways to work together", hook: "Sessions, programmes and how to start — details as you provide", cta: "Book a discovery call", blockedBy: STRICT, boosts: ["primary:clients"] },
  { id: "PP16", format: "post", pillar: "explain", who: "Oryza designs", title: "Know your rights", hook: "A carousel of general information on everyday legal questions", cta: "Share with family", requires: ["mode:law"] },
  { id: "PP17", format: "post", pillar: "explain", who: "Oryza designs", title: "GST and tax basics", hook: "A carousel of general rules — dates only as verified", cta: "Save this", requires: ["mode:ca"] },
  { id: "PP18", format: "post", pillar: "updates", who: "Oryza designs", note: VERIFY, title: "Update: what's new", hook: "A factual summary — sources cited, as provided", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "PP19", format: "post", pillar: "explain", who: "Oryza designs", title: "Documents checklist", hook: "What to keep ready for a common process", cta: "Save this" },
  { id: "PP20", format: "post", pillar: "profile", who: "Oryza designs", title: "Languages we work in", hook: "{languages}", cta: "Follow for more", requires: ["has:languages"] },
  { id: "PP21", format: "post", pillar: "people", who: "Oryza designs", title: "This week at the practice", hook: "Reading, research and team moments", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "PP22", format: "post", pillar: "explain", who: "Oryza designs", title: "Common mistakes: {area}", hook: "What people often get wrong — the general rule", cta: "Save this", requires: ["has:areas"], repeatable: true },
  { id: "PP23", format: "post", pillar: "offer", who: "Oryza designs", title: "Free resource on {area}", hook: "A short guide — practical, no promises", cta: "Get the guide", requires: ["has:areas"], blockedBy: STRICT },
  { id: "PP24", format: "post", pillar: "explain", who: "Oryza designs", title: "Your questions, answered", hook: "General answers to questions from this month's comments", cta: "Ask yours in the comments", repeatable: true },
  { id: "PP25", format: "post", pillar: "profile", who: "Oryza designs", title: "Where to find us", hook: "Office address and working hours", cta: "Save this" },
];

const stories: Template[] = [
  { id: "PS01", format: "story", pillar: "explain", who: "Oryza designs", repeatable: true, title: "Poll: what should we explain next?", hook: "Two topics to choose from" },
  { id: "PS02", format: "story", pillar: "explain", who: "Oryza designs", repeatable: true, title: "Question box", hook: "General answers shared this week" },
  { id: "PS03", format: "story", pillar: "people", who: "Oryza shoots", repeatable: true, title: "At the desk today", hook: "Quick clips from the office" },
  { id: "PS04", format: "story", pillar: "updates", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "PS05", format: "story", pillar: "explain", who: "Oryza designs", repeatable: true, title: "Quiz: true or false?", hook: "Answer in the next story" },
  { id: "PS06", format: "story", pillar: "explain", who: "Oryza designs", repeatable: true, title: "Term of the day", hook: "One word, one line" },
  { id: "PS07", format: "story", pillar: "explain", who: "Oryza designs", repeatable: true, title: "Tip of the day", hook: "One practical, general tip" },
  { id: "PS08", format: "story", pillar: "updates", who: "Oryza designs", repeatable: true, title: "Reading this week", hook: "An article or update worth your time — sources cited" },
  { id: "PS09", format: "story", pillar: "proof", who: "Oryza designs", repeatable: true, faces: true, title: "Messages from clients", hook: "Reposted only with written consent", requires: ["consent:yes"], blockedBy: STRICT },
  { id: "PS10", format: "story", pillar: "offer", who: "Oryza designs", repeatable: true, title: "Discovery calls open this week", hook: "Tap to book", blockedBy: STRICT },
];

export const professionalRules = {
  law: [
    "Bar Council of India rules restrict advertising and solicitation: only legal-awareness and educational content, plus permitted profile information (name, contact, enrolment, qualifications, areas of practice) exactly as you provide it.",
    "Blocked: “book a consultation” or “contact us for your case” calls-to-action, client testimonials, case results or wins, fees or discounts, comparisons or superlatives, client names and sensational case content.",
    `Every post carries “${LAW_NOTE}” and the only call-to-action is “${LAW_CTA}”.`,
    "Confirm with your State Bar Council before posting.",
  ],
  ca: [
    "ICAI / ICSI rules restrict solicitation: knowledge content, permitted firm profile, team and culture only.",
    "Blocked: client names, testimonials, “saved ₹X tax” or other result claims, fee offers or discounts, “best CA” or other superlatives, and solicitation calls-to-action.",
    "Tax and compliance dates and figures only as you provide them — marked “verify” against the official notification.",
    CA_NOTE,
  ],
  std: [
    "Expertise content; case studies only with the client's written permission; testimonials only from real clients with consent.",
    "No guaranteed outcomes or income claims, no “best” or “No.1”.",
  ],
};

export const professionalsPlaybook: Playbook = {
  category: "professionals",
  audiences: [
    { name: "People looking to understand an issue", share: 40, needs: "Clear, general explanations they can trust" },
    { name: "Businesses and individuals with recurring needs", share: 30, needs: "Deadlines, updates, process clarity" },
    { name: "Peers and referrers", share: 15, needs: "Expertise, professionalism, a clear profile" },
    { name: "Future team members", share: 15, needs: "Culture, learning, how the practice works" },
  ],
  pillars: [
    { id: "explain", name: "Explainers and awareness", share: 40 },
    { id: "updates", name: "Updates and deadlines", share: 15 },
    { id: "profile", name: "Profile (as permitted)", share: 10 },
    { id: "people", name: "Practice, team and culture", share: 15 },
    { id: "events", name: "Talks and webinars", share: 5 },
    { id: "proof", name: "Case studies and testimonials (standard mode only)", share: 10 },
    { id: "offer", name: "Ways to work together (standard mode only)", share: 5 },
  ],
  tone: "Clear, calm and precise. English-first on LinkedIn, bilingual elsewhere. General information only; no hype.",
  rules: [
    "The rules depend on the profession: strict for lawyers (Bar Council of India) and for Chartered Accountants and Company Secretaries (ICAI / ICSI); standard for consultants and coaches.",
    "This is guidance, not legal advice — confirm with your professional body or legal team.",
  ],
  templates: [...reels, ...posts, ...stories],
};

export const professionalOptions = {
  professions: [
    { id: "lawyer", label: "Lawyer / advocate" },
    { id: "ca", label: "Chartered Accountant" },
    { id: "cs", label: "Company Secretary" },
    { id: "consultant", label: "Consultant, coach or other" },
  ],
  goals: [
    { id: "awareness", label: "Awareness and education" },
    { id: "authority", label: "Authority in my field" },
    { id: "visibility", label: "Being found (Google, LinkedIn)" },
    { id: "clients", label: "New clients (consultants and coaches only)" },
    { id: "hiring", label: "Hiring" },
  ],
  team: [
    { id: "solo", label: "Just me" },
    { id: "small", label: "2–5 people" },
    { id: "large", label: "6 or more" },
  ],
  events: [
    { id: "webinar", label: "Webinar or talk" },
    { id: "event", label: "Event or seminar" },
    { id: "other", label: "Other date" },
  ],
} as const;

/** Fixed days by profession (same date every year). */
export const professionDays = [
  { md: "11-26", name: "Constitution Day (National Law Day)", professions: ["lawyer"], template: "PR21" },
  { md: "07-01", name: "CA Day", professions: ["ca"], template: "PP08" },
];
