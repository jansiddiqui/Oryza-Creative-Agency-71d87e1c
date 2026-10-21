import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Interiors, fashion & jewellery playbook v1 (jewellers, boutiques, fashion designers, interior studios) —
 * written by Oryza strategists, consumed by the rule engine.
 * Variables: {brand} {city} {speciality} {specialities_list} {hallmark_line} {fabric_line} {price_note}
 * {making_line} {event} {offer} and, per real project: {project} {project_type} {timeline} {budget_line}.
 * Tags: type:jeweller|boutique|designer|interior, has:specialities, has:hallmark, has:fabric, has:making,
 * has:workshop, has:projects, has:bridal, prices:show|request, rate:yes, cam:*, consent:yes.
 * Templates never make purity, hallmark, fabric or material claims themselves — those come only from the
 * client's own words ({hallmark_line}, {fabric_line}).
 */

/** Wording the engine never publishes: gold as an investment, superlatives, fake discounts and urgency. */
export const STYLE_BANNED_WORDING =
  /\b(invest(ment|ing)?s?|returns?|appreciat\w*|grow your (wealth|money)|wealth|safe haven|assured|guaranteed?|best|no\.?\s?1|number one|lowest|cheapest|hurry|last chance|limited (time|period|stock|pieces)|only \d+ (left|pieces)|selling fast|zero making|0% making)\b|100\s?%|#1/i;

/** Claim words templates must never use on their own (only inside the client's provided text). */
export const STYLE_CLAIM_WORDS =
  /\b(hallmark\w*|BIS|HUID|916|\d+\s?(k|kt|carat|karat)|purity|pure|silk|handloom|zari|banarasi|kanjivaram|chanderi|khadi|organic|solid wood|teak|sheesham|marble|certified)\b/i;

const RENDER = "Every render is labelled “Design concept / visualisation”.";
const PROJECT = "Real project shown with the client's written consent; timeline and cost only as provided.";
const CONSENT = "Customers appear only with their written consent.";
const HALLMARK = "Hallmark, HUID and purity details only exactly as you provided them.";
const FABRIC = "Fabric and craft claims only exactly as you provided them.";
const PRICES = "Prices, making charges and gold rates only as you provide them, with the date and time; never auto-filled.";

