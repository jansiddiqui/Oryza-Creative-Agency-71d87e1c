/**
 * Image slot registry: every place on the site that can show a photo.
 *
 * - `illustrative` slots may use an AI-generated image, but only as a decorative/concept scene.
 * - `real-only` slots show work, team, clients, results or "our office": a REAL photo or nothing.
 *   No AI prompt is ever generated for them and the processing script refuses them without a real-photo sidecar.
 *
 * Slots are part of the design, so they live in code. Their images are managed in /admin/images and stored in
 * Supabase (table `slot_images`, buckets `image-originals` and `site-images`): upload → review → approve.
 */
import { categories } from "./categories";

export type SlotType = "illustrative" | "real-only";
export type AspectId = "16x9" | "4x5" | "4x3" | "og";

export interface AspectSpec {
  id: AspectId;
  /** Width:height. */
  ratio: [number, number];
  /** Output widths in px. Widths larger than the cropped source are skipped (never upscaled). */
  widths: number[];
  /** The cropped source must be at least this wide, or processing fails. */
  minWidth: number;
  /** Media query for art direction; the first aspect without one is the default. */
  media?: string;
}

export interface ImageSlot {
  id: string;
  /** Route the slot appears on. */
  page: string;
  /** Why the image is there. */
  purpose: string;
  /** What the picture shows — used for briefs and, for illustrative slots, the prompt. */
  subject: string;
  type: SlotType;
  aspects: AspectSpec[];
  alt: string;
  /** Where on the page it sits and how much space text needs. */
  placement: string;
  /** Default focal point (0–1). The manifest can override it per image. */
  focal?: { x: number; y: number };
  /** Icon key for the brand fallback: an industry slug or a page key. */
  icon?: string;
  /** Show the brand fallback while empty (true) or render nothing (false). */
  fallback: boolean;
  /** Re-use another slot's original when this slot has none of its own (e.g. OG from the page header). */
  deriveFrom?: string;
}

export const ASPECTS = {
  hero: { id: "16x9", ratio: [16, 9], widths: [640, 960, 1280, 1600], minWidth: 1280 },
  heroMobile: { id: "4x5", ratio: [4, 5], widths: [480, 640, 828], minWidth: 640, media: "(max-width: 767px)" },
  card: { id: "4x3", ratio: [4, 3], widths: [400, 640, 800], minWidth: 640 },
  og: { id: "og", ratio: [1200, 630], widths: [1200], minWidth: 1200 },
} satisfies Record<string, AspectSpec>;

const header = [ASPECTS.hero, ASPECTS.heroMobile] as AspectSpec[];

/** Documentary scene for each industry header. People appear from behind, at a distance or as hands — never as identifiable "clients". */
const industryScenes: Record<string, string> = {
  schools: "a teacher with students in uniform at a school in Kanpur on a winter morning, the children seen from behind",
  "hospitals-clinics": "a calm, bright corridor and reception of a modern hospital in Kanpur, staff seen from behind or softly out of focus",
  doctors: "a doctor with a stethoscope calmly talking with a family member in a warm clinic, the family member seen from behind",
  "real-estate": "a newly completed residential building in Kanpur with a family seen from behind, looking at their new home",
  "political-leaders": "a local representative in a plain white kurta listening to elderly residents in a quiet Kanpur neighbourhood",
  "restaurants-cafes": "masala chai and Indian street snacks being served at a warm café table in Kanpur",
  "coaching-institutes": "students aged 17 to 20 studying in a coaching institute in Kanpur, seen from behind",
  "retail-showrooms": "a shopkeeper showing fabric in a traditional textile shop in a Kanpur market",
  "gyms-salons": "a stylist's or therapist's hands at work in a calm salon or spa, no faces shown",
  "b2b-manufacturers": "an artisan's hands working leather at a workbench in a Kanpur leather workshop",
  professionals: "a consultant reviewing papers with a client in a tidy office in Kanpur, seen from the side",
  creators: "a young creator filming with a phone on a tripod, seen from behind, the phone screen facing away",
  "interiors-fashion-jewellery": "a hand adjusting handcrafted gold jewellery or a zari-bordered textile in a warm showroom",
};

