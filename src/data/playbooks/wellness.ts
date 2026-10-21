import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Gyms, salons & spas playbook v1 (gyms, salons, spas, unisex salons, bridal studios) — written by Oryza
 * strategists, consumed by the rule engine.
 * Variables: {brand} {city} {service} {services_list} {timings} {packages} {class_line} {women_slots} {certs} {event} {offer}
 * Tags: type:gym|salon|spa|unisex|bridal, has:services, has:packages, has:classes, has:women, has:certs,
 * has:timings, cam:*, consent:yes, season:*.
 * Spa content is strictly professional and family-safe.
 */

/**
 * Wording the engine never publishes: guaranteed transformations or weight loss, supplements and steroids,
 * medical or skin-lightening claims, body-shaming, superlatives, fake urgency and anything not family-safe.
 */
export const WELLNESS_BANNED_WORDING =
  /\b(guarantee\w*|lose \d+\s?kgs?|in \d+ days|weight loss|fat[- ]?burn\w*|fat loss|detox|supplements?|steroids?|protein powders?|fairness|whitening|fair skin|skin lightening|brighten(ing)? skin tone|hair regrowth|regrow\w*|cures?|cured|treats? (acne|eczema|psoriasis|hair fall)|anti[- ]?ageing|miracle|perfect body|beach body|bikini body|\bfat\b|ugly|flaws|best|no\.?\s?1|number one|hurry|last chance|limited (slots|time|period)|only \d+ (slots|spots|seats) left|sexy|sensual|happy ending|body[- ]to[- ]body|nuru|erotic)\b|100\s?%|#1/i;

const CONSENT = "Clients appear only with their written consent.";
const BEFORE_AFTER = "Before / after only with written consent, real and unedited photos, and “Results vary” on the creative.";
const AS_PROVIDED = "Prices, memberships and offers only exactly as you provided them.";
const FAMILY_SAFE = "Strictly professional, family-safe framing.";

