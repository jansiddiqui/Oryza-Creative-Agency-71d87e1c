import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Real estate playbook v1 (builders, developers, brokers) — written by Oryza strategists, consumed by the rule engine.
 * Variables: {brand} {city} {visit} {banks} {offer} {agent_rera} {distance} {event}
 * Project variables (filled per RERA-registered project): {project} {ptype} {location} {units} {price}
 * {possession} {rera_line} {amenity_status} {month}
 * Project tags (a template needs at least one registered project matching them): has:rera, has:uc, has:ready,
 * has:prelaunch, has:sample, has:price, has:possession.
 * Every template that names a project carries the RERA line on the creative and in the caption.
 */

/** Wording the engine never publishes for real estate: assured/guaranteed returns, superlatives, comparisons and fake urgency. */
export const REAL_ESTATE_BANNED_WORDING =
  /\b(assured|guaranteed?|guarantees|investment that doubles|doubles? your|doubles in|returns? of \d|rental (income )?guarantee|appreciation|best|no\.?\s?1|number one|cheapest|lowest price|sold out|hurry|last (few|chance)|only \d+ (units? |flats? |homes? )?left|limited (period|time|units|stock)|unlike other builders|better than|risk[- ]free)\b|100\s?%/i;

const RERA = "Caption and creative carry: {rera_line}.";
const RENDER = `${RERA} Every render is labelled “Artist's impression”.`;
const BUYER = "Buyer appears only with written consent.";

