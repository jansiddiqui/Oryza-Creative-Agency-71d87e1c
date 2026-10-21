import type { PlatformId } from "./platforms";

export type Fit = "core" | "add" | "skip";

export interface Category {
  slug: string;
  name: string;
  /** Who the content really speaks to. */
  audience: string;
  /** The one feeling the brand must create. */
  feeling: string;
  /** Whether the detailed rule-based planner is live for this category. */
  plannerLive: boolean;
  fit: Record<PlatformId, Fit>;
}

const f = (
  ig: Fit, fb: Fit, wa: Fit, yt: Fit, gbp: Fit, web: Fit, li: Fit, x: Fit, pin: Fit,
): Record<PlatformId, Fit> => ({
  instagram: ig, facebook: fb, whatsapp: wa, youtube: yt, gbp, website: web, linkedin: li, x, pinterest: pin,
});

export const categories: Category[] = [
  {
    slug: "schools",
    name: "Schools",
    audience: "Parents choosing a school, current parents, students and alumni",
    feeling: "My child will be safe, cared for and will grow here.",
    plannerLive: true,
    fit: f("core", "core", "core", "add", "core", "core", "add", "skip", "skip"),
  },
  {
    slug: "hospitals-clinics",
    name: "Hospitals & clinics",
    audience: "Patients and the families who decide for them",
    feeling: "I can trust these doctors with my family.",
    plannerLive: true,
    fit: f("core", "core", "core", "core", "core", "core", "add", "skip", "skip"),
  },
  {
    slug: "doctors",
    name: "Doctors (personal brand)",
    audience: "Patients searching for a specialist they can trust",
    feeling: "This doctor explains things clearly and cares.",
    plannerLive: true,
    fit: f("core", "add", "core", "core", "core", "add", "core", "skip", "skip"),
  },
  {
    slug: "real-estate",
    name: "Real estate",
    audience: "Families buying a home and investors",
    feeling: "This is a safe, well-located investment.",
    plannerLive: true,
    fit: f("core", "core", "core", "core", "core", "core", "add", "skip", "add"),
  },
  {
    slug: "political-leaders",
    name: "Political leaders",
    audience: "Voters, party workers and young citizens",
    feeling: "This person works for us and is reachable.",
    plannerLive: true,
    fit: f("core", "core", "core", "core", "skip", "add", "add", "core", "skip"),
  },
  {
    slug: "restaurants-cafes",
    name: "Restaurants & cafés",
    audience: "Local food lovers, families and groups planning an outing",
    feeling: "I have to try this place this weekend.",
    plannerLive: true,
    fit: f("core", "add", "core", "add", "core", "add", "skip", "skip", "add"),
  },
  {
    slug: "coaching-institutes",
    name: "Coaching institutes",
    audience: "Students and the parents who pay the fees",
    feeling: "These teachers will get me the result.",
    plannerLive: true,
    fit: f("core", "core", "core", "core", "core", "core", "skip", "skip", "skip"),
  },
  {
    slug: "retail-showrooms",
    name: "Retail & showrooms",
    audience: "Shoppers comparing options nearby",
    feeling: "They have exactly what I want, at a fair price.",
    plannerLive: true,
    fit: f("core", "core", "core", "add", "core", "add", "skip", "skip", "add"),
  },
  {
    slug: "gyms-salons",
    name: "Gyms, salons & spas",
    audience: "People investing in how they look and feel",
    feeling: "I will look and feel better here.",
    plannerLive: true,
    fit: f("core", "add", "core", "add", "core", "add", "skip", "skip", "add"),
  },
  {
    slug: "b2b-manufacturers",
    name: "B2B & manufacturers",
    audience: "Buyers, distributors and procurement teams",
    feeling: "A reliable partner with real capacity.",
    plannerLive: true,
    fit: f("add", "add", "core", "add", "core", "core", "core", "skip", "skip"),
  },
  {
    slug: "professionals",
    name: "Professionals (CA, lawyer, consultant)",
    audience: "Clients looking for expertise they can rely on",
    feeling: "This expert knows the subject and is approachable.",
    plannerLive: true,
    fit: f("core", "add", "core", "add", "core", "add", "core", "add", "skip"),
  },
  {
    slug: "creators",
    name: "Creators & personal brands",
    audience: "A niche community that follows a person, not a company",
    feeling: "This person gets me — I want to keep watching.",
    plannerLive: true,
    fit: f("core", "add", "add", "core", "skip", "skip", "add", "add", "add"),
  },
  {
    slug: "interiors-fashion-jewellery",
    name: "Interiors, fashion & jewellery",
    audience: "Buyers looking for taste, trends and craftsmanship",
    feeling: "This is the look I want.",
    plannerLive: true,
    fit: f("core", "core", "core", "add", "core", "add", "skip", "skip", "core"),
  },
];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<
  string,
  Category
>;
