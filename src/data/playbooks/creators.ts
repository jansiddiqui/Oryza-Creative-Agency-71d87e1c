import type { Playbook, Template } from "@/lib/engine/types";

/**
 * Creators & personal brands playbook v1 — written by Oryza strategists, consumed by the rule engine.
 * ASCI influencer guidelines: every paid, gifted, barter or affiliate post carries an upfront disclosure and uses
 * the platform's paid-partnership tool. Brand collab items are created only by the engine (pinned), always with
 * the disclosure in the title and the note.
 * Variables: {creator} {niche} {series} {event} {collab_label} {brand} {quals} {sebi}
 * Tags: style:talking|vlog|skit|tutorial, niche:finance|health, sebi:yes, quals:yes, kids:consent, cam:*,
 * edit:oryza, consent:yes, has:series.
 */

/**
 * Wording the engine never publishes: guaranteed results or returns, stock tips, medical claims, engagement
 * schemes and superlatives.
 */
export const CREATOR_BANNED_WORDING =
  /\b(guarantee\w*|get rich|double your money|multibagger|stock tips?|sure[- ]shot|target price|risk[- ]free|returns? of \d|assured returns?|cures?|cured|miracle|lose \d+\s?kgs?|in \d+ days|fairness|whitening|follow for follow|f4f|buy followers|sub4sub|engagement pod|best|no\.?\s?1|number one)\b|100\s?%|#1/i;

const SERIES = "Same day, same format every week — repurposed to Shorts and a post.";
const FIN_LITERACY = "Financial literacy only — not investment advice.";
const SEBI = "SEBI Reg. No. {sebi} on the creative. Investments are subject to market risks.";
const HEALTH = "General information within your qualifications ({quals}) — not medical advice; no guaranteed results.";
const KIDS = "Children only with a parent's consent, never in an exploitative way.";