const reels: Template[] = [
  { id: "ER01", format: "reel", pillar: "progress", who: "Oryza shoots", note: RERA, title: "Site progress at {project}: {month}", hook: "What changed on site this month — real footage, dated, no renders", shots: ["Site walk with the date on screen", "Floor-by-floor progress", "Engineer explains this month's work (20 s)"], cta: "Book a site visit", pinnedOnly: true, repeatable: true },
  { id: "ER02", format: "reel", pillar: "project", who: "Oryza shoots", note: RERA, title: "Walkthrough: the sample flat at {project}", hook: "Room by room, with sizes as per the approved plan", shots: ["Entrance to living room glide", "Kitchen and bedrooms", "Balcony view"], cta: "Book a site visit", requires: ["has:sample"], boosts: ["primary:visits", "primary:enquiries"] },
  { id: "ER03", format: "reel", pillar: "project", who: "Oryza shoots", note: RERA, title: "Ready to move: a home at {project}", hook: "A finished home you can walk into today — filmed as it is", shots: ["Ready unit walkthrough", "Building entrance and lobby", "Common areas in use"], cta: "Book a site visit", requires: ["has:ready"], boosts: ["primary:inventory", "primary:visits"] },
  { id: "ER04", format: "reel", pillar: "progress", who: "Oryza shoots", note: RERA, title: "How we build at {project}: materials and checks", hook: "The steel, the concrete and the quality checks behind every floor", shots: ["Material close-ups (brands as used on site)", "Cube test or quality check", "Engineer explains one check (20 s)"], cta: "Ask our engineer a question", requires: ["has:uc", "has:siteaccess"], boosts: ["primary:trust"] },
  { id: "ER05", format: "reel", pillar: "trust", who: "Oryza shoots", title: "Meet the team behind {brand}", hook: "Who builds your home — the people, in their own words", shots: ["Founder or director intro to camera (30 s)", "Team at the office", "Team on site"], cta: "Follow for site updates", blockedBy: ["cam:none", "role:broker"], boosts: ["primary:trust"] },
  { id: "ER06", format: "reel", pillar: "location", who: "Oryza shoots", note: RERA, title: "Around {project}: the neighbourhood", hook: "Schools, markets, hospitals and roads nearby — distances as we measured them", shots: ["Drive from the main road", "Nearby market and school (exteriors)", "Project gate"], cta: "Save for your shortlist", requires: ["has:rera"], boosts: ["primary:visits"] },
  { id: "ER07", format: "reel", pillar: "location", who: "Oryza shoots", note: RERA, title: "{distance} — from {project}", hook: "One location advantage, filmed from the gate — distance as provided by {brand}", shots: ["Gate to destination drive (time-lapse)"], cta: "Book a site visit", requires: ["has:rera", "has:distances"] },
  { id: "ER08", format: "reel", pillar: "guides", who: "Oryza edits", title: "Carpet vs built-up vs super built-up", hook: "Three areas, one flat — explained in 30 seconds", cta: "Save before you visit a site", boosts: ["primary:enquiries", "primary:trust"] },
  { id: "ER09", format: "reel", pillar: "guides", who: "Oryza edits", title: "RERA explained: what it protects", hook: "What a RERA registration means for buyers — and how to check any project", cta: "Save and share", boosts: ["primary:trust"] },
  { id: "ER10", format: "reel", pillar: "guides", who: "Oryza edits", title: "Home loan in 5 steps", hook: "From eligibility to disbursement — the order buyers usually follow", cta: "Save for later", boosts: ["primary:enquiries"] },
  { id: "ER11", format: "reel", pillar: "guides", who: "Oryza edits", title: "Documents to check before you book", hook: "A buyer's checklist — RERA certificate, approved plan, title and allotment letter", cta: "Save this checklist", boosts: ["primary:trust"] },
  { id: "ER12", format: "reel", pillar: "trust", who: "Oryza shoots", title: "A day on site with our engineer", hook: "Safety briefing, checks and progress — behind the scenes", shots: ["Engineer arriving on site", "Safety briefing (helmets on)", "Engineer to camera (20 s)"], cta: "Follow for site updates", requires: ["has:siteaccess"], blockedBy: ["cam:none", "role:broker"] },
  { id: "ER13", format: "reel", pillar: "project", who: "Oryza shoots", note: RENDER, title: "Amenities at {project}", hook: "{amenity_status}", shots: ["Amenity areas as they are today", "Renders on screen with the “Artist's impression” label"], cta: "Book a site visit", requires: ["has:rera", "has:amenities"] },
  { id: "ER14", format: "reel", pillar: "project", who: "Oryza shoots", note: RENDER, title: "Now launching: {project}", hook: "Location, home types and the RERA number — what you need to know first", shots: ["Site and location", "Renders labelled “Artist's impression”", "Director or sales head to camera"], cta: "Register your interest", pinnedOnly: true, repeatable: true },
  { id: "ER15", format: "reel", pillar: "project", who: "Oryza edits", note: RERA, title: "Bookings open: {project}", hook: "How to book, documents needed and the site-visit timings", cta: "Book a site visit", pinnedOnly: true, repeatable: true },
  { id: "ER16", format: "reel", pillar: "trust", who: "Oryza shoots", faces: true, note: `${RERA} ${BUYER}`, title: "Keys handed over at {project}", hook: "The handover, as it happened — a family's first look at their home", shots: ["Key handover (buyer consent)", "Family walks into the home"], cta: "Follow for more handovers", pinnedOnly: true, repeatable: true },
  { id: "ER17", format: "reel", pillar: "trust", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "ER18", format: "reel", pillar: "location", who: "Oryza shoots", title: "Living in {city}: the areas buyers ask about", hook: "Roads, schools and markets — a calm, factual look", shots: ["City b-roll", "Key roads and landmarks"], cta: "Ask us about an area" },
  { id: "ER19", format: "reel", pillar: "guides", who: "Oryza edits", title: "Under construction or ready to move?", hook: "What changes for the buyer — timelines, payment and GST, explained simply", cta: "Save and share", boosts: ["primary:enquiries"] },
  { id: "ER20", format: "reel", pillar: "trust", who: "Oryza shoots", faces: true, note: BUYER, title: "A buyer's experience, in their words", hook: "Why they chose their home — never a returns or price claim", shots: ["Buyer interview (written consent)"], cta: "Book a site visit", requires: ["consent:yes"] },
  { id: "ER21", format: "reel", pillar: "project", who: "Oryza shoots", note: "Agent RERA registration on the creative and caption: {agent_rera}. Listing details exactly as the owner provides.", title: "Listing walkthrough: a home for resale", hook: "A home on the resale market, filmed as it is — price and terms exactly as the owner provides", shots: ["Home walkthrough (owner permission)", "Building and street"], cta: "WhatsApp to book a visit", requires: ["role:broker", "has:agentrera"], repeatable: true, boosts: ["primary:resale"] },
  { id: "ER22", format: "reel", pillar: "project", who: "Oryza shoots", note: "Agent RERA registration on the creative and caption: {agent_rera}. Listing details exactly as the owner provides.", title: "For rent: a home walkthrough", hook: "Size, floor, rent and terms exactly as the owner provides", shots: ["Home walkthrough (owner permission)", "Neighbourhood b-roll"], cta: "WhatsApp to book a visit", requires: ["role:broker", "has:agentrera"], repeatable: true, boosts: ["primary:resale"] },
  { id: "ER23", format: "reel", pillar: "progress", who: "Oryza edits", note: RERA, title: "{project}: from foundation to today", hook: "Progress so far, in dated clips — no renders", cta: "Book a site visit", requires: ["has:uc", "has:siteaccess"], boosts: ["primary:trust", "primary:inventory"] },
  { id: "ER24", format: "reel", pillar: "guides", who: "Oryza edits", title: "Stamp duty and registration: what to budget for", hook: "The costs on top of the flat price — general guidance, check current rates", cta: "Save for later" },
];

