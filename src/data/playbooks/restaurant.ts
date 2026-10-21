import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Restaurants & cafés playbook v1 (also cloud kitchens, sweet shops, bakeries, dhabas) — written by Oryza
 * strategists, consumed by the rule engine.
 * Variables: {brand} {city} {cuisine} {timings} {order_line} {delivery_line} {price} {fssai_line} {event}
 * {special} and, per signature dish, {dish} {dish_label} {allergens}.
 * Tags: type:*, food:veg|nonveg|both, has:dinein, has:takeaway, has:delivery, has:whatsapp, has:party,
 * has:catering, has:fssai, has:price, has:dishes, has:timings, kitchen:yes, cam:*, consent:yes, season:*.
 */

/**
 * Wording the engine never publishes for food businesses: alcohol (including surrogates), health or medical
 * claims about food, superlatives and fake urgency.
 */
export const RESTAURANT_BANNED_WORDING =
  /\b(alcohol\w*|liquor|beers?|wines?|whisk(e)?y|vodka|rum|gin|tequila|cocktails?|bar nights?|happy hours?|pubs?|brewer(y|ies)|daaru|sharab|theka|on the rocks|pegs?|cures?|cured|immunity|boosts? immunity|no side effects|detox|weight loss|medicinal|healing|guilt[- ]free|best|no\.?\s?1|number one|world'?s|famous|hurry|last chance|limited (time|period|stock)|only \d+ left|selling fast|guaranteed?)\b|(?<!(chocolate|protein|granola|snack|candy|cereal|ice[- ]cream) )\bbars?\b|100\s?%|#1/i;

const DISH = "Veg / non-veg / egg mark exactly as on your menu: {dish_label}.{allergens}";
const CONSENT = "Customers appear only with their written consent; never a paid or scripted review.";
/** Filled with the FSSAI line only when the client gave the number and wants it shown; otherwise empty. */
const FSSAI = "{fssai_line}";

const reels: Template[] = [
  { id: "FR01", format: "reel", pillar: "food", who: "Oryza shoots", note: DISH, title: "Dish of the week: {dish}", hook: "From the pan to the plate in 20 seconds — no filters on the food", shots: ["Close-up of the dish being plated", "Steam / texture shot", "Served at the table or packed for delivery"], cta: "Order or visit this week", requires: ["has:dishes"], repeatable: true, boosts: ["primary:footfall", "primary:orders"] },
  { id: "FR02", format: "reel", pillar: "kitchen", who: "Oryza shoots", note: FSSAI, title: "How we keep our kitchen clean", hook: "The cleaning and hygiene routine behind every order", shots: ["Hand-washing and gloves", "Cleaning the counters", "Fresh ingredients being sorted"], cta: "Ask us anything about our kitchen", requires: ["kitchen:yes"], boosts: ["primary:reviews"] },
  { id: "FR03", format: "reel", pillar: "people", who: "Oryza shoots", title: "Meet the cook behind {brand}", hook: "One cook, one story, one dish they're proud of", shots: ["Cook intro to camera (20 s)", "Cooking the dish", "Team in the kitchen"], cta: "Follow for more from our kitchen", requires: ["kitchen:yes"], blockedBy: ["cam:none"] },
  { id: "FR04", format: "reel", pillar: "food", who: "Oryza shoots", note: DISH, title: "How {dish} is made", hook: "The steps, the spices and the timing — our way", shots: ["Ingredients laid out", "Cooking steps", "Final plating"], cta: "Order it today", requires: ["has:dishes", "kitchen:yes"], boosts: ["primary:launch"] },
  { id: "FR05", format: "reel", pillar: "people", who: "Oryza shoots", faces: true, note: CONSENT, title: "Customer moments", hook: "Real reactions, filmed with permission — no scripts", shots: ["Customers enjoying a meal (written consent)", "Table wide shot"], cta: "Tag us when you visit", requires: ["consent:yes", "has:dinein"], boosts: ["primary:reviews", "primary:footfall"] },
  { id: "FR06", format: "reel", pillar: "order", who: "Oryza edits", title: "How to order from {brand}", hook: "{order_line}", cta: "Save this for your next order", requires: ["has:whatsapp"], boosts: ["primary:orders"] },
  { id: "FR07", format: "reel", pillar: "order", who: "Oryza shoots", title: "How to reach {brand}", hook: "From the main road to our door in 20 seconds", shots: ["Drive or walk from a landmark", "Entrance and signboard", "Parking or nearby stop"], cta: "Save the location", requires: ["has:dinein"], boosts: ["primary:footfall"] },
  { id: "FR08", format: "reel", pillar: "food", who: "Oryza shoots", title: "What's on our {cuisine} menu", hook: "A quick tour of the menu — names and marks exactly as printed", shots: ["Menu card close-ups", "Three dishes plated"], cta: "Order or visit", boosts: ["primary:launch", "primary:footfall"] },
  { id: "FR09", format: "reel", pillar: "occasions", who: "Oryza shoots", title: "Book your party at {brand}", hook: "The space, the set-up and how to book — details as you provide", shots: ["Party space wide", "Table set-up", "Manager on how to book (15 s)"], cta: "WhatsApp to book", requires: ["has:party"], blockedBy: ["cam:none"], boosts: ["primary:parties"] },
  { id: "FR10", format: "reel", pillar: "occasions", who: "Oryza shoots", title: "Catering by {brand}", hook: "Food for your family function or office event — how it works", shots: ["Catering set-up", "Food being packed for an event", "Serving line"], cta: "WhatsApp for a catering quote", requires: ["has:catering"], boosts: ["primary:parties"] },
  { id: "FR11", format: "reel", pillar: "kitchen", who: "Oryza shoots", title: "Morning prep at {brand}", hook: "What happens before we open — fresh prep, every day", shots: ["Opening the shutters", "Chopping and prep", "First order of the day"], cta: "Follow for more", requires: ["kitchen:yes"] },
  { id: "FR12", format: "reel", pillar: "people", who: "Oryza shoots", title: "Thank you to our team", hook: "The people who make every plate — names only with their consent", shots: ["Team at work", "Team photo"], cta: "Say thanks in the comments", requires: ["kitchen:yes"] },
  { id: "FR13", format: "reel", pillar: "food", who: "Oryza shoots", title: "Winter specials: something warm", hook: "Hot drinks and warm plates for the season — from your menu", shots: ["Steam close-ups", "Hands around a cup"], cta: "Visit or order today", requires: ["season:winter"] },
  { id: "FR14", format: "reel", pillar: "food", who: "Oryza shoots", title: "Summer coolers", hook: "Cold drinks and light plates for the heat — from your menu", shots: ["Pouring a cooler", "Ice and glass close-ups"], cta: "Visit or order today", requires: ["season:summer"] },
  { id: "FR15", format: "reel", pillar: "food", who: "Oryza shoots", title: "Monsoon cravings", hook: "Rain outside, something hot inside — our monsoon picks", shots: ["Rain b-roll from the window", "Hot snack close-up"], cta: "Order in or visit", requires: ["season:monsoon"] },
  { id: "FR16", format: "reel", pillar: "occasions", who: "Oryza shoots", title: "Now open: {event}", hook: "What's new, timings and how to find us", shots: ["New outlet or menu reveal", "Team welcome"], cta: "Visit this week", pinnedOnly: true, repeatable: true },
  { id: "FR17", format: "reel", pillar: "occasions", who: "Oryza edits", title: "{event}: highlights", hook: "The day in 30 seconds", cta: "Follow for the next one", pinnedOnly: true, repeatable: true },
  { id: "FR18", format: "reel", pillar: "occasions", who: "Oryza shoots", note: "Special exactly as you provided it — dish names, prices and dates.", title: "{event} special at {brand}", hook: "{special}", shots: ["The special plated", "Festive table set-up"], cta: "Order or book a table", pinnedOnly: true, repeatable: true },
  { id: "FR19", format: "reel", pillar: "food", who: "Oryza edits", title: "Thali / combo explained", hook: "What comes in it, plate by plate — names exactly as on the menu", cta: "Order the combo", boosts: ["primary:orders"] },
  { id: "FR20", format: "reel", pillar: "kitchen", who: "Oryza shoots", title: "Where our ingredients come from", hook: "Morning market run or supplier delivery — fresh, checked, stored right", shots: ["Ingredients arriving", "Checking and storing"], cta: "Ask us about our ingredients", requires: ["kitchen:yes"] },
  { id: "FR21", format: "reel", pillar: "order", who: "Oryza edits", title: "Packed with care", hook: "How your delivery order is packed so it arrives hot and sealed", cta: "Order online", requires: ["has:delivery"], boosts: ["primary:orders"] },
  { id: "FR22", format: "reel", pillar: "people", who: "Oryza edits", title: "Your reviews, our thanks", hook: "We read every review — thank you to everyone who shared honest feedback", cta: "Leave an honest Google review", boosts: ["primary:reviews"] },
  { id: "FR23", format: "reel", pillar: "food", who: "Oryza shoots", note: DISH, title: "Weekend plate: {dish}", hook: "What to order this weekend", shots: ["Dish hero shot", "Table setting"], cta: "Book a table or order in", requires: ["has:dishes"], repeatable: true, boosts: ["primary:weekend"] },
  { id: "FR24", format: "reel", pillar: "food", who: "Oryza shoots", title: "Fresh from the oven", hook: "Breads, cakes and bakes as they come out — filmed in our kitchen", shots: ["Oven door opening", "Tray close-ups"], cta: "Visit or pre-order", requires: ["type:bakery"] },
  { id: "FR25", format: "reel", pillar: "food", who: "Oryza shoots", title: "Sweets being made", hook: "Hands, heat and patience — how our mithai is made", shots: ["Halwai at work", "Sweets being cut and arranged"], cta: "Visit or order a box", requires: ["type:sweets"] },
];

const posts: Template[] = [
  { id: "FP01", format: "post", pillar: "order", who: "Oryza designs", note: FSSAI, title: "Timings and how to find us", hook: "{timings}. Location pin, parking and phone", cta: "Save this", requires: ["has:timings"], boosts: ["primary:footfall"] },
  { id: "FP02", format: "post", pillar: "food", who: "Oryza designs", note: DISH, title: "Signature: {dish}", hook: "Our most-ordered plate — name and mark exactly as on the menu", cta: "Order or visit", requires: ["has:dishes"], repeatable: true },
  { id: "FP03", format: "post", pillar: "order", who: "Oryza designs", title: "Order online", hook: "{delivery_line}", cta: "Order now", requires: ["has:delivery"], boosts: ["primary:orders"] },
  { id: "FP04", format: "post", pillar: "order", who: "Oryza designs", title: "Order on WhatsApp", hook: "{order_line}", cta: "Message us to order", requires: ["has:whatsapp"], boosts: ["primary:orders"] },
  { id: "FP05", format: "post", pillar: "food", who: "Oryza designs", title: "Our {cuisine} menu", hook: "A carousel of the menu — dishes, marks and prices exactly as printed", cta: "Save the menu", boosts: ["primary:launch"] },
  { id: "FP06", format: "post", pillar: "food", who: "Oryza designs", note: "Price range exactly as you provided it.", title: "What it costs at {brand}", hook: "{price}", cta: "Visit or order", requires: ["has:price"] },
  { id: "FP07", format: "post", pillar: "occasions", who: "Oryza designs", title: "{event} wishes from {brand}", hook: "A warm greeting — no offers unless you provided one", pinnedOnly: true, repeatable: true },
  { id: "FP08", format: "post", pillar: "occasions", who: "Oryza designs", note: "Special exactly as you provided it — dish names, prices and dates.", title: "{event} special", hook: "{special}", cta: "Pre-order or book a table", pinnedOnly: true, repeatable: true },
  { id: "FP09", format: "post", pillar: "occasions", who: "Oryza designs", title: "Now open: {event}", hook: "What's new, timings and how to find us", cta: "Visit this week", pinnedOnly: true, repeatable: true },
  { id: "FP10", format: "post", pillar: "occasions", who: "Oryza designs", title: "Join us: {event}", hook: "Date, time and how to book a table", cta: "WhatsApp to book", pinnedOnly: true, repeatable: true },
  { id: "FP11", format: "post", pillar: "occasions", who: "Oryza designs", title: "Weekend at {brand}", hook: "Timings, what to order and how to book a table", cta: "Book a table", pinnedOnly: true, repeatable: true },
  { id: "FP12", format: "post", pillar: "occasions", who: "Oryza designs", title: "Party and group bookings", hook: "Space, seating and how to book — details as you provide", cta: "WhatsApp to book", requires: ["has:party"], boosts: ["primary:parties"] },
  { id: "FP13", format: "post", pillar: "occasions", who: "Oryza designs", title: "Catering for your function", hook: "Menus, minimum orders and how to get a quote — as you provide", cta: "WhatsApp for a quote", requires: ["has:catering"], boosts: ["primary:parties"] },
  { id: "FP14", format: "post", pillar: "kitchen", who: "Oryza designs", note: FSSAI, title: "Our hygiene promise", hook: "Clean kitchen, fresh stock, trained staff — what we do every day", cta: "Ask us anything", boosts: ["primary:reviews"] },
  { id: "FP15", format: "post", pillar: "people", who: "Oryza designs", title: "Your feedback helps others find us", hook: "If you enjoyed your meal, an honest Google review helps — never paid, never scripted", cta: "Leave an honest review", boosts: ["primary:reviews"] },
  { id: "FP16", format: "post", pillar: "people", who: "Oryza designs", faces: true, note: CONSENT, title: "A customer's words", hook: "A real review, shared with the customer's permission", cta: "Visit us", requires: ["consent:yes"], boosts: ["primary:reviews"] },
  { id: "FP17", format: "post", pillar: "people", who: "Oryza designs", title: "Meet the team", hook: "Who cooks, who serves, who packs — names with consent", cta: "Say hello on your next visit" },
  { id: "FP18", format: "post", pillar: "food", who: "Oryza designs", title: "Thali / combo guide", hook: "What's in each combo — names and marks exactly as on the menu", cta: "Order a combo", boosts: ["primary:orders"] },
  { id: "FP19", format: "post", pillar: "food", who: "Oryza designs", title: "Seasonal menu", hook: "What's new for the season — dishes and prices as you provide", cta: "Try it this week", repeatable: true, minDay: 7 },
  { id: "FP20", format: "post", pillar: "order", who: "Oryza designs", title: "Dine in, take away or delivery", hook: "Every way to enjoy {brand}, in one card", cta: "Save this" },
  { id: "FP21", format: "post", pillar: "kitchen", who: "Oryza designs", title: "Behind the counter", hook: "A photo story from today's prep", cta: "Follow for more", requires: ["kitchen:yes"], repeatable: true, minDay: 5 },
  { id: "FP22", format: "post", pillar: "food", who: "Oryza designs", note: DISH, title: "Pair it: {dish}", hook: "What to order with it — sides and drinks from your menu", cta: "Order or visit", requires: ["has:dishes"], repeatable: true },
  { id: "FP23", format: "post", pillar: "people", who: "Oryza designs", title: "This week at {brand}", hook: "Kitchen, counter and team moments from the week", cta: "Follow for more", repeatable: true, minDay: 7 },
  { id: "FP24", format: "post", pillar: "order", who: "Oryza designs", title: "Find us on Google Maps", hook: "Tap for directions — and see our timings and photos", cta: "Save the location", requires: ["has:dinein"], boosts: ["primary:footfall", "primary:reviews"] },
  { id: "FP25", format: "post", pillar: "food", who: "Oryza designs", title: "Allergens and dietary notes", hook: "How to ask about ingredients before you order", cta: "Ask our team", requires: ["has:allergens"] },
  { id: "FP26", format: "post", pillar: "food", who: "Oryza designs", title: "Pure vegetarian kitchen", hook: "What that means in our kitchen — separate, careful, every day", cta: "Visit or order", requires: ["food:veg"] },
  { id: "FP27", format: "post", pillar: "food", who: "Oryza designs", title: "Today's fresh bakes", hook: "What's on the shelf today", cta: "Visit or pre-order", requires: ["type:bakery"], repeatable: true },
  { id: "FP28", format: "post", pillar: "food", who: "Oryza designs", title: "Sweet boxes for every occasion", hook: "Box sizes and how to pre-order — as you provide", cta: "Pre-order a box", requires: ["type:sweets"] },
];

const stories: Template[] = [
  { id: "FS01", format: "story", pillar: "food", who: "Oryza designs", repeatable: true, title: "Poll: what should we feature next?", hook: "Two dishes to choose from" },
  { id: "FS02", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, title: "Question box: ask our kitchen", hook: "Answers this week" },
  { id: "FS03", format: "story", pillar: "kitchen", who: "Oryza shoots", repeatable: true, title: "In the kitchen today", hook: "Quick clips from prep" },
  { id: "FS04", format: "story", pillar: "occasions", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "FS05", format: "story", pillar: "order", who: "Oryza designs", repeatable: true, title: "Open today: {timings}", hook: "Tap for directions", requires: ["has:timings"] },
  { id: "FS06", format: "story", pillar: "order", who: "Oryza designs", repeatable: true, title: "Order now", hook: "{delivery_line}", requires: ["has:delivery"] },
  { id: "FS07", format: "story", pillar: "order", who: "Oryza designs", repeatable: true, title: "Order on WhatsApp", hook: "{order_line}", requires: ["has:whatsapp"] },
  { id: "FS08", format: "story", pillar: "food", who: "Oryza designs", repeatable: true, title: "Quiz: guess the dish", hook: "Answer in the next story" },
  { id: "FS09", format: "story", pillar: "people", who: "Oryza designs", repeatable: true, faces: true, title: "Your tags", hook: "Reposted only with permission", requires: ["consent:yes"] },
  { id: "FS10", format: "story", pillar: "occasions", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "This weekend at {brand}", hook: "Timings and what to order" },
];

export const restaurantRules = [
  "No alcohol promotion of any kind — no liquor names, brands, bottles, “bar nights” or surrogate ads.",
  "No health or medical claims about food (“cures”, “immunity booster”, “100% healthy”, “no side effects”). The FSSAI licence number appears exactly as you provide it, where you want it.",
  "Offers, prices and discounts only as you provide them. No fake urgency, no “best in town” or “No.1” claims.",
  "Veg, non-veg and egg marks follow your own menu exactly; allergen notes when you ask for them.",
  "Customers appear only with their written consent. Never fake reviews — we ask real customers for honest Google reviews.",
];

export const restaurantPlaybook: Playbook = {
  category: "restaurants-cafes",
  audiences: [
    { name: "Locals deciding where to eat tonight", share: 40, needs: "What's good, timings, location, price feel" },
    { name: "Online orderers", share: 25, needs: "How to order, delivery reach, packing, consistency" },
    { name: "Families and groups", share: 20, needs: "Space, menu range, party and catering options" },
    { name: "Regulars", share: 15, needs: "New dishes, specials, recognition" },
  ],
  pillars: [
    { id: "food", name: "Signature food", share: 35 },
    { id: "kitchen", name: "Kitchen and hygiene", share: 15 },
    { id: "people", name: "Cooks, team and customers", share: 15 },
    { id: "order", name: "Order, visit and timings", share: 20 },
    { id: "occasions", name: "Festive, parties and catering", share: 15 },
  ],
  tone: "Warm, appetising and honest. Bilingual Hindi–English captions. Real food, real kitchen, no exaggeration.",
  rules: restaurantRules,
  templates: [...reels, ...posts, ...stories],
};

export const restaurantOptions = {
  types: [
    { id: "restaurant", label: "Restaurant" },
    { id: "cafe", label: "Café" },
    { id: "cloud", label: "Cloud kitchen" },
    { id: "sweets", label: "Sweet shop" },
    { id: "bakery", label: "Bakery" },
    { id: "dhaba", label: "Dhaba" },
  ],
  goals: [
    { id: "footfall", label: "More footfall" },
    { id: "orders", label: "More online orders" },
    { id: "launch", label: "New launch or menu" },
    { id: "weekend", label: "Weekend and festive rush" },
    { id: "parties", label: "Catering and party bookings" },
    { id: "reviews", label: "More Google reviews" },
  ],
  food: [
    { id: "veg", label: "Pure veg" },
    { id: "nonveg", label: "Non-veg" },
    { id: "both", label: "Both" },
  ],
  marks: [
    { id: "veg", label: "Veg" },
    { id: "nonveg", label: "Non-veg" },
    { id: "egg", label: "Contains egg" },
  ],
  service: [
    { id: "dinein", label: "Dine-in" },
    { id: "takeaway", label: "Takeaway" },
    { id: "delivery", label: "Delivery apps" },
    { id: "whatsapp", label: "Our own WhatsApp ordering" },
  ],
  events: [
    { id: "launch", label: "New outlet opening" },
    { id: "menu", label: "New menu or dish launch" },
    { id: "festive", label: "Festive special (date you've verified)" },
    { id: "music", label: "Live music or special evening" },
    { id: "other", label: "Other event" },
  ],
} as const;

/** Fixed-date food days (same date every year) and the business types they suit. */
export const foodDays = [
  { md: "05-21", name: "International Tea Day", types: ["cafe", "restaurant", "dhaba", "sweets", "bakery", "cloud"] },
  { md: "06-01", name: "World Milk Day", types: ["sweets", "cafe", "bakery"] },
  { md: "06-07", name: "World Food Safety Day", types: ["restaurant", "cafe", "cloud", "sweets", "bakery", "dhaba"] },
  { md: "07-07", name: "World Chocolate Day", types: ["bakery", "cafe"] },
  { md: "10-01", name: "International Coffee Day", types: ["cafe"] },
  { md: "10-16", name: "World Food Day", types: ["restaurant", "cafe", "cloud", "sweets", "bakery", "dhaba"] },
  { md: "10-20", name: "International Chefs Day", types: ["restaurant", "cafe", "cloud", "dhaba"] },
];

/** Food festivals whose date changes every year: never auto-pinned — add one as an event once the date is verified. */
export const foodFestivals = [
  { name: "Holi", months: [2, 3] },
  { name: "Eid", months: [] as number[] },
  { name: "Diwali", months: [10, 11] },
  { name: "Raksha Bandhan", months: [8] },
];