const industrySlots: ImageSlot[] = categories.flatMap((c) => {
  const scene = industryScenes[c.slug] ?? `a real ${c.name.toLowerCase()} setting in a North Indian city`;
  const headerSlot: ImageSlot = {
    id: `industry-${c.slug}-header`,
    page: `/industries/${c.slug}`,
    purpose: `Header image for the ${c.name} industry page`,
    subject: scene,
    type: "illustrative",
    aspects: header,
    alt: scene.charAt(0).toUpperCase() + scene.slice(1),
    placement: "Industry page header, beside the headline on desktop and below it on phones. Keep the main subject right of centre.",
    focal: { x: 0.6, y: 0.5 },
    icon: c.slug,
    fallback: true,
  };
  const ogSlot: ImageSlot = {
    id: `industry-${c.slug}-og`,
    page: `/industries/${c.slug}`,
    purpose: `Social share image (Open Graph) for the ${c.name} page`,
    subject: scene,
    type: "illustrative",
    aspects: [ASPECTS.og],
    alt: `${c.name} — Oryza Creative Agency`,
    placement: "Shown by WhatsApp, Facebook, LinkedIn and X when the page is shared. Subject centred; nothing important near the edges.",
    focal: { x: 0.5, y: 0.5 },
    icon: c.slug,
    fallback: false,
    deriveFrom: `industry-${c.slug}-header`,
  };
  return [headerSlot, ogSlot];
});

const pageSlots: ImageSlot[] = [
  {
    id: "home-hero",
    page: "/",
    purpose: "Wide visual band under the home page hero",
    subject: "a warm still life on a wooden table: a paper monthly planner, printed photographs, a phone on a small tripod with its screen off and a glass of chai — no people",
    type: "illustrative",
    aspects: header,
    alt: "A paper monthly planner, printed photos, a phone on a small tripod and a glass of chai on a wooden table",
    placement: "Full-width band below the home hero. Subject left of centre; a calm wall area on the right.",
    focal: { x: 0.4, y: 0.55 },
    icon: "home",
    fallback: false,
  },
  {
    id: "services-header",
    page: "/services",
    purpose: "Header image for the Services page",
    subject: "a simple content-shoot setup in a sunlit room: a phone on a tripod, a reflector and an unbranded product on cream cloth — no people",
    type: "illustrative",
    aspects: header,
    alt: "A phone on a tripod and a reflector set up to film a simple product in window light",
    placement: "Page header, beside the headline on desktop.",
    focal: { x: 0.55, y: 0.5 },
    icon: "services",
    fallback: false,
  },
  {
    id: "platforms-header",
    page: "/platforms",
    purpose: "Header image for the Platforms page",
    subject: "two hands holding a phone with its screen off, with a glass of chai nearby, in soft window light",
    type: "illustrative",
    aspects: header,
    alt: "Two hands holding a phone with its screen off, with a glass of chai nearby",
    placement: "Page header, beside the headline on desktop.",
    focal: { x: 0.5, y: 0.5 },
    icon: "platforms",
    fallback: false,
  },
  {
    id: "how-it-works-header",
    page: "/how-it-works",
    purpose: "Header image for How it works",
    subject: "an overhead view of a planning table with a blank weekly schedule, index cards, thread and pencils — no people, no writing",
    type: "illustrative",
    aspects: header,
    alt: "A planning table seen from above with a blank weekly schedule, index cards and pencils",
    placement: "Page header, beside the headline on desktop.",
    focal: { x: 0.5, y: 0.5 },
    icon: "process",
    fallback: false,
  },
  {
    id: "contact-studio",
    page: "/contact",
    purpose: "Real photo of the Oryza team or studio in Kanpur",
    subject: "the real Oryza team at work in their Kanpur studio",
    type: "real-only",
    aspects: [ASPECTS.card],
    alt: "The Oryza team at work in Kanpur",
    placement: "Contact page, next to the contact details. Shown only when a real photo is approved.",
    icon: "contact",
    fallback: false,
  },
];

export const imageSlots: ImageSlot[] = [...pageSlots, ...industrySlots];

export const slotById: Record<string, ImageSlot> = Object.fromEntries(imageSlots.map((s) => [s.id, s]));