const posts: Template[] = [
  { id: "EP01", format: "post", pillar: "project", who: "Oryza designs", note: RENDER, title: "{project} at a glance", hook: "{ptype} in {location} · {units} — details exactly as on the RERA registration", cta: "Book a site visit", requires: ["has:rera"], boosts: ["primary:enquiries", "primary:visits"] },
  { id: "EP02", format: "post", pillar: "project", who: "Oryza designs", note: `${RERA} Price exactly as provided by {brand}, with “terms apply”.`, title: "{project}: home types and prices", hook: "{units} · {price}, terms apply", cta: "WhatsApp for the price sheet", requires: ["has:price"], boosts: ["primary:enquiries", "primary:inventory"] },
  { id: "EP03", format: "post", pillar: "project", who: "Oryza designs", note: RERA, title: "Visit {project}", hook: "Site visits: {visit}. Location pin and how to reach", cta: "Book a site visit", requires: ["has:rera", "has:visit"], repeatable: true, boosts: ["primary:visits"] },
  { id: "EP04", format: "post", pillar: "project", who: "Oryza designs", note: `${RERA} Possession date exactly as declared to RERA.`, title: "{project}: possession timeline", hook: "Possession as declared to RERA: {possession}", cta: "Ask us about the payment plan", requires: ["has:possession"], boosts: ["primary:trust"] },
  { id: "EP05", format: "post", pillar: "progress", who: "Oryza designs", note: RERA, title: "Construction update: {project}", hook: "Dated site photos — this month's floors, slabs and finishing", cta: "Book a site visit", requires: ["has:uc"], boosts: ["primary:trust"] },
  { id: "EP06", format: "post", pillar: "location", who: "Oryza designs", note: RERA, title: "{project}: what's nearby", hook: "A map card of schools, hospitals, markets and roads — distances as provided by {brand}", cta: "Save this map", requires: ["has:rera", "has:distances"], boosts: ["primary:visits"] },
  { id: "EP07", format: "post", pillar: "guides", who: "Oryza designs", title: "Carpet, built-up, super built-up", hook: "One carousel, three definitions, one example flat", cta: "Save before you visit a site" },
  { id: "EP08", format: "post", pillar: "guides", who: "Oryza designs", title: "How to check a project on the RERA website", hook: "Step by step, with screenshots of the public search", cta: "Save and share", boosts: ["primary:trust"] },
  { id: "EP09", format: "post", pillar: "guides", who: "Oryza designs", title: "Home loan: documents you'll need", hook: "Salaried and self-employed checklists", cta: "Save this checklist", boosts: ["primary:enquiries"] },
  { id: "EP10", format: "post", pillar: "guides", who: "Oryza designs", note: "Bank names exactly as provided; no interest-rate claims.", title: "Home loans: banks we work with", hook: "{banks} — eligibility and documents, no rate promises", cta: "Ask us about home loans", requires: ["has:banks"] },
  { id: "EP11", format: "post", pillar: "trust", who: "Oryza designs", title: "About {brand}", hook: "Who we are, where we build and how to reach us — facts only", cta: "Follow for site updates", boosts: ["primary:trust"] },
  { id: "EP12", format: "post", pillar: "trust", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting — no offers unless you have provided one", pinnedOnly: true, repeatable: true },
  { id: "EP13", format: "post", pillar: "project", who: "Oryza designs", note: RENDER, title: "Now launching: {project}", hook: "Location, home types, RERA number and how to register interest", cta: "Register your interest", pinnedOnly: true, repeatable: true },
  { id: "EP14", format: "post", pillar: "project", who: "Oryza designs", note: RERA, title: "Bookings open: {project}", hook: "How to book, documents needed and site-visit timings", cta: "Book a site visit", pinnedOnly: true, repeatable: true },
  { id: "EP15", format: "post", pillar: "trust", who: "Oryza designs", note: RERA, title: "Possession begins at {project}", hook: "Handover schedule and what to bring — dates as declared to RERA", cta: "Call the CRM team", pinnedOnly: true, repeatable: true },
  { id: "EP16", format: "post", pillar: "project", who: "Oryza designs", note: `${RERA} Offer text exactly as approved by {brand}, with its terms.`, title: "Festive offer at {project}", hook: "{offer}", cta: "Ask for the terms", requires: ["has:offer"], pinnedOnly: true, repeatable: true },
  { id: "EP17", format: "post", pillar: "trust", who: "Oryza designs", title: "Join us: {event}", hook: "Date, time, place and how to register", cta: "Register on WhatsApp", pinnedOnly: true, repeatable: true },
  { id: "EP18", format: "post", pillar: "guides", who: "Oryza designs", title: "First-time buyer? Start here", hook: "Budget, location, builder track record and documents — a 5-step guide", cta: "Save and share", boosts: ["primary:enquiries"] },
  { id: "EP19", format: "post", pillar: "guides", who: "Oryza designs", title: "Questions to ask on a site visit", hook: "Ten questions buyers often forget — print and carry", cta: "Save before your visit", boosts: ["primary:visits"] },
  { id: "EP20", format: "post", pillar: "progress", who: "Oryza designs", note: RERA, title: "Quality checks at {project}", hook: "The tests every floor goes through, shown with site photos", cta: "Ask our engineer", requires: ["has:uc"] },
  { id: "EP21", format: "post", pillar: "trust", who: "Oryza designs", faces: true, note: BUYER, title: "A buyer's experience", hook: "Their words about choosing their home — never a returns or price claim", cta: "Book a site visit", requires: ["consent:yes"] },
  { id: "EP22", format: "post", pillar: "project", who: "Oryza designs", note: RERA, title: "Ready-to-move homes at {project}", hook: "Move in now — see finished homes as they are", cta: "Book a site visit", requires: ["has:ready"], boosts: ["primary:inventory"] },
  { id: "EP23", format: "post", pillar: "project", who: "Oryza designs", note: "Agent RERA registration on the creative and caption: {agent_rera}. Listing details exactly as the owner provides.", title: "New listing: resale home", hook: "Size, floor and price exactly as the owner provides", cta: "WhatsApp for details", requires: ["role:broker", "has:agentrera"], repeatable: true, boosts: ["primary:resale"] },
  { id: "EP24", format: "post", pillar: "project", who: "Oryza designs", note: "Agent RERA registration on the creative and caption: {agent_rera}. Listing details exactly as the owner provides.", title: "To let: home for rent", hook: "Rent, deposit and terms exactly as the owner provides", cta: "WhatsApp for details", requires: ["role:broker", "has:agentrera"], repeatable: true, boosts: ["primary:resale"] },
  { id: "EP25", format: "post", pillar: "guides", who: "Oryza designs", title: "Renting a home: an agreement checklist", hook: "Rent, deposit, lock-in, maintenance and police verification", cta: "Save this", requires: ["role:broker"], boosts: ["primary:resale"] },
  { id: "EP26", format: "post", pillar: "location", who: "Oryza designs", title: "Neighbourhood guide: {city}", hook: "Schools, hospitals, markets and transport — a factual carousel", cta: "Save for your shortlist" },
  { id: "EP27", format: "post", pillar: "trust", who: "Oryza designs", title: "This week at {brand}", hook: "Site, office and team moments from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "EP28", format: "post", pillar: "guides", who: "Oryza designs", title: "Your payment plan, explained", hook: "Construction-linked vs down-payment plans — how each works (general guidance)", cta: "Ask us about the payment plan", boosts: ["primary:inventory"] },
];

const stories: Template[] = [
  { id: "ES01", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Poll: what matters most in a new home?", hook: "Location or size — vote" },
  { id: "ES02", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Question box: ask about buying a home", hook: "Answers shared this week" },
  { id: "ES03", format: "story", pillar: "progress", who: "Oryza shoots", repeatable: true, title: "On site today", hook: "Quick clips from the site, dated" },
  { id: "ES04", format: "story", pillar: "project", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "ES05", format: "story", pillar: "project", who: "Oryza designs", repeatable: true, title: "Site visits: {visit}", hook: "Tap to book a visit", requires: ["has:visit"] },
  { id: "ES06", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Quiz: carpet or built-up?", hook: "Answer in the next story" },
  { id: "ES07", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Buyer tip of the day", hook: "One line, one check before you book" },
  { id: "ES08", format: "story", pillar: "trust", who: "Oryza shoots", repeatable: true, title: "Behind the scenes at {brand}", hook: "Office and team moments" },
  { id: "ES09", format: "story", pillar: "location", who: "Oryza designs", repeatable: true, title: "Know your area: {city}", hook: "One fact about a nearby place" },
  { id: "ES10", format: "story", pillar: "trust", who: "Oryza designs", repeatable: true, faces: true, title: "Messages from our buyers", hook: "Reposted only with the buyer's written permission", requires: ["consent:yes"] },
];

export const realEstateRules = [
  "Every project post and reel shows the RERA registration number and the RERA website exactly as you provide them. A project without a RERA number gets brand and educational content only — no selling or booking content.",
  "No assured returns, guaranteed appreciation, “investment that doubles”, rental guarantees or comparisons with other builders.",
  "Prices only as you provide them, shown as given with “terms apply”. No invented offers — festive offers only when you provide them.",
  "Possession dates only as declared to RERA. Every render is labelled “Artist's impression”, and amenities are never shown as ready before they are.",
  "No fake urgency — no “sold out”, “only 2 left” or “last few units”.",
  "Buyers appear only with their written consent.",
];

export const realEstatePlaybook: Playbook = {
  category: "real-estate",
  audiences: [
    { name: "Families buying their first or next home", share: 45, needs: "Location, trust in the builder, progress they can see, clear prices and documents" },
    { name: "Buyers comparing projects", share: 25, needs: "Facts: RERA status, sizes, possession dates, amenities that exist" },
    { name: "Existing buyers and owners", share: 15, needs: "Construction updates, handover information, a builder who communicates" },
    { name: "Tenants and resale buyers", share: 15, needs: "Verified listings, clear terms, an agent they can trust" },
  ],
  pillars: [
    { id: "project", name: "Projects and homes", share: 30 },
    { id: "progress", name: "Construction progress and quality", share: 20 },
    { id: "location", name: "Location and neighbourhood", share: 15 },
    { id: "guides", name: "Buyer guides", share: 20 },
    { id: "trust", name: "The builder and the team", share: 15 },
  ],
  tone: "Factual, confident and calm. Bilingual Hindi–English captions. Numbers only as provided; no hype, no pressure.",
  rules: realEstateRules,
  templates: [...reels, ...posts, ...stories],
};

export const realEstateOptions = {
  roles: [
    { id: "builder", label: "Builder" },
    { id: "developer", label: "Developer" },
    { id: "broker", label: "Broker or channel partner" },
  ],
  goals: [
    { id: "visits", label: "Site visits" },
    { id: "enquiries", label: "Enquiries for a project" },
    { id: "trust", label: "Brand trust for the builder" },
    { id: "launch", label: "Project launch" },
    { id: "inventory", label: "Sell remaining inventory" },
    { id: "resale", label: "Resale and rental leads" },
  ],
  stages: [
    { id: "prelaunch", label: "Pre-launch" },
    { id: "uc", label: "Under construction" },
    { id: "ready", label: "Ready to move" },
  ],
  types: [
    { id: "apartments", label: "Apartments" },
    { id: "villas", label: "Villas or independent floors" },
    { id: "plots", label: "Plots" },
    { id: "commercial", label: "Commercial" },
  ],
  amenities: [
    { id: "security", label: "24×7 security" },
    { id: "parking", label: "Covered parking" },
    { id: "power", label: "Power backup" },
    { id: "lifts", label: "Lifts" },
    { id: "park", label: "Park or green area" },
    { id: "club", label: "Clubhouse" },
    { id: "gym", label: "Gym" },
    { id: "pool", label: "Swimming pool" },
    { id: "play", label: "Play area" },
  ],
  events: [
    { id: "visitday", label: "Site-visit weekend" },
    { id: "expo", label: "Property expo" },
    { id: "bhoomi", label: "Bhoomi pujan" },
    { id: "handover", label: "Handover ceremony" },
    { id: "festive", label: "Festive buying day (date you've verified)" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Festival buying periods whose dates change every year: never auto-pinned — verify the date yearly, then add it as an event. */
export const buyingFestivals = [
  { name: "Gudi Padwa", months: [3, 4] },
  { name: "Akshaya Tritiya", months: [4, 5] },
  { name: "Navratri", months: [9, 10] },
  { name: "Dhanteras", months: [10, 11] },
];
