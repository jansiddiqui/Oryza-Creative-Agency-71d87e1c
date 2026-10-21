import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Retail & showrooms playbook v1 (clothing, electronics, furniture, mobile shops, general stores) — written by
 * Oryza strategists, consumed by the rule engine.
 * Variables: {brand} {city} {category} {categories_list} {brands_line} {price_range} {emi} {exchange} {delivery}
 * {timings} {branches} {warranty} {event} {offer}
 * Tags: type:clothing|electronics|furniture|mobile|general, has:brands, has:price, has:emi, has:exchange,
 * has:delivery, has:timings, has:branches, has:warranty, cam:*, consent:yes, has:event.
 * No template names or shows a brand; brand names appear only from the client's own list ({brands_line}).
 */

/** Wording the engine never publishes for retail: price superlatives, fake urgency and unverifiable claims. */
export const RETAIL_BANNED_WORDING =
  /\b(lowest|cheapest|best|no\.?\s?1|number one|guaranteed lowest|price match\w*|hurry|last chance|limited stock|only \d+ left|selling fast|while stocks? last|stocks? running out|grab (it|them) now|unbeatable|guaranteed?|original guaranteed)\b|100\s?%|#1/i;

export { EARLIER_PRICE } from "../compliance-common";

const AS_PROVIDED = "Prices, MRP, offers, EMI and warranty terms only exactly as you provided them.";
const BRANDS = "Brand names only from the list of brands you sell; no brand logos.";
const CONSENT = "Customers appear only with their written consent.";

