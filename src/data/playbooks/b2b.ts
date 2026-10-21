import type { Playbook, Template } from "@/lib/engine/types";

/**
 * B2B & manufacturers playbook v1 (factories, suppliers, exporters, distributors, industrial services) —
 * written by Oryza strategists, consumed by the rule engine.
 * Variables: {brand} {city} {product} {products_list} {industries_list} {certs_line} {cert} {capacity} {moq}
 * {lead_time} {markets} {years} {sustainability} {customer} {event}
 * Tags: type:*, has:products, has:industries, has:certs, has:capacity, has:moq, has:leadtime, has:markets,
 * has:years, has:sustainability, has:customers, has:factory, staff:yes, cam:*.
 * Customer names appear ONLY from the client's list with written permission — never anonymised descriptions.
 */

/** Wording the engine never publishes: superlatives, comparisons, anonymised customer name-drops and guarantees. */
export const B2B_BANNED_WORDING =
  /\b(best|no\.?\s?1|number one|leading|largest|biggest|top (manufacturer|supplier|exporter|company|brand)s?|world[- ]class|unmatched|unbeatable|unrivalled|better than|cheaper than|cheapest|lowest|premier|finest|one of the (top|leading|largest|best)|(major|well[- ]known|reputed|renowned|famous|big|global) (brand|client|company|customer|retailer|buyer|oem)s?|guarantee\w*)\b|100\s?%|#1/i;

const AS_PROVIDED = "Figures exactly as you provided them.";
const CERT = "Certification name, number and validity exactly as on the certificate.";
const PERMISSION = "Customer named only with their written permission on file.";
const STAFF = "Staff appear only with their consent.";
const SPECS = "Product specifications and safety claims only exactly as you provided them.";