const reels: Template[] = [
  { id: "CR01", format: "reel", pillar: "value", who: "Oryza edits", title: "{niche}: one tip in 30 seconds", hook: "The thing you wish you'd known earlier — straight to the point", cta: "Save and share", requires: ["style:talking"], repeatable: true, boosts: ["primary:growth"] },
  { id: "CR02", format: "reel", pillar: "value", who: "Oryza edits", title: "Tutorial: {niche}, step by step", hook: "Follow along — one small win today", cta: "Save for later", requires: ["style:tutorial"], repeatable: true, boosts: ["primary:growth"] },
  { id: "CR03", format: "reel", pillar: "story", who: "Oryza edits", title: "A day in my life", hook: "Real, unpolished, start to finish", cta: "Follow for more", requires: ["style:vlog"], repeatable: true, boosts: ["primary:community"] },
  { id: "CR04", format: "reel", pillar: "entertain", who: "Oryza edits", title: "Skit: when {niche} goes wrong", hook: "The relatable moment, in under 30 seconds", cta: "Tag a friend", requires: ["style:skit"], repeatable: true, boosts: ["primary:growth"] },
  { id: "CR05", format: "reel", pillar: "series", who: "Oryza edits", note: SERIES, title: "{series} — this week's episode", hook: "Your weekly series, same day, same format", cta: "Follow for next week's episode", pinnedOnly: true, repeatable: true },
  { id: "CR06", format: "reel", pillar: "trends", who: "Oryza edits", title: "Trend, our way: {niche}", hook: "A trending format adapted to your niche — original audio where possible", cta: "Follow for more", repeatable: true, minDay: 3, boosts: ["primary:growth"] },
  { id: "CR07", format: "reel", pillar: "community", who: "Oryza edits", title: "Answering your comments", hook: "Three questions from the comments, three quick answers", cta: "Comment your question", repeatable: true, boosts: ["primary:community"] },
  { id: "CR08", format: "reel", pillar: "story", who: "Oryza edits", title: "How I started", hook: "The honest story — the slow start included", cta: "Follow for more", blockedBy: ["cam:none"], boosts: ["primary:community"] },
  { id: "CR09", format: "reel", pillar: "story", who: "Oryza edits", title: "Behind the scenes of a video", hook: "Script, setup, retakes — how a post gets made", cta: "Follow for more" },
  { id: "CR10", format: "reel", pillar: "community", who: "Oryza edits", title: "Collab with a fellow creator", hook: "Two creators, one topic — no brand involved", cta: "Follow both of us", boosts: ["primary:growth"] },
  { id: "CR11", format: "reel", pillar: "deals", who: "Oryza edits", note: "Upfront disclosure in the first line and on screen; the platform's paid-partnership tool switched on.", title: "{collab_label}: {brand}", hook: "{collab_label} — an honest take, as agreed with the brand", cta: "Details in the caption", pinnedOnly: true, repeatable: true },
  { id: "CR12", format: "reel", pillar: "launch", who: "Oryza edits", title: "It's here: {event}", hook: "What it is, who it's for and where to get it", cta: "Link in bio", pinnedOnly: true, repeatable: true },
  { id: "CR13", format: "reel", pillar: "launch", who: "Oryza edits", title: "Coming soon: {event}", hook: "A first look — the date and why I made it", cta: "Turn on notifications", pinnedOnly: true, repeatable: true },
  { id: "CR14", format: "reel", pillar: "value", who: "Oryza edits", note: FIN_LITERACY, title: "Money basics: one concept", hook: "A plain explanation — general financial literacy", cta: "Save this", requires: ["niche:finance"], repeatable: true },
  { id: "CR15", format: "reel", pillar: "value", who: "Oryza edits", note: SEBI, title: "My market view this week", hook: "Context and risks, as a registered adviser", cta: "Read the full note in the caption", requires: ["niche:finance", "sebi:yes"], repeatable: true, boosts: ["sebi:yes", "sebi:yes"] },
  { id: "CR16", format: "reel", pillar: "value", who: "Oryza edits", note: HEALTH, title: "Health basics: one habit", hook: "A small, realistic routine — results vary", cta: "Save this", requires: ["niche:health", "quals:yes"], repeatable: true, boosts: ["quals:yes", "quals:yes"] },
  { id: "CR17", format: "reel", pillar: "story", who: "Oryza edits", note: KIDS, title: "Family moments", hook: "Light, real moments — with a parent's consent", cta: "Follow for more", requires: ["kids:consent"] },
  { id: "CR18", format: "reel", pillar: "value", who: "Oryza edits", title: "Myth vs fact: {niche}", hook: "One myth your audience believes, and what's true", cta: "Share with someone", repeatable: true },
  { id: "CR19", format: "reel", pillar: "value", who: "Oryza edits", title: "Three mistakes beginners make in {niche}", hook: "And what to do instead", cta: "Save this", repeatable: true },
  { id: "CR20", format: "reel", pillar: "community", who: "Oryza edits", title: "Your wins this week", hook: "Shout-outs from the community — shared with permission", cta: "Share your win in the comments", requires: ["consent:yes"] },
  { id: "CR21", format: "reel", pillar: "entertain", who: "Oryza edits", title: "Expectation vs reality: {niche}", hook: "The honest version", cta: "Tag a friend", repeatable: true },
  { id: "CR22", format: "reel", pillar: "story", who: "Oryza edits", title: "What I'd tell my younger self", hook: "One lesson from the journey so far", cta: "Follow for more", blockedBy: ["cam:none"] },
  { id: "CR23", format: "reel", pillar: "value", who: "Oryza edits", title: "Tools I actually use", hook: "My real setup — no sponsored mentions", cta: "Save this" },
];