const reels: Template[] = [
  { id: "RR01", format: "reel", pillar: "products", who: "Oryza shoots", note: BRANDS, title: "New arrivals: {category}", hook: "What just came in — real stock, filmed in the store", shots: ["Shelf or rack walk-through", "Three products close-up", "Price tags only if you want them shown"], cta: "Visit or WhatsApp to check stock", requires: ["has:categories"], repeatable: true, boosts: ["primary:footfall", "primary:launch"] },
  { id: "RR02", format: "reel", pillar: "guides", who: "Oryza edits", title: "How to choose: {category}", hook: "Three things to check before you buy — size, use and after-sales", cta: "Save this before you shop", requires: ["has:categories"], repeatable: true, boosts: ["primary:trust"] },
  { id: "RR03", format: "reel", pillar: "products", who: "Oryza shoots", note: BRANDS, title: "Product demo: see it working", hook: "One product, the features people ask about, shown in 30 seconds", shots: ["Product in use", "Close-ups of controls or details", "Staff explaining one feature (15 s)"], cta: "Book a home demo or visit", repeatable: true, blockedBy: ["type:clothing"], boosts: ["primary:footfall"] },
  { id: "RR04", format: "reel", pillar: "store", who: "Oryza shoots", title: "Walk through {brand}", hook: "Every section of the store in 30 seconds — so you know where to go", shots: ["Entrance", "Section by section", "Billing counter"], cta: "Save the location", boosts: ["primary:footfall"] },
  { id: "RR05", format: "reel", pillar: "people", who: "Oryza shoots", title: "Staff pick of the week", hook: "Our team's favourite — and who it's for", shots: ["Staff member with the product (20 s)"], cta: "Ask for it in store", blockedBy: ["cam:none"], repeatable: true },
  { id: "RR06", format: "reel", pillar: "offers", who: "Oryza edits", note: AS_PROVIDED, title: "EMI options, explained", hook: "{emi}", cta: "Ask our team for the details", requires: ["has:emi"], boosts: ["primary:sales"] },
  { id: "RR07", format: "reel", pillar: "offers", who: "Oryza edits", note: AS_PROVIDED, title: "Exchange your old one", hook: "{exchange}", cta: "Bring it in for a valuation", requires: ["has:exchange"], boosts: ["primary:sales"] },
  { id: "RR08", format: "reel", pillar: "store", who: "Oryza shoots", title: "How to reach {brand}", hook: "From a landmark to our door — parking included", shots: ["Drive or walk from a landmark", "Signboard and entrance", "Parking"], cta: "Save the location", boosts: ["primary:footfall"] },
  { id: "RR09", format: "reel", pillar: "people", who: "Oryza shoots", faces: true, note: CONSENT, title: "Customer moments", hook: "Real customers, real purchases — filmed with permission", shots: ["Customer with their purchase (written consent)"], cta: "Tag us when you shop", requires: ["consent:yes"], boosts: ["primary:reviews"] },
  { id: "RR10", format: "reel", pillar: "services", who: "Oryza shoots", note: "Delivery and demo terms only as you provided them.", title: "Home delivery and demo", hook: "{delivery}", shots: ["Delivery van or packing", "Installation or demo at home (customer consent)"], cta: "Ask about delivery", requires: ["has:delivery"] },
  { id: "RR11", format: "reel", pillar: "guides", who: "Oryza edits", title: "Care tips: make it last", hook: "Simple care that keeps your purchase like new", cta: "Save this", repeatable: true },
  { id: "RR12", format: "reel", pillar: "guides", who: "Oryza edits", title: "Size and fit guide", hook: "How to measure yourself — and what to try in store", cta: "Save before you shop", requires: ["type:clothing"] },
  { id: "RR13", format: "reel", pillar: "guides", who: "Oryza edits", title: "Measure your room first", hook: "Three measurements to take before buying furniture", cta: "Save this", requires: ["type:furniture"] },
  { id: "RR14", format: "reel", pillar: "guides", who: "Oryza edits", title: "Setting up your new device", hook: "First steps after you buy — data, updates, accessories", cta: "Ask us for help in store", requires: ["type:mobile"] },
  { id: "RR15", format: "reel", pillar: "guides", who: "Oryza edits", title: "Before you buy an appliance", hook: "Capacity, power use and space — a quick checklist", cta: "Save this", requires: ["type:electronics"] },
  { id: "RR16", format: "reel", pillar: "store", who: "Oryza shoots", title: "Behind the counter at {brand}", hook: "Unpacking new stock and setting up the displays", shots: ["Stock arriving", "Arranging displays"], cta: "Follow for new arrivals" },
  { id: "RR17", format: "reel", pillar: "people", who: "Oryza shoots", title: "Meet the team at {brand}", hook: "Who will help you when you walk in", shots: ["Team intro (consent)", "Team at work"], cta: "Say hello on your next visit", blockedBy: ["cam:none"] },
  { id: "RR18", format: "reel", pillar: "products", who: "Oryza edits", title: "Gift ideas from {brand}", hook: "Gifts for different budgets — from what's in stock", cta: "Visit or WhatsApp", repeatable: true, minDay: 5 },
  { id: "RR19", format: "reel", pillar: "offers", who: "Oryza edits", note: AS_PROVIDED, title: "{event}: offer you provided", hook: "{offer}", cta: "Visit during the sale dates", pinnedOnly: true, repeatable: true },
  { id: "RR20", format: "reel", pillar: "offers", who: "Oryza shoots", title: "{event} at {brand}", hook: "The new collection or launch, filmed in the store", shots: ["Launch display", "Close-ups"], cta: "Visit this week", pinnedOnly: true, repeatable: true },
  { id: "RR21", format: "reel", pillar: "store", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "RR22", format: "reel", pillar: "store", who: "Oryza shoots", title: "Weekend at {brand}", hook: "What's on the floor this weekend and our timings", shots: ["Store wide, busy hours", "Featured section"], cta: "Visit this weekend", repeatable: true, minDay: 4, boosts: ["primary:weekend"] },
  { id: "RR23", format: "reel", pillar: "services", who: "Oryza edits", note: AS_PROVIDED, title: "Warranty and after-sales, explained", hook: "{warranty}", cta: "Ask our team", requires: ["has:warranty"] },
  { id: "RR24", format: "reel", pillar: "products", who: "Oryza shoots", note: BRANDS, title: "Brands you'll find here", hook: "{brands_line}", shots: ["Shelves by brand (no logos in close-up)"], cta: "Ask for your brand in store", requires: ["has:brands"] },
];