const reels: Template[] = [
  { id: "BR01", format: "reel", pillar: "process", who: "Oryza shoots", note: STAFF, title: "Inside our factory", hook: "From the gate to dispatch — a 30-second tour", shots: ["Factory exterior", "Production floor wide", "Dispatch bay"], cta: "Send an enquiry", requires: ["has:factory"], boosts: ["primary:enquiries", "primary:trust"] },
  { id: "BR02", format: "reel", pillar: "quality", who: "Oryza shoots", note: STAFF, title: "One quality check, step by step", hook: "How we check every batch before it leaves", shots: ["QC station", "Measurement or test close-up", "Pass/fail tagging"], cta: "Ask about our QC process", requires: ["has:factory"], repeatable: true, boosts: ["primary:trust"] },
  { id: "BR03", format: "reel", pillar: "process", who: "Oryza shoots", note: SPECS, title: "From raw material to {product}", hook: "Every stage, in order — filmed on our floor", shots: ["Raw material", "Each process step", "Finished product"], cta: "Request a sample", requires: ["has:products", "has:factory"], repeatable: true },
  { id: "BR04", format: "reel", pillar: "process", who: "Oryza shoots", note: SPECS, title: "Machinery explained", hook: "What this machine does and why it matters for your order", shots: ["Machine running", "Operator close-up (consent)", "Output"], cta: "Send an enquiry", requires: ["has:factory"] },
  { id: "BR05", format: "reel", pillar: "products", who: "Oryza edits", note: SPECS, title: "Where {product} is used", hook: "Real applications across the industries we serve", cta: "Ask for the spec sheet", requires: ["has:products"], repeatable: true, boosts: ["primary:enquiries"] },
  { id: "BR06", format: "reel", pillar: "process", who: "Oryza shoots", title: "Packing and dispatch", hook: "How orders are packed, labelled and loaded", shots: ["Packing line", "Labelling", "Loading"], cta: "Ask about lead times", requires: ["has:factory"], boosts: ["primary:dealers"] },
  { id: "BR07", format: "reel", pillar: "people", who: "Oryza shoots", note: STAFF, title: "The people behind every order", hook: "Craft, experience and care on the floor", shots: ["Team at work (consent)", "Hands close-up"], cta: "Follow for more", requires: ["staff:yes"] },
  { id: "BR08", format: "reel", pillar: "quality", who: "Oryza edits", note: CERT, title: "Our certification: {cert}", hook: "What it covers and what it means for buyers", cta: "Ask for a copy", requires: ["has:certs"], boosts: ["primary:trust", "primary:export"] },
  { id: "BR09", format: "reel", pillar: "events", who: "Oryza edits", title: "Visit us at {event}", hook: "Stall details, dates and what we're showing — as you provide", cta: "Book a meeting at the stall", pinnedOnly: true, repeatable: true },
  { id: "BR10", format: "reel", pillar: "events", who: "Oryza edits", title: "{event}: highlights", hook: "The stall, the products and the conversations — staff with consent", cta: "Send an enquiry", pinnedOnly: true, repeatable: true },
  { id: "BR11", format: "reel", pillar: "products", who: "Oryza shoots", note: SPECS, title: "New: {event}", hook: "What it is, who it's for and the specs as provided", shots: ["Product close-ups", "Product in use"], cta: "Request a sample", pinnedOnly: true, repeatable: true },
  { id: "BR12", format: "reel", pillar: "business", who: "Oryza edits", title: "Become a dealer or distributor", hook: "Who we're looking for and how to apply", cta: "Send a dealer enquiry", boosts: ["primary:dealers"] },
  { id: "BR13", format: "reel", pillar: "business", who: "Oryza edits", note: "Only practices you actually follow, as provided.", title: "How we reduce waste", hook: "{sustainability}", cta: "Ask us about it", requires: ["has:sustainability"] },
  { id: "BR14", format: "reel", pillar: "business", who: "Oryza edits", note: AS_PROVIDED, title: "Order basics: MOQ and lead time", hook: "MOQ: {moq} · Lead time: {lead_time}", cta: "Send an enquiry", requires: ["has:moq", "has:leadtime"], boosts: ["primary:enquiries"] },
  { id: "BR15", format: "reel", pillar: "proof", who: "Oryza edits", note: PERMISSION, title: "Case study: {customer}", hook: "The requirement, what we supplied and how we delivered — facts approved by both sides", cta: "Send an enquiry", requires: ["has:customers"], boosts: ["primary:trust"] },
  { id: "BR16", format: "reel", pillar: "people", who: "Oryza shoots", title: "A day at {brand}", hook: "Shift start to dispatch — the rhythm of the floor", shots: ["Shift start", "Production", "Dispatch"], cta: "Follow for more", requires: ["has:factory"], blockedBy: ["cam:none"] },
  { id: "BR17", format: "reel", pillar: "quality", who: "Oryza shoots", note: SPECS, title: "Safety on our floor", hook: "The routines we follow every shift — as practised", shots: ["PPE and signage", "Safety briefing (consent)"], cta: "Ask about our processes", requires: ["has:factory", "staff:yes"] },
  { id: "BR18", format: "reel", pillar: "business", who: "Oryza edits", note: AS_PROVIDED, title: "Where we export", hook: "{markets}", cta: "Send an export enquiry", requires: ["has:markets"], boosts: ["primary:export"] },
  { id: "BR19", format: "reel", pillar: "products", who: "Oryza edits", title: "How to place an order", hook: "Enquiry, quote, sample, PO, dispatch — the steps", cta: "Send an enquiry", boosts: ["primary:enquiries"] },
  { id: "BR20", format: "reel", pillar: "people", who: "Oryza shoots", title: "Meet the founder", hook: "Why we started and how we work with buyers", shots: ["Founder to camera (40 s)", "Walking the floor"], cta: "Connect on LinkedIn", blockedBy: ["cam:none"], boosts: ["primary:trust"] },
  { id: "BR21", format: "reel", pillar: "products", who: "Oryza edits", title: "Request a sample", hook: "What to send us and how samples are dispatched", cta: "Request a sample", requires: ["has:products"] },
  { id: "BR22", format: "reel", pillar: "quality", who: "Oryza shoots", title: "Inside the testing lab", hook: "The tests behind our quality checks — as practised", shots: ["Lab equipment", "Test in progress"], cta: "Ask for test reports", requires: ["has:factory"], blockedBy: ["type:distributor"] },
];