const posts: Template[] = [
  { id: "CP01", format: "post", pillar: "value", who: "Oryza designs", title: "{niche}: a carousel guide", hook: "Five slides, one clear takeaway each", cta: "Save this", repeatable: true },
  { id: "CP02", format: "post", pillar: "story", who: "Oryza designs", title: "A story from this week", hook: "A short personal story with one lesson", cta: "Tell me yours in the comments", repeatable: true },
  { id: "CP03", format: "post", pillar: "community", who: "Oryza designs", title: "Ask me anything", hook: "Drop your questions — answers in a reel this week", cta: "Comment your question", repeatable: true },
  { id: "CP04", format: "post", pillar: "series", who: "Oryza designs", note: SERIES, title: "{series}: the recap", hook: "This week's episode in one carousel", cta: "Follow for next week", pinnedOnly: true, repeatable: true },
  { id: "CP05", format: "post", pillar: "deals", who: "Oryza designs", note: "Upfront disclosure in the first line; the platform's paid-partnership tool switched on.", title: "{collab_label}: {brand}", hook: "{collab_label} — what I liked, honestly, as agreed with the brand", cta: "Details in the caption", pinnedOnly: true, repeatable: true },
  { id: "CP06", format: "post", pillar: "launch", who: "Oryza designs", title: "Save the date: {event}", hook: "Launch date, what's inside, who it's for", cta: "Turn on notifications", pinnedOnly: true, repeatable: true },
  { id: "CP07", format: "post", pillar: "launch", who: "Oryza designs", title: "Thank you: {event}", hook: "What happened at launch — and what's next", cta: "Link in bio", pinnedOnly: true, repeatable: true },
  { id: "CP08", format: "post", pillar: "value", who: "Oryza designs", title: "Myth vs fact: {niche}", hook: "One myth per slide", cta: "Share with someone", repeatable: true },
  { id: "CP09", format: "post", pillar: "value", who: "Oryza designs", title: "Checklist: {niche}", hook: "A save-worthy checklist", cta: "Save this", repeatable: true },
  { id: "CP10", format: "post", pillar: "story", who: "Oryza designs", title: "About me", hook: "Who I am, what I make and who it's for", cta: "Follow for more", boosts: ["primary:community"] },
  { id: "CP11", format: "post", pillar: "community", who: "Oryza designs", title: "Community question of the week", hook: "Vote or comment — I'll share the results", cta: "Comment below" },
  { id: "CP12", format: "post", pillar: "value", who: "Oryza designs", note: FIN_LITERACY, title: "Money myths, explained", hook: "General financial literacy — not investment advice", cta: "Save this", requires: ["niche:finance"] },
  { id: "CP13", format: "post", pillar: "value", who: "Oryza designs", note: SEBI, title: "How I think about risk", hook: "A framework, with risks — as a registered adviser", cta: "Read the caption", requires: ["niche:finance", "sebi:yes"], boosts: ["sebi:yes", "sebi:yes"] },
  { id: "CP14", format: "post", pillar: "value", who: "Oryza designs", note: HEALTH, title: "A simple routine card", hook: "Within my qualifications — not medical advice; results vary", cta: "Save this", requires: ["niche:health", "quals:yes"], boosts: ["quals:yes", "quals:yes"] },
  { id: "CP15", format: "post", pillar: "story", who: "Oryza designs", title: "Lessons from my journey", hook: "Five honest lessons — no shortcuts", cta: "Share with someone starting out" },
  { id: "CP16", format: "post", pillar: "community", who: "Oryza designs", title: "Behind the numbers", hook: "What actually worked this month — real, unedited stats if you want them shown", cta: "Follow for more" },
  { id: "CP17", format: "post", pillar: "value", who: "Oryza designs", title: "Resources I recommend", hook: "Books, tools and channels — none sponsored", cta: "Save this" },
  { id: "CP18", format: "post", pillar: "deals", who: "Oryza designs", title: "Working with brands", hook: "How I choose collaborations and how I disclose them", cta: "DM for collaborations", boosts: ["primary:deals"] },
  { id: "CP19", format: "post", pillar: "value", who: "Oryza designs", title: "Quote card: {niche}", hook: "One line worth saving", cta: "Save and share", repeatable: true },
  { id: "CP20", format: "post", pillar: "entertain", who: "Oryza designs", title: "Meme of the week: {niche}", hook: "Relatable, original, on-brand", cta: "Tag a friend", repeatable: true },
  { id: "CP21", format: "post", pillar: "launch", who: "Oryza designs", title: "{event} is live", hook: "Where to get it and what's inside", cta: "Link in bio", pinnedOnly: true, repeatable: true },
  { id: "CP22", format: "post", pillar: "story", who: "Oryza designs", title: "World Social Media Day", hook: "What this community means to me", pinnedOnly: true },
  { id: "CP23", format: "post", pillar: "community", who: "Oryza designs", title: "Thank you for being here", hook: "A note to the community — no numbers needed", cta: "Say hi in the comments", repeatable: true, minDay: 10 },
  { id: "CP24", format: "post", pillar: "value", who: "Oryza designs", title: "Before you start: {niche}", hook: "What beginners should know first", cta: "Save this" },
  { id: "CP25", format: "post", pillar: "story", who: "Oryza designs", title: "Greetings: {event}", hook: "A warm greeting to the community", pinnedOnly: true, repeatable: true },
];

const stories: Template[] = [
  { id: "CS01", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, title: "Poll: what should I make next?", hook: "Two ideas to choose from" },
  { id: "CS02", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, title: "Question box", hook: "Answers in a reel this week" },
  { id: "CS03", format: "story", pillar: "story", who: "Oryza edits", repeatable: true, title: "Behind the scenes today", hook: "Quick clips from filming" },
  { id: "CS04", format: "story", pillar: "launch", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "Countdown: {event}", hook: "Countdown sticker" },
  { id: "CS05", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, title: "Quiz: {niche}", hook: "Answer in the next story" },
  { id: "CS06", format: "story", pillar: "story", who: "Oryza designs", repeatable: true, title: "Currently working on…", hook: "A sneak peek" },
  { id: "CS07", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, title: "Reply to a comment", hook: "One comment, one answer" },
  { id: "CS08", format: "story", pillar: "value", who: "Oryza designs", repeatable: true, title: "Tip of the day", hook: "One line, one idea" },
  { id: "CS09", format: "story", pillar: "community", who: "Oryza designs", repeatable: true, title: "This or that?", hook: "Tap to vote" },
  { id: "CS10", format: "story", pillar: "series", who: "Oryza designs", repeatable: true, pinnedOnly: true, title: "New episode today: {series}", hook: "Out this evening" },
];