const reels: Template[] = [
  { id: "WR01", format: "reel", pillar: "team", who: "Oryza shoots", title: "Meet your trainer / stylist", hook: "Who they are, what they love doing and one tip they give everyone", shots: ["Intro to camera (30 s)", "At work with a client (consent)"], cta: "Book a session", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "WR02", format: "reel", pillar: "tips", who: "Oryza shoots", title: "Form check: one exercise done right", hook: "A common mistake and the safer way to do it", shots: ["Trainer demonstrating (40 s)"], cta: "Save and try it", requires: ["type:gym"], repeatable: true, boosts: ["primary:members"] },
  { id: "WR03", format: "reel", pillar: "tips", who: "Oryza shoots", title: "Styling tip of the week", hook: "One small change that makes a difference — shown on a model with consent", shots: ["Stylist at work (consent)", "Close-ups"], cta: "Book your appointment", blockedBy: ["type:gym", "type:spa"], repeatable: true, boosts: ["primary:bookings"] },
  { id: "WR04", format: "reel", pillar: "services", who: "Oryza edits", note: AS_PROVIDED, title: "{service}: what happens in a session", hook: "Step by step, so you know what to expect", cta: "Book a session", requires: ["has:services"], repeatable: true, boosts: ["primary:bookings"] },
  { id: "WR05", format: "reel", pillar: "hygiene", who: "Oryza shoots", title: "How we keep everything clean", hook: "Sanitising, fresh linen, clean tools — our routine between every client", shots: ["Cleaning equipment or stations", "Fresh towels and tools"], cta: "Ask us anything about hygiene", boosts: ["primary:trust"] },
  { id: "WR06", format: "reel", pillar: "results", who: "Oryza shoots", faces: true, note: BEFORE_AFTER, title: "A real journey, in their words", hook: "What changed for them, how long it took and what helped — results vary", shots: ["Member or client interview (written consent)", "Real, unedited photos they provided"], cta: "Start at your own pace", requires: ["consent:yes"], boosts: ["primary:members"] },
  { id: "WR07", format: "reel", pillar: "services", who: "Oryza edits", title: "Class schedule this week", hook: "{class_line}", cta: "Book your spot", requires: ["has:classes"], boosts: ["primary:members"] },
  { id: "WR08", format: "reel", pillar: "space", who: "Oryza shoots", note: FAMILY_SAFE, title: "A tour of {brand}", hook: "Every area in 30 seconds — so the first visit feels familiar", shots: ["Entrance and reception", "Main floor or stations", "Changing area entrance (no people)"], cta: "Visit us", boosts: ["primary:footfall"] },
  { id: "WR09", format: "reel", pillar: "results", who: "Oryza shoots", faces: true, note: CONSENT, title: "Client moments", hook: "Real smiles after a session — filmed with permission", shots: ["Client after a session (written consent)"], cta: "Book your appointment", requires: ["consent:yes"], blockedBy: ["type:gym"] },
  { id: "WR10", format: "reel", pillar: "tips", who: "Oryza edits", title: "Warm-up in 60 seconds", hook: "A simple routine before any workout", cta: "Save this", requires: ["type:gym"], boosts: ["primary:members"] },
  { id: "WR11", format: "reel", pillar: "tips", who: "Oryza edits", title: "Hair care between appointments", hook: "Simple habits that keep your style fresh", cta: "Save this", blockedBy: ["type:gym", "type:spa"] },
  { id: "WR12", format: "reel", pillar: "tips", who: "Oryza edits", note: FAMILY_SAFE, title: "Why rest and recovery matter", hook: "Sleep, water and gentle stretching — the basics", cta: "Save and share", repeatable: true },
  { id: "WR13", format: "reel", pillar: "services", who: "Oryza shoots", note: FAMILY_SAFE, title: "A calm hour at {brand}", hook: "The room, the music, the care — professional and relaxing", shots: ["Treatment room set-up (no clients)", "Therapist preparing (consent)"], cta: "Book a session", requires: ["type:spa"] },
  { id: "WR14", format: "reel", pillar: "occasions", who: "Oryza shoots", title: "Bridal look, step by step", hook: "From trial to the big day — on a model or bride with consent", shots: ["Bridal make-up in progress (consent)", "Final look"], cta: "Book a bridal trial", requires: ["has:bridal"], boosts: ["primary:bridal"] },
  { id: "WR15", format: "reel", pillar: "services", who: "Oryza edits", title: "Women-only hours", hook: "{women_slots}", cta: "Book your slot", requires: ["has:women"] },
  { id: "WR16", format: "reel", pillar: "team", who: "Oryza edits", note: "Certifications only exactly as you provided them.", title: "Trained and certified team", hook: "{certs}", cta: "Book a session", requires: ["has:certs"], boosts: ["primary:trust"] },
  { id: "WR17", format: "reel", pillar: "occasions", who: "Oryza shoots", title: "Now open: {event}", hook: "What's new and how to book", shots: ["New service or space", "Team welcome"], cta: "Book now", pinnedOnly: true, repeatable: true },
  { id: "WR18", format: "reel", pillar: "occasions", who: "Oryza edits", title: "{event}: highlights", hook: "The session in 30 seconds — people only with consent", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "WR19", format: "reel", pillar: "tips", who: "Oryza edits", title: "Yoga for beginners: three easy poses", hook: "Gentle, safe and doable at home", cta: "Join our session", pinnedOnly: true },
  { id: "WR20", format: "reel", pillar: "tips", who: "Oryza edits", title: "Summer care tips", hook: "Hydration, sun care and light routines for the heat", cta: "Save this", requires: ["season:summer"] },
  { id: "WR21", format: "reel", pillar: "tips", who: "Oryza edits", title: "Winter care tips", hook: "Warm-ups, moisture and staying consistent in the cold", cta: "Save this", requires: ["season:winter"] },
  { id: "WR22", format: "reel", pillar: "tips", who: "Oryza edits", title: "Monsoon care tips", hook: "Hair, skin and workout routines for the humid months", cta: "Save this", requires: ["season:monsoon"] },
  { id: "WR23", format: "reel", pillar: "space", who: "Oryza shoots", title: "Equipment tour", hook: "What each zone is for and how to use it safely", shots: ["Zone by zone walk-through"], cta: "Book a trial visit", requires: ["type:gym"] },
  { id: "WR24", format: "reel", pillar: "team", who: "Oryza shoots", title: "A day behind the scenes", hook: "Opening up, prep and the team's routine", shots: ["Opening the doors", "Team prep", "First client of the day (consent)"], cta: "Follow for more", blockedBy: ["cam:none"] },
];

