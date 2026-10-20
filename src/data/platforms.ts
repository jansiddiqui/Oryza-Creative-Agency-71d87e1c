export type PlatformId =
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "youtube"
  | "gbp"
  | "website"
  | "linkedin"
  | "x"
  | "pinterest";

export interface Platform {
  id: PlatformId;
  name: string;
  job: string;
  formats: string;
  strongestFor: string;
  /** One-time profile optimization checklist (sold as an extra-cost add-on). */
  optimization: string[];
  /** What monthly management includes. */
  monthly: string[];
}

export const platforms: Platform[] = [
  {
    id: "instagram",
    name: "Instagram",
    job: "Brand image and discovery",
    formats: "Reels, carousels, stories, highlights, collabs",
    strongestFor: "Almost every business; younger and urban audiences",
    optimization: [
      "Switch to a business account with the right category",
      "Keyword-rich name field and bio",
      "Link in bio and contact buttons",
      "5–8 highlight covers and highlights",
      "9-post launch grid",
      "Pinned introduction reel",
    ],
    monthly: [
      "Reels, carousels and stories as per calendar",
      "Highlight updates",
      "Hashtag and keyword sets",
      "Comment and DM replies",
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    job: "Community and the older local audience",
    formats: "Posts, videos, events, groups, reels",
    strongestFor: "Parents, families, Tier-2 city audiences, local events",
    optimization: [
      "Page category, About and services",
      "WhatsApp or Call button",
      "Cover and profile design",
      "Link with Instagram",
      "Review and events tabs",
    ],
    monthly: [
      "Native posts adapted from Instagram",
      "Facebook events for key dates",
      "Reels shared natively",
      "Community replies",
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    job: "Direct conversion and retention",
    formats: "Catalogue, quick replies, broadcasts, status, Channel",
    strongestFor: "Every business — where leads become customers",
    optimization: [
      "Business profile with hours and address",
      "Catalogue of services or products",
      "Greeting and away messages",
      "10 quick replies for common questions",
      "Labels for lead stages",
      "Broadcast list setup and a QR code for print",
    ],
    monthly: [
      "Weekly broadcast or Channel update",
      "Status posts",
      "Lead follow-up scripts",
      "Catalogue updates",
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    job: "Trust, depth and search",
    formats: "Long videos, Shorts, playlists, community posts",
    strongestFor: "Schools, hospitals, real estate, coaching, leaders, creators",
    optimization: [
      "Channel name and handle",
      "Banner and logo",
      "Keyword description and links",
      "Channel trailer",
      "3–5 playlists",
    ],
    monthly: ["Shorts reused from reels", "Long videos", "Titles, thumbnails, descriptions, chapters"],
  },
  {
    id: "gbp",
    name: "Google Business Profile",
    job: "Showing up in Google Search and Maps",
    formats: "Photos, posts, offers, Q&A, review replies",
    strongestFor: "Any business with a physical location",
    optimization: [
      "Claim and verify the listing",
      "Correct primary and secondary categories",
      "Services, hours and description with local keywords",
      "20+ photos",
      "Q&A seeded with real FAQs",
      "Review link and QR code",
    ],
    monthly: ["Weekly posts and offers", "New photos", "Reply to every review", "Q&A updates"],
  },
  {
    id: "website",
    name: "Website & Google indexing",
    job: "Being found when someone searches",
    formats: "Service pages, blogs, FAQ, schema, Search Console",
    strongestFor: "Every business that wants search leads",
    optimization: [
      "Google Search Console and Bing Webmaster setup",
      "Sitemap submission",
      "Page titles and meta descriptions",
      "Local business schema",
      "Speed and mobile check",
    ],
    monthly: ["One blog or service page", "Indexing checks and fixes", "Monthly keyword report"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    job: "Professional credibility and B2B",
    formats: "Founder and company posts, documents, articles, hiring",
    strongestFor: "Professionals, B2B, institutions hiring, doctors, founders",
    optimization: ["Headline and About", "Banner", "Featured section", "Services and custom URL"],
    monthly: ["Founder or company posts", "Document carousel", "Hiring posts"],
  },
  {
    id: "x",
    name: "X (Twitter)",
    job: "Public voice and news",
    formats: "Short posts, threads, live updates",
    strongestFor: "Political leaders, public figures, media",
    optimization: ["Handle, bio and banner", "Pinned post", "Verification guidance"],
    monthly: ["Daily posts", "Threads on key issues", "Live updates during events"],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    job: "Visual inspiration and search",
    formats: "Pins, idea boards",
    strongestFor: "Interiors, fashion, jewellery, weddings, food",
    optimization: ["Business account and claimed website", "5–8 keyword boards", "First 20 pins"],
    monthly: ["Fresh pins weekly", "Board upkeep"],
  },
];

export const platformById = Object.fromEntries(platforms.map((p) => [p.id, p])) as Record<
  PlatformId,
  Platform
>;