export const creatorRules = [
  "Every paid, gifted, barter or affiliate post carries a clear upfront disclosure (“Paid partnership”, “Gifted”, “Ad”) and uses the platform's paid-partnership tool, as ASCI's influencer guidelines require.",
  "Finance creators: no investment advice, stock tips or return promises unless you confirm SEBI registration (with your number); otherwise financial-literacy education only, marked “not investment advice”.",
  "Health, fitness and beauty creators: no medical or guaranteed-result claims; advice only within the qualifications you provide.",
  "No fake giveaways, no buying followers or engagement, no misleading before / after; children only with a parent's consent and never in an exploitative way.",
  "This is guidance, not legal advice — confirm with your professional body or legal team.",
];

export const creatorsPlaybook: Playbook = {
  category: "creators",
  audiences: [
    { name: "Your core community", share: 45, needs: "Consistency, value, the person behind the content" },
    { name: "New viewers from the niche", share: 30, needs: "Quick value, a reason to follow" },
    { name: "Brands and collaborators", share: 15, needs: "A clear niche, honest engagement, professionalism" },
    { name: "Customers for your own launches", share: 10, needs: "Trust, clarity on what they get" },
  ],
  pillars: [
    { id: "value", name: "Value: tips, tutorials, explainers", share: 30 },
    { id: "story", name: "Story and personality", share: 15 },
    { id: "entertain", name: "Entertainment and trends", share: 10 },
    { id: "trends", name: "Trend adaptations", share: 5 },
    { id: "community", name: "Community and Q&A", share: 15 },
    { id: "series", name: "Weekly series", share: 10 },
    { id: "deals", name: "Brand collaborations (disclosed)", share: 5 },
    { id: "launch", name: "Your own launches", share: 10 },
  ],
  tone: "Personal, honest and consistent. In your language and your voice; disclosures always upfront.",
  rules: creatorRules,
  templates: [...reels, ...posts, ...stories],
};

export const creatorOptions = {
  niches: [
    { id: "general", label: "General / lifestyle" },
    { id: "finance", label: "Finance and money" },
    { id: "health", label: "Health, fitness or beauty" },
    { id: "education", label: "Education and careers" },
    { id: "food", label: "Food" },
    { id: "tech", label: "Tech" },
    { id: "travel", label: "Travel" },
    { id: "comedy", label: "Comedy and entertainment" },
  ],
  styles: [
    { id: "talking", label: "Talking head" },
    { id: "vlog", label: "Vlogs" },
    { id: "skit", label: "Skits" },
    { id: "tutorial", label: "Tutorials" },
  ],
  followers: [
    { id: "under1k", label: "Under 1,000" },
    { id: "1k", label: "1,000 – 10,000" },
    { id: "10k", label: "10,000 – 1 lakh" },
    { id: "100k", label: "Over 1 lakh" },
  ],
  goals: [
    { id: "growth", label: "Audience growth" },
    { id: "deals", label: "Brand deals" },
    { id: "community", label: "Community" },
    { id: "launch", label: "Launch my product or course" },
  ],
  collabTypes: [
    { id: "paid", label: "Paid" },
    { id: "gifted", label: "Gifted" },
    { id: "affiliate", label: "Affiliate" },
    { id: "barter", label: "Barter" },
  ],
  weekdays: [
    { id: "1", label: "Monday" },
    { id: "2", label: "Tuesday" },
    { id: "3", label: "Wednesday" },
    { id: "4", label: "Thursday" },
    { id: "5", label: "Friday" },
    { id: "6", label: "Saturday" },
    { id: "0", label: "Sunday" },
  ],
} as const;

/** The disclosure each kind of collaboration must carry upfront. */
export const DISCLOSURE: Record<string, string> = {
  paid: "Paid partnership",
  gifted: "Gifted",
  affiliate: "Ad — affiliate link",
  barter: "Collab (barter) — Ad",
};