const reels: Template[] = [
  { id: "YR01", format: "reel", pillar: "craft", who: "Oryza shoots", title: "How it's made", hook: "From sketch to finished piece — the hands and the hours behind it", shots: ["Workshop close-ups", "Artisan at work (consent)", "Finished piece reveal"], cta: "Visit the studio", requires: ["has:workshop"], boosts: ["primary:trust", "primary:launch"] },
  { id: "YR02", format: "reel", pillar: "style", who: "Oryza shoots", title: "Styling guide: {speciality}", hook: "Three ways to wear or use it — for everyday and occasions", shots: ["Styling on a model (consent)", "Close-ups"], cta: "Save this", requires: ["has:specialities"], repeatable: true, blockedBy: ["type:interior"] },
  { id: "YR03", format: "reel", pillar: "collections", who: "Oryza shoots", title: "Now launching: {event}", hook: "The new collection, piece by piece", shots: ["Collection display", "Close-ups of details", "Designer on the idea (20 s)"], cta: "Book a viewing", pinnedOnly: true, repeatable: true },
  { id: "YR04", format: "reel", pillar: "care", who: "Oryza edits", title: "How to care for your jewellery", hook: "Storing, cleaning and wearing — simple habits that keep it shining", cta: "Save this", requires: ["type:jeweller"] },
  { id: "YR05", format: "reel", pillar: "care", who: "Oryza edits", title: "Caring for occasion wear", hook: "Washing, storing and folding — keep it looking new", cta: "Save this", requires: ["type:boutique"] },
  { id: "YR06", format: "reel", pillar: "process", who: "Oryza edits", note: RENDER, title: "Our design process", hook: "Brief, moodboard, layout, materials, execution — five steps", cta: "Book a consultation", requires: ["type:interior"], boosts: ["primary:enquiries"] },
  { id: "YR07", format: "reel", pillar: "projects", who: "Oryza shoots", faces: false, note: PROJECT, title: "Real project: {project}", hook: "{project_type} · {timeline} — the space before and after", shots: ["Before photos you provide", "Finished space walk-through"], cta: "Book a consultation", requires: ["has:projects"], boosts: ["primary:trust"] },
  { id: "YR08", format: "reel", pillar: "people", who: "Oryza shoots", faces: true, note: CONSENT, title: "A customer's story", hook: "What they wanted, how it turned out — in their words", shots: ["Customer interview (written consent)"], cta: "Book a visit", requires: ["consent:yes"], boosts: ["primary:trust"] },
  { id: "YR09", format: "reel", pillar: "space", who: "Oryza shoots", title: "Inside {brand}", hook: "A walk through the store or studio — what you'll find where", shots: ["Entrance", "Displays or sample boards", "Consultation corner"], cta: "Visit us", boosts: ["primary:footfall"] },
  { id: "YR10", format: "reel", pillar: "people", who: "Oryza shoots", title: "Meet the designer", hook: "The person behind the pieces — and what inspires them", shots: ["Designer intro to camera (30 s)", "At the work table"], cta: "Book a consultation", blockedBy: ["cam:none"] },
  { id: "YR11", format: "reel", pillar: "style", who: "Oryza edits", title: "How to choose: {speciality}", hook: "What to look at, what to ask, what suits you", cta: "Save before you shop", requires: ["has:specialities"], repeatable: true },
  { id: "YR12", format: "reel", pillar: "collections", who: "Oryza shoots", title: "Bridal edit", hook: "Pieces and looks for the wedding — by occasion", shots: ["Bridal pieces on display or on a model (consent)"], cta: "Book a bridal appointment", requires: ["has:bridal"], blockedBy: ["type:interior"], boosts: ["primary:bridal"] },
  { id: "YR13", format: "reel", pillar: "style", who: "Oryza edits", note: RENDER, title: "Small-space ideas", hook: "Storage, light and layout tricks for compact rooms", cta: "Save this", requires: ["type:interior"] },
  { id: "YR14", format: "reel", pillar: "style", who: "Oryza edits", note: RENDER, title: "Lighting a room right", hook: "Ambient, task and accent light — explained simply", cta: "Save this", requires: ["type:interior"] },
  { id: "YR15", format: "reel", pillar: "craft", who: "Oryza edits", note: FABRIC, title: "The fabric story", hook: "{fabric_line}", cta: "Ask to see it in person", requires: ["has:fabric"] },
  { id: "YR16", format: "reel", pillar: "craft", who: "Oryza edits", note: HALLMARK, title: "What you get with every piece", hook: "{hallmark_line}", cta: "Ask to see the certificate", requires: ["has:hallmark"], boosts: ["primary:trust"] },
  { id: "YR17", format: "reel", pillar: "style", who: "Oryza edits", title: "Everyday vs occasion pieces", hook: "How to build a collection you'll actually wear", cta: "Save this", requires: ["type:jeweller"] },
  { id: "YR18", format: "reel", pillar: "craft", who: "Oryza shoots", title: "Behind the seams", hook: "Cutting, stitching and finishing — the details that matter", shots: ["Cutting table", "Stitching close-ups", "Final press"], cta: "Book a fitting", requires: ["has:workshop"], blockedBy: ["type:jeweller", "type:interior"] },
  { id: "YR19", format: "reel", pillar: "collections", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "YR20", format: "reel", pillar: "style", who: "Oryza edits", note: RENDER, title: "Concept to room: a visualisation", hook: "How a design idea becomes a room — labelled as a concept", cta: "Book a consultation", requires: ["type:interior"], repeatable: true },
  { id: "YR21", format: "reel", pillar: "style", who: "Oryza edits", title: "Fit and alterations, explained", hook: "How we get the fit right — trial, adjust, finish", cta: "Book a fitting", requires: ["type:designer"] },
  { id: "YR22", format: "reel", pillar: "collections", who: "Oryza shoots", note: "Offer exactly as you provided it, with its terms.", title: "{event} at {brand}", hook: "{offer}", shots: ["Festive display", "Close-ups"], cta: "Book a visit", pinnedOnly: true, repeatable: true },
  { id: "YR23", format: "reel", pillar: "space", who: "Oryza edits", title: "Book a consultation in 3 steps", hook: "Call or WhatsApp, share your idea, visit the studio", cta: "WhatsApp to book", boosts: ["primary:enquiries"] },
  { id: "YR24", format: "reel", pillar: "style", who: "Oryza edits", title: "Colour and pattern pairing", hook: "Simple rules for putting colours and prints together", cta: "Save this", blockedBy: ["type:jeweller"] },
];