const posts: Template[] = [
  { id: "WP01", format: "post", pillar: "space", who: "Oryza designs", title: "Timings and location", hook: "{timings}. Location pin and parking", cta: "Save this", requires: ["has:timings"], boosts: ["primary:footfall"] },
  { id: "WP02", format: "post", pillar: "services", who: "Oryza designs", title: "Our services", hook: "{services_list} — what each one is, in plain words", cta: "Book now", requires: ["has:services"], boosts: ["primary:bookings"] },
  { id: "WP03", format: "post", pillar: "services", who: "Oryza designs", note: AS_PROVIDED, title: "Memberships and packages", hook: "{packages}", cta: "Ask our front desk", requires: ["has:packages"], boosts: ["primary:members"] },
  { id: "WP04", format: "post", pillar: "services", who: "Oryza designs", title: "Class timetable", hook: "{class_line}", cta: "Book your spot", requires: ["has:classes"] },
  { id: "WP05", format: "post", pillar: "hygiene", who: "Oryza designs", title: "Our hygiene promise", hook: "Clean tools, fresh linen, sanitised stations — every time", cta: "Ask us anything", boosts: ["primary:trust"] },
  { id: "WP06", format: "post", pillar: "team", who: "Oryza designs", title: "Meet the team", hook: "One person per slide — what they do and what they love", cta: "Book with them", boosts: ["primary:trust"] },
  { id: "WP07", format: "post", pillar: "tips", who: "Oryza designs", title: "5 habits for steady progress", hook: "Small, realistic steps — no shortcuts", cta: "Save this", repeatable: true },
  { id: "WP08", format: "post", pillar: "results", who: "Oryza designs", faces: true, note: BEFORE_AFTER, title: "A real journey", hook: "Their words, their pace — results vary", cta: "Start at your own pace", requires: ["consent:yes"] },
  { id: "WP09", format: "post", pillar: "results", who: "Oryza designs", faces: true, note: CONSENT, title: "A client's words", hook: "A real review, shared with permission", cta: "Book your appointment", requires: ["consent:yes"] },
  { id: "WP10", format: "post", pillar: "occasions", who: "Oryza designs", note: AS_PROVIDED, title: "{event}", hook: "{offer}", cta: "Book during the offer dates", pinnedOnly: true, repeatable: true },
  { id: "WP11", format: "post", pillar: "occasions", who: "Oryza designs", title: "Now open: {event}", hook: "What's new, who it's for and how to book", cta: "Book now", pinnedOnly: true, repeatable: true },
  { id: "WP12", format: "post", pillar: "occasions", who: "Oryza designs", title: "Join us: {event}", hook: "Date, time and how to book a spot", cta: "Book your spot", pinnedOnly: true, repeatable: true },
  { id: "WP13", format: "post", pillar: "occasions", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting — no offers unless you provided one", pinnedOnly: true, repeatable: true },
  { id: "WP14", format: "post", pillar: "tips", who: "Oryza designs", title: "New year, steady habits", hook: "Start small, stay consistent, enjoy it — no crash plans", cta: "Book a trial session", pinnedOnly: true },
  { id: "WP15", format: "post", pillar: "tips", who: "Oryza designs", title: "International Day of Yoga", hook: "Join a gentle session — all levels welcome", cta: "Book your spot", pinnedOnly: true },
  { id: "WP16", format: "post", pillar: "services", who: "Oryza designs", title: "Women-only hours", hook: "{women_slots}", cta: "Book your slot", requires: ["has:women"] },
  { id: "WP17", format: "post", pillar: "team", who: "Oryza designs", note: "Certifications only exactly as you provided them.", title: "Our certifications", hook: "{certs}", cta: "Book a session", requires: ["has:certs"] },
  { id: "WP18", format: "post", pillar: "results", who: "Oryza designs", title: "Your review helps others find us", hook: "If you enjoyed your visit, an honest Google review helps — never paid, never scripted", cta: "Leave an honest review", boosts: ["primary:reviews"] },
  { id: "WP19", format: "post", pillar: "tips", who: "Oryza designs", title: "What to bring to your first session", hook: "A simple checklist for first-timers", cta: "Save this", boosts: ["primary:members", "primary:bookings"] },
  { id: "WP20", format: "post", pillar: "occasions", who: "Oryza designs", title: "Bridal packages: how it works", hook: "Trial, timeline and booking — details as you provide", cta: "Book a bridal trial", requires: ["has:bridal"], boosts: ["primary:bridal"] },
  { id: "WP21", format: "post", pillar: "tips", who: "Oryza designs", title: "Haircare guide by hair type", hook: "Washing, oiling and styling — simple routines", cta: "Save this", blockedBy: ["type:gym", "type:spa"] },
  { id: "WP22", format: "post", pillar: "tips", who: "Oryza designs", title: "Beginner's weekly plan", hook: "Three days a week, simple and safe", cta: "Save and start", requires: ["type:gym"] },
  { id: "WP23", format: "post", pillar: "space", who: "Oryza designs", title: "This week at {brand}", hook: "Moments from the week — people only with consent", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "WP24", format: "post", pillar: "services", who: "Oryza designs", note: FAMILY_SAFE, title: "Treatments menu", hook: "Each treatment explained simply — professional and relaxing", cta: "Book a session", requires: ["type:spa"] },
  { id: "WP25", format: "post", pillar: "tips", who: "Oryza designs", title: "Seasonal care guide", hook: "What to change in your routine this season", cta: "Save this", repeatable: true, minDay: 10 },
  { id: "WP26", format: "post", pillar: "space", who: "Oryza designs", title: "Find us on Google Maps", hook: "Directions, timings and photos in one tap", cta: "Save the location", boosts: ["primary:footfall"] },
];

const stories: Template[] = [
  { id: "WS01", format: "story", pillar: "tips", who: "Oryza designs", repeatable: true, title: "Poll: what should we show next?", hook: "Two options to choose from" },
  { id: "WS02", format: "story", pillar: "team", who: "Oryza designs", repeatable: true, title: "Question box: ask our team", hook: "Answers this week" },
  { id: "WS03", format: "story", pillar: "space", who: "Oryza shoots", repeatable: true, title: "Today at {brand}", hook: "Quick clips — people only with consent" },
  { id: "WS04", format: "story", pillar: "occasions", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "WS05", format: "story", pillar: "space", who: "Oryza designs", repeatable: true, title: "Open today: {timings}", hook: "Tap to book", requires: ["has:timings"] },
  { id: "WS06", format: "story", pillar: "services", who: "Oryza designs", repeatable: true, title: "Classes today", hook: "{class_line}", requires: ["has:classes"] },
  { id: "WS07", format: "story", pillar: "tips", who: "Oryza designs", repeatable: true, title: "Tip of the day", hook: "One small habit" },
  { id: "WS08", format: "story", pillar: "tips", who: "Oryza designs", repeatable: true, title: "Quiz: true or false?", hook: "Answer in the next story" },
  { id: "WS09", format: "story", pillar: "results", who: "Oryza designs", repeatable: true, faces: true, title: "Your tags", hook: "Reposted only with permission", requires: ["consent:yes"] },
  { id: "WS10", format: "story", pillar: "tips", who: "Oryza designs", repeatable: true, title: "Check-in: how's your week going?", hook: "Emoji slider — no judgement" },
];

export const wellnessRules = [
  "No guaranteed transformations or weight loss in a set time; no supplements, steroids or medical claims (hair regrowth, “fairness” or whitening, curing skin conditions).",
  "Before / after only with written consent, real and unedited, with a “Results vary” note; never body-shaming.",
  "Spa content is strictly professional and family-safe.",
  "Certifications, prices, memberships and offers only exactly as you provide them.",
  "Clients appear only with their written consent; reviews are always honest, never paid or scripted.",
];

export const wellnessPlaybook: Playbook = {
  category: "gyms-salons",
  audiences: [
    { name: "People starting or restarting a routine", share: 35, needs: "A welcoming place, clear prices, no judgement" },
    { name: "Regular members and clients", share: 30, needs: "Schedules, tips, new services, recognition" },
    { name: "Occasion bookers (weddings, events)", share: 20, needs: "Looks, timelines, trust in the team" },
    { name: "Locals comparing options", share: 15, needs: "Hygiene, location, timings, reviews" },
  ],
  pillars: [
    { id: "tips", name: "Tips and routines", share: 25 },
    { id: "services", name: "Services, classes and packages", share: 25 },
    { id: "team", name: "Trainers, stylists and team", share: 15 },
    { id: "hygiene", name: "Hygiene and safety", share: 10 },
    { id: "results", name: "Real journeys and client moments", share: 10 },
    { id: "space", name: "The space, timings and location", share: 10 },
    { id: "occasions", name: "Launches, events and seasons", share: 5 },
  ],
  tone: "Warm, encouraging and respectful. Bilingual Hindi–English captions. Real people, realistic progress, no shortcuts.",
  rules: wellnessRules,
  templates: [...reels, ...posts, ...stories],
};

export const wellnessOptions = {
  types: [
    { id: "gym", label: "Gym or fitness studio" },
    { id: "salon", label: "Salon" },
    { id: "spa", label: "Spa" },
    { id: "unisex", label: "Unisex salon" },
    { id: "bridal", label: "Bridal studio" },
  ],
  goals: [
    { id: "members", label: "New members" },
    { id: "bookings", label: "More bookings" },
    { id: "trust", label: "Trust and reputation" },
    { id: "bridal", label: "Bridal and occasion bookings" },
    { id: "footfall", label: "More walk-ins" },
    { id: "reviews", label: "More Google reviews" },
  ],
  events: [
    { id: "launch", label: "New service or branch launch" },
    { id: "class", label: "Special class or workshop" },
    { id: "offer", label: "Offer (dates and wording you provide)" },
    { id: "wedding", label: "Wedding season start (date you've verified)" },
    { id: "other", label: "Other event" },
  ],
} as const;