const posts: Template[] = [
  { id: "BP01", format: "post", pillar: "products", who: "Oryza designs", title: "What we make", hook: "{products_list}", cta: "Ask for the catalogue", requires: ["has:products"], boosts: ["primary:enquiries"] },
  { id: "BP02", format: "post", pillar: "products", who: "Oryza designs", note: SPECS, title: "Product focus: {product}", hook: "Specs, sizes and applications — as provided", cta: "Ask for the spec sheet", requires: ["has:products"], repeatable: true },
  { id: "BP03", format: "post", pillar: "business", who: "Oryza designs", title: "Industries we serve", hook: "{industries_list}", cta: "Send an enquiry", requires: ["has:industries"] },
  { id: "BP04", format: "post", pillar: "quality", who: "Oryza designs", note: CERT, title: "Our certifications", hook: "{certs_line}", cta: "Ask for copies", requires: ["has:certs"], boosts: ["primary:trust"] },
  { id: "BP05", format: "post", pillar: "business", who: "Oryza designs", note: AS_PROVIDED, title: "Capacity", hook: "{capacity}", cta: "Send an enquiry", requires: ["has:capacity"] },
  { id: "BP06", format: "post", pillar: "business", who: "Oryza designs", note: AS_PROVIDED, title: "Buyer FAQs: MOQ and lead times", hook: "MOQ: {moq} · Lead time: {lead_time}", cta: "Send an enquiry", requires: ["has:moq", "has:leadtime"] },
  { id: "BP07", format: "post", pillar: "events", who: "Oryza designs", title: "Meet us at {event}", hook: "Hall, stall, dates — as you provide", cta: "Book a meeting", pinnedOnly: true, repeatable: true },
  { id: "BP08", format: "post", pillar: "events", who: "Oryza designs", title: "Thank you for visiting: {event}", hook: "Missed us? Send an enquiry and we'll follow up", cta: "Send an enquiry", pinnedOnly: true, repeatable: true },
  { id: "BP09", format: "post", pillar: "business", who: "Oryza designs", title: "Dealer and distributor enquiries", hook: "Regions, requirements and how to apply", cta: "Send a dealer enquiry", boosts: ["primary:dealers"] },
  { id: "BP10", format: "post", pillar: "proof", who: "Oryza designs", note: PERMISSION, title: "Working with {customer}", hook: "What we supplied — facts approved by both sides", cta: "Send an enquiry", requires: ["has:customers"] },
  { id: "BP11", format: "post", pillar: "business", who: "Oryza designs", note: AS_PROVIDED, title: "{years} in business", hook: "What we've learned about delivering on time", cta: "Connect on LinkedIn", requires: ["has:years"] },
  { id: "BP12", format: "post", pillar: "business", who: "Oryza designs", title: "{event} greetings to our dealers and partners", hook: "A warm greeting — no offers unless you provided one", pinnedOnly: true, repeatable: true },
  { id: "BP13", format: "post", pillar: "products", who: "Oryza designs", note: SPECS, title: "Launching: {event}", hook: "What's new and who it's for — specs as provided", cta: "Request a sample", pinnedOnly: true, repeatable: true },
  { id: "BP14", format: "post", pillar: "process", who: "Oryza designs", title: "Our process, step by step", hook: "Raw material → production → QC → packing → dispatch", cta: "Send an enquiry", requires: ["has:factory"] },
  { id: "BP15", format: "post", pillar: "quality", who: "Oryza designs", title: "How we handle quality issues", hook: "Report, review, resolve — our after-sales steps", cta: "Ask our team", boosts: ["primary:trust"] },
  { id: "BP16", format: "post", pillar: "business", who: "Oryza designs", note: AS_PROVIDED, title: "Export markets", hook: "{markets}", cta: "Send an export enquiry", requires: ["has:markets"] },
  { id: "BP17", format: "post", pillar: "products", who: "Oryza designs", title: "Choosing the right {product}", hook: "What buyers should specify — a checklist", cta: "Ask our team", requires: ["has:products"], repeatable: true },
  { id: "BP18", format: "post", pillar: "people", who: "Oryza designs", note: STAFF, title: "Meet the team", hook: "Sales, production and QC — who you'll work with", cta: "Connect on LinkedIn", requires: ["staff:yes"] },
  { id: "BP19", format: "post", pillar: "business", who: "Oryza designs", title: "Find us on Google Maps", hook: "Directions, working hours and photos", cta: "Save the location", requires: ["has:factory"] },
  { id: "BP20", format: "post", pillar: "business", who: "Oryza designs", note: "Only practices you actually follow, as provided.", title: "Sustainability at {brand}", hook: "{sustainability}", cta: "Ask us about it", requires: ["has:sustainability"] },
  { id: "BP21", format: "post", pillar: "business", who: "Oryza designs", title: "Your review helps other buyers", hook: "If we delivered well, an honest Google review helps — never paid, never scripted", cta: "Leave an honest review" },
  { id: "BP22", format: "post", pillar: "process", who: "Oryza designs", title: "This week at {brand}", hook: "Production, dispatch and team moments", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "BP23", format: "post", pillar: "products", who: "Oryza designs", title: "Packaging options", hook: "How we pack for domestic and bulk orders — as provided", cta: "Ask our team", requires: ["has:factory"] },
  { id: "BP24", format: "post", pillar: "quality", who: "Oryza designs", note: CERT, title: "What our certification means", hook: "{cert}", cta: "Ask for a copy", requires: ["has:certs"] },
  { id: "BP25", format: "post", pillar: "business", who: "Oryza designs", title: "Industry update", hook: "A short, factual note on what's changing for buyers — sources cited", cta: "Connect on LinkedIn", repeatable: true },
  { id: "BP26", format: "post", pillar: "business", who: "Oryza designs", title: "Engineers behind the product", hook: "A thank-you to the people who design and build", pinnedOnly: true },
];