const posts: Template[] = [
  { id: "RP01", format: "post", pillar: "store", who: "Oryza designs", title: "Timings and location", hook: "{timings}. Location pin and parking", cta: "Save this", requires: ["has:timings"], boosts: ["primary:footfall"] },
  { id: "RP02", format: "post", pillar: "products", who: "Oryza designs", note: BRANDS, title: "New in: {category}", hook: "A carousel of what just arrived", cta: "Visit or WhatsApp", requires: ["has:categories"], repeatable: true },
  { id: "RP03", format: "post", pillar: "guides", who: "Oryza designs", title: "Buyer's guide: {category}", hook: "What to compare, what to ask, what to check at billing", cta: "Save before you shop", requires: ["has:categories"], repeatable: true, boosts: ["primary:trust"] },
  { id: "RP04", format: "post", pillar: "offers", who: "Oryza designs", note: AS_PROVIDED, title: "EMI and payment options", hook: "{emi}", cta: "Ask our team", requires: ["has:emi"] },
  { id: "RP05", format: "post", pillar: "offers", who: "Oryza designs", note: AS_PROVIDED, title: "Exchange offer details", hook: "{exchange}", cta: "Bring it in", requires: ["has:exchange"] },
  { id: "RP06", format: "post", pillar: "store", who: "Oryza designs", title: "Our branches", hook: "{branches}", cta: "Find the one near you", requires: ["has:branches"] },
  { id: "RP07", format: "post", pillar: "products", who: "Oryza designs", note: AS_PROVIDED, title: "What it costs at {brand}", hook: "{price_range}", cta: "Visit or WhatsApp", requires: ["has:price"] },
  { id: "RP08", format: "post", pillar: "offers", who: "Oryza designs", note: AS_PROVIDED, title: "{event}", hook: "{offer}", cta: "Visit during the sale dates", pinnedOnly: true, repeatable: true },
  { id: "RP09", format: "post", pillar: "offers", who: "Oryza designs", title: "Coming soon: {event}", hook: "Dates and what to expect — details as you provide", cta: "Save the date", pinnedOnly: true, repeatable: true },
  { id: "RP10", format: "post", pillar: "store", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting — no offers unless you provided one", pinnedOnly: true, repeatable: true },
  { id: "RP11", format: "post", pillar: "people", who: "Oryza designs", title: "Your review helps others shop", hook: "If we helped you, an honest Google review helps — never paid, never scripted", cta: "Leave an honest review", boosts: ["primary:reviews"] },
  { id: "RP12", format: "post", pillar: "people", who: "Oryza designs", faces: true, note: CONSENT, title: "A customer's words", hook: "A real review, shared with permission", cta: "Visit us", requires: ["consent:yes"] },
  { id: "RP13", format: "post", pillar: "guides", who: "Oryza designs", title: "Questions to ask before you buy", hook: "Warranty, delivery, installation, returns — a checklist", cta: "Save this", boosts: ["primary:trust"] },
  { id: "RP14", format: "post", pillar: "services", who: "Oryza designs", title: "Home delivery and demo", hook: "{delivery}", cta: "Ask about delivery", requires: ["has:delivery"] },
  { id: "RP15", format: "post", pillar: "products", who: "Oryza designs", title: "Staff picks", hook: "Three favourites from our team, and why", cta: "Ask for them in store", repeatable: true },
  { id: "RP16", format: "post", pillar: "guides", who: "Oryza designs", title: "Care guide", hook: "How to clean, store and look after it", cta: "Save this", repeatable: true },
  { id: "RP17", format: "post", pillar: "store", who: "Oryza designs", title: "This week at {brand}", hook: "Store moments from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "RP18", format: "post", pillar: "products", who: "Oryza designs", title: "What we sell", hook: "{categories_list} — all under one roof", cta: "Visit or WhatsApp", requires: ["has:categories"], boosts: ["primary:footfall"] },
  { id: "RP19", format: "post", pillar: "services", who: "Oryza designs", title: "Warranty and after-sales", hook: "{warranty}", cta: "Ask our team", requires: ["has:warranty"] },
  { id: "RP20", format: "post", pillar: "guides", who: "Oryza designs", title: "Choosing within your budget", hook: "What to prioritise at each budget — no price claims", cta: "Ask our team for options", boosts: ["primary:sales"] },
  { id: "RP21", format: "post", pillar: "store", who: "Oryza designs", title: "Find us on Google Maps", hook: "Directions, timings and photos in one tap", cta: "Save the location", boosts: ["primary:footfall", "primary:reviews"] },
  { id: "RP22", format: "post", pillar: "products", who: "Oryza designs", note: BRANDS, title: "Brands at {brand}", hook: "{brands_line}", cta: "Ask for your brand", requires: ["has:brands"] },
  { id: "RP23", format: "post", pillar: "store", who: "Oryza designs", title: "Weekend at {brand}", hook: "Timings and what's new on the floor", cta: "Visit this weekend", pinnedOnly: true, repeatable: true },
  { id: "RP24", format: "post", pillar: "guides", who: "Oryza designs", title: "Wardrobe basics", hook: "Pieces that work for every season — from our racks", cta: "Visit or WhatsApp", requires: ["type:clothing"] },
  { id: "RP25", format: "post", pillar: "guides", who: "Oryza designs", title: "Room-by-room furniture guide", hook: "What fits where, with measurements to take", cta: "Save this", requires: ["type:furniture"] },
  { id: "RP26", format: "post", pillar: "guides", who: "Oryza designs", title: "Phone buying checklist", hook: "Storage, battery, camera, service — what to compare", cta: "Save this", requires: ["type:mobile"] },
  { id: "RP28", format: "post", pillar: "offers", who: "Oryza designs", title: "Now on: {event}", hook: "Sale dates and store timings — ask in store for the details", cta: "Visit during the sale dates", pinnedOnly: true, repeatable: true },
  { id: "RP27", format: "post", pillar: "guides", who: "Oryza designs", title: "Everyday essentials list", hook: "A monthly shopping checklist you can save", cta: "Save and share", requires: ["type:general"] },
];

const stories: Template[] = [
  { id: "RS01", format: "story", pillar: "products", who: "Oryza designs", repeatable: true, title: "Poll: which one would you pick?", hook: "Two products to choose from" },
  { id: "RS02", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, title: "Question box: ask our team", hook: "Answers this week" },
  { id: "RS03", format: "story", pillar: "store", who: "Oryza shoots", repeatable: true, title: "In the store today", hook: "Quick clips from the floor" },
  { id: "RS04", format: "story", pillar: "offers", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "RS05", format: "story", pillar: "store", who: "Oryza designs", repeatable: true, title: "Open today: {timings}", hook: "Tap for directions", requires: ["has:timings"] },
  { id: "RS06", format: "story", pillar: "products", who: "Oryza designs", repeatable: true, title: "Just arrived", hook: "One new product" },
  { id: "RS07", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Quiz: true or false?", hook: "Answer in the next story" },
  { id: "RS08", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, faces: true, title: "Your tags", hook: "Reposted only with permission", requires: ["consent:yes"] },
  { id: "RS09", format: "story", pillar: "guides", who: "Oryza designs", repeatable: true, title: "Tip of the day", hook: "One quick buying or care tip" },
  { id: "RS10", format: "story", pillar: "store", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "This weekend at {brand}", hook: "Timings and what's new" },
];

export const retailRules = [
  "Prices, MRP and offers only exactly as you provide them. A “was ₹X, now ₹Y” offer appears only when you confirm the earlier price was real.",
  "No “lowest price”, “best” or “No.1” claims and no fake stock urgency (“only 2 left”, “while stocks last”).",
  "EMI, exchange and warranty terms only exactly as you provide them.",
  "Brand names only for brands you actually sell, from your list — no brand logos in our templates.",
  "Customers appear only with their written consent; reviews are always honest, never paid or scripted.",
];

export const retailPlaybook: Playbook = {
  category: "retail-showrooms",
  audiences: [
    { name: "Shoppers comparing options nearby", share: 40, needs: "What's in stock, fair prices, a store they can trust" },
    { name: "Families making a big purchase", share: 25, needs: "Guidance, demos, EMI and after-sales clarity" },
    { name: "Regular customers", share: 20, needs: "New arrivals, sale dates, quick help" },
    { name: "Gift buyers", share: 15, needs: "Ideas by budget, timings, packing" },
  ],
  pillars: [
    { id: "products", name: "Products and new arrivals", share: 30 },
    { id: "guides", name: "Buyer and care guides", share: 25 },
    { id: "store", name: "Store, timings and location", share: 15 },
    { id: "offers", name: "Sales, EMI and exchange (as provided)", share: 15 },
    { id: "people", name: "Team and customers", share: 10 },
    { id: "services", name: "Delivery, demo and after-sales", share: 5 },
  ],
  tone: "Helpful, clear and local. Bilingual Hindi–English captions. Facts and prices only as provided; no pressure.",
  rules: retailRules,
  templates: [...reels, ...posts, ...stories],
};

export const retailOptions = {
  types: [
    { id: "clothing", label: "Clothing and footwear" },
    { id: "electronics", label: "Electronics and appliances" },
    { id: "furniture", label: "Furniture and home" },
    { id: "mobile", label: "Mobile phones and accessories" },
    { id: "general", label: "General or department store" },
  ],
  goals: [
    { id: "footfall", label: "More store visits" },
    { id: "sales", label: "Sale and festive season sales" },
    { id: "launch", label: "New arrivals or launch" },
    { id: "weekend", label: "Weekend rush" },
    { id: "trust", label: "Trust and buyer guidance" },
    { id: "reviews", label: "More Google reviews" },
  ],
  events: [
    { id: "sale", label: "Sale (dates and offer you provide)" },
    { id: "launch", label: "New collection or product launch" },
    { id: "festive", label: "Festive season (date you've verified)" },
    { id: "opening", label: "New branch opening" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Shopping festivals whose date changes every year: never auto-pinned — add one as an event once verified. */
export const retailFestivals = [
  { name: "Navratri", months: [9, 10] },
  { name: "Dhanteras", months: [10, 11] },
  { name: "Diwali", months: [10, 11] },
  { name: "Eid", months: [] as number[] },
  { name: "Wedding season", months: [11, 12, 1, 2] },
];