const posts: Template[] = [
  { id: "YP01", format: "post", pillar: "collections", who: "Oryza designs", title: "Now launching: {event}", hook: "The collection at a glance — details as you provide", cta: "Book a viewing", pinnedOnly: true, repeatable: true },
  { id: "YP02", format: "post", pillar: "style", who: "Oryza designs", title: "Styling guide: {speciality}", hook: "A carousel of looks for different occasions", cta: "Save this", requires: ["has:specialities"], repeatable: true, blockedBy: ["type:interior"] },
  { id: "YP03", format: "post", pillar: "care", who: "Oryza designs", title: "Care guide", hook: "How to keep it looking new — a carousel to save", cta: "Save this", repeatable: true },
  { id: "YP04", format: "post", pillar: "projects", who: "Oryza designs", note: PROJECT, title: "Before and after: {project}", hook: "{project_type} · {timeline}{budget_line}", cta: "Book a consultation", requires: ["has:projects"] },
  { id: "YP05", format: "post", pillar: "process", who: "Oryza designs", note: RENDER, title: "From brief to handover", hook: "Our five-step process in one carousel", cta: "Book a consultation", requires: ["type:interior"] },
  { id: "YP06", format: "post", pillar: "people", who: "Oryza designs", faces: true, note: CONSENT, title: "A customer's words", hook: "A real review, shared with permission", cta: "Book a visit", requires: ["consent:yes"] },
  { id: "YP07", format: "post", pillar: "space", who: "Oryza designs", title: "Visit {brand}", hook: "Timings, location and how to book an appointment", cta: "Save this", boosts: ["primary:footfall"] },
  { id: "YP08", format: "post", pillar: "craft", who: "Oryza designs", note: HALLMARK, title: "Certificate details for our pieces", hook: "{hallmark_line}", cta: "Ask to see the certificate", requires: ["has:hallmark"] },
  { id: "YP09", format: "post", pillar: "craft", who: "Oryza designs", note: FABRIC, title: "About the fabric", hook: "{fabric_line}", cta: "Ask to see it in person", requires: ["has:fabric"] },
  { id: "YP10", format: "post", pillar: "collections", who: "Oryza designs", note: PRICES, title: "Prices and making charges", hook: "{price_note}{making_line}", cta: "Ask for today's details", requires: ["prices:show"] },
  { id: "YP11", format: "post", pillar: "collections", who: "Oryza designs", title: "Bridal appointments", hook: "How a bridal consultation works — timing, trial and choices", cta: "Book a bridal appointment", requires: ["has:bridal"], blockedBy: ["type:interior"] },
  { id: "YP12", format: "post", pillar: "collections", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting — no offers unless you provided one", pinnedOnly: true, repeatable: true },
  { id: "YP13", format: "post", pillar: "collections", who: "Oryza designs", note: "Offer exactly as you provided it, with its terms.", title: "{event}", hook: "{offer}", cta: "Book a visit", pinnedOnly: true, repeatable: true },
  { id: "YP14", format: "post", pillar: "style", who: "Oryza designs", title: "How to choose: {speciality}", hook: "A buyer's checklist — what to look at and what to ask", cta: "Save this", requires: ["has:specialities"], repeatable: true },
  { id: "YP15", format: "post", pillar: "people", who: "Oryza designs", title: "Meet the team", hook: "Designers, artisans and advisors — who you'll meet", cta: "Book a consultation" },
  { id: "YP16", format: "post", pillar: "style", who: "Oryza designs", note: RENDER, title: "Moodboard of the month", hook: "Colours, textures and ideas we're working with — concepts only", cta: "Save for inspiration", repeatable: true },
  { id: "YP17", format: "post", pillar: "people", who: "Oryza designs", title: "Your review helps others find us", hook: "If you loved your piece or space, an honest Google review helps — never paid, never scripted", cta: "Leave an honest review", boosts: ["primary:trust"] },
  { id: "YP18", format: "post", pillar: "space", who: "Oryza designs", title: "This week at {brand}", hook: "Studio moments from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "YP19", format: "post", pillar: "style", who: "Oryza designs", title: "Room checklist before you renovate", hook: "Measurements, budget, light and storage — a planning sheet", cta: "Save this", requires: ["type:interior"] },
  { id: "YP20", format: "post", pillar: "style", who: "Oryza designs", title: "Measurements for a perfect fit", hook: "What we measure and why — before your first fitting", cta: "Book a fitting", requires: ["type:designer"] },
  { id: "YP21", format: "post", pillar: "style", who: "Oryza designs", title: "Jewellery for every occasion", hook: "Office, festive, wedding — what to wear when", cta: "Book a visit", requires: ["type:jeweller"] },
  { id: "YP22", format: "post", pillar: "style", who: "Oryza designs", title: "Draping and styling ideas", hook: "Five ways to style one outfit", cta: "Save this", requires: ["type:boutique"] },
  { id: "YP23", format: "post", pillar: "process", who: "Oryza designs", title: "How a custom order works", hook: "Idea, design, approval, making, delivery — timelines as we agree them", cta: "WhatsApp to start", blockedBy: ["type:interior"], boosts: ["primary:enquiries"] },
  { id: "YP24", format: "post", pillar: "collections", who: "Oryza designs", title: "Coming soon: {event}", hook: "A first look — launch date and how to book a viewing", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "YP25", format: "post", pillar: "style", who: "Oryza designs", title: "Find us on Pinterest", hook: "Boards of looks, pieces and spaces to save", cta: "Follow our boards" },
  { id: "YP26", format: "post", pillar: "craft", who: "Oryza designs", title: "The details up close", hook: "Close-ups that show the finish — from our workshop", cta: "Book a viewing", requires: ["has:workshop"], repeatable: true },
];

const stories: Template[] = [
  { id: "YS01", format: "story", pillar: "style", who: "Oryza designs", repeatable: true, title: "Poll: which one would you pick?", hook: "Two looks or pieces to choose from" },
  { id: "YS02", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, title: "Question box: ask our designers", hook: "Answers this week" },
  { id: "YS03", format: "story", pillar: "craft", who: "Oryza shoots", repeatable: true, title: "In the studio today", hook: "Quick clips from the workshop or store" },
  { id: "YS04", format: "story", pillar: "collections", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "YS05", format: "story", pillar: "collections", who: "Oryza designs", repeatable: true, note: PRICES, title: "Today's rate", hook: "Sent by you each morning with the date and time — never filled automatically", requires: ["rate:yes"] },
  { id: "YS06", format: "story", pillar: "style", who: "Oryza designs", repeatable: true, title: "Style tip of the day", hook: "One small idea" },
  { id: "YS07", format: "story", pillar: "style", who: "Oryza designs", repeatable: true, title: "Quiz: guess the detail", hook: "Answer in the next story" },
  { id: "YS08", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, faces: true, title: "Your tags", hook: "Reposted only with permission", requires: ["consent:yes"] },
  { id: "YS09", format: "story", pillar: "space", who: "Oryza designs", repeatable: true, title: "Book a visit", hook: "Tap to message us" },
  { id: "YS10", format: "story", pillar: "style", who: "Oryza designs", repeatable: true, note: RENDER, title: "Inspiration board", hook: "A concept we love this week" },
];

export const styleRules = [
  "Jewellery: hallmark, BIS, HUID and purity details only exactly as you provide them; making charges and gold rates only as you provide them, with the date and time — never filled automatically; gold is never presented as an investment with returns.",
  "No fake discounts: offers only as you provide them, and an offer quoting an earlier price appears only when you confirm that price was real.",
  "Interiors: every render is labelled “Design concept / visualisation”; project timelines and costs only as provided; client homes only with their written consent.",
  "Fashion: fabric and handloom claims only exactly as you provide them — our templates never claim “pure silk” or “handloom” on their own.",
  "No “best”, “No.1” or urgency claims; customers appear only with their written consent.",
];

export const stylePlaybook: Playbook = {
  category: "interiors-fashion-jewellery",
  audiences: [
    { name: "Buyers looking for taste and craftsmanship", share: 40, needs: "Inspiration, quality they can see, honest details" },
    { name: "Occasion and wedding shoppers", share: 25, needs: "Collections, appointments, timelines" },
    { name: "Homeowners planning a space", share: 20, needs: "Process, real projects, clear costs and timelines" },
    { name: "Loyal customers", share: 15, needs: "New collections, care, recognition" },
  ],
  pillars: [
    { id: "collections", name: "Collections and launches", share: 25 },
    { id: "craft", name: "Craftsmanship and details", share: 20 },
    { id: "style", name: "Styling and design ideas", share: 25 },
    { id: "process", name: "Process and custom orders", share: 10 },
    { id: "projects", name: "Real projects (with consent)", share: 5 },
    { id: "care", name: "Care guides", share: 5 },
    { id: "people", name: "Team and customers", share: 5 },
    { id: "space", name: "Store or studio", share: 5 },
  ],
  tone: "Elegant, warm and precise. Bilingual Hindi–English captions. Details only as provided; no hype.",
  rules: styleRules,
  templates: [...reels, ...posts, ...stories],
};

export const styleOptions = {
  types: [
    { id: "jeweller", label: "Jeweller" },
    { id: "boutique", label: "Boutique" },
    { id: "designer", label: "Fashion designer" },
    { id: "interior", label: "Interior design studio" },
  ],
  goals: [
    { id: "launch", label: "Collection or project launches" },
    { id: "footfall", label: "More store or studio visits" },
    { id: "enquiries", label: "More enquiries and consultations" },
    { id: "bridal", label: "Bridal and wedding orders" },
    { id: "trust", label: "Trust and reputation" },
  ],
  prices: [
    { id: "request", label: "Prices on request" },
    { id: "show", label: "Show prices exactly as I provide them" },
  ],
  events: [
    { id: "festive", label: "Festive buying day (date you've verified)" },
    { id: "wedding", label: "Wedding season start (date you've verified)" },
    { id: "exhibition", label: "Exhibition or trunk show" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Fixed-date days for this category (same date every year). */
export const styleDays = [
  { md: "04-27", name: "World Design Day", types: ["interior", "designer"] },
  { md: "08-07", name: "National Handloom Day", types: ["boutique", "designer"] },
];

/** Buying seasons whose date changes every year: never auto-pinned — add one as an event once verified. */
export const styleFestivals = [
  { name: "Akshaya Tritiya", months: [4, 5] },
  { name: "Dhanteras", months: [10, 11] },
  { name: "Wedding season", months: [11, 12, 1, 2] },
];