const stories: Template[] = [
  { id: "BS01", format: "story", pillar: "products", who: "Oryza designs", repeatable: true, title: "Poll: which product should we explain next?", hook: "Two to choose from" },
  { id: "BS02", format: "story", pillar: "business", who: "Oryza designs", repeatable: true, title: "Question box: ask our team", hook: "Answers this week" },
  { id: "BS03", format: "story", pillar: "process", who: "Oryza shoots", repeatable: true, title: "On the floor today", hook: "Quick clips — staff only with consent" },
  { id: "BS04", format: "story", pillar: "events", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "BS05", format: "story", pillar: "products", who: "Oryza designs", repeatable: true, title: "Product of the day", hook: "One product, one use" },
  { id: "BS06", format: "story", pillar: "business", who: "Oryza designs", repeatable: true, title: "Enquire on WhatsApp", hook: "Tap to message our sales team" },
  { id: "BS07", format: "story", pillar: "quality", who: "Oryza designs", repeatable: true, title: "Quiz: what does this test check?", hook: "Answer in the next story" },
  { id: "BS08", format: "story", pillar: "process", who: "Oryza designs", repeatable: true, title: "Dispatched today", hook: "Packed and on the way — no customer names" },
  { id: "BS09", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, title: "Team moment", hook: "With the team's consent" },
  { id: "BS10", format: "story", pillar: "business", who: "Oryza designs", repeatable: true, title: "Dealer enquiries open", hook: "Tap to apply" },
];

export const b2bRules = [
  "Certifications (ISO, BIS, CE, export registrations) only as you provide them, with their numbers and dates exactly as typed.",
  "Capacity, production figures, export countries and years in business only as you provide them.",
  "Customer or brand names only with their written permission — otherwise they are left out entirely, never replaced with “a leading brand”-style descriptions.",
  "No competitor comparisons and no “best”, “No.1” or “leading” claims; product specifications and safety claims only as you provide them.",
  "Factory staff appear only with their consent.",
  "This is guidance, not legal advice — confirm with your professional body or legal team.",
];

export const b2bPlaybook: Playbook = {
  category: "b2b-manufacturers",
  audiences: [
    { name: "Procurement and purchase teams", share: 35, needs: "Specs, certifications, capacity, lead times, reliability" },
    { name: "Distributors and dealers", share: 25, needs: "Range, margins discussion, support, how to apply" },
    { name: "Export buyers", share: 20, needs: "Certifications, export experience, communication" },
    { name: "Future employees and the local industry", share: 20, needs: "Culture, safety, growth" },
  ],
  pillars: [
    { id: "process", name: "Factory and process", share: 25 },
    { id: "products", name: "Products and applications", share: 25 },
    { id: "quality", name: "Quality and certifications", share: 15 },
    { id: "business", name: "Buyer information and partnerships", share: 15 },
    { id: "events", name: "Trade fairs and launches", share: 5 },
    { id: "proof", name: "Case studies (with permission)", share: 5 },
    { id: "people", name: "Team and craft", share: 10 },
  ],
  tone: "Clear, factual and confident. English-first on LinkedIn, bilingual elsewhere. Figures only as provided; no hype.",
  rules: b2bRules,
  templates: [...reels, ...posts, ...stories],
};

export const b2bOptions = {
  types: [
    { id: "manufacturer", label: "Manufacturer / factory" },
    { id: "supplier", label: "Supplier" },
    { id: "exporter", label: "Exporter" },
    { id: "distributor", label: "Distributor" },
    { id: "services", label: "Industrial services" },
  ],
  goals: [
    { id: "enquiries", label: "More buyer enquiries" },
    { id: "dealers", label: "Dealers and distributors" },
    { id: "export", label: "Export buyers" },
    { id: "trust", label: "Brand trust and credibility" },
    { id: "hiring", label: "Hiring" },
  ],
  events: [
    { id: "fair", label: "Trade fair or expo" },
    { id: "launch", label: "Product launch" },
    { id: "festive", label: "Festival greeting for dealers (date you've verified)" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Fixed-date days relevant to manufacturing (same date every year). */
export const b2bDays = [
  { md: "09-15", name: "Engineers' Day", template: "BP26" },
  { md: "10-14", name: "World Standards Day", template: "BP12" },
];
