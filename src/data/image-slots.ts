/**
 * Image slot registry: every place on the site that can show a photo.
 *
 * - `illustrative` slots may use an AI-generated image, but only as a decorative/concept scene.
 * - `real-only` slots show work, team, clients, results or "our office": a REAL photo or nothing.
 *   No AI prompt is ever generated for them and the processing script refuses them without a real-photo sidecar.
 *
 * Files are produced by `npm run images:process` into /public/images/<slot-id>/ and recorded in
 * src/data/image-manifest.json. The Phase 4 admin panel will write the same manifest shape (per slot: files,
 * focal point, source, approved_by, approved_at), so slots can be replaced without code changes.
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
  schools: "a North Indian school courtyard during morning assembly, students in uniforms seen from behind at a distance, old neem tree, brick buildings",
  "hospitals-clinics": "a clean, calm reception corridor of a mid-size private hospital, a nurse walking away from camera, soft daylight through windows, no patients' faces",
  doctors: "a doctor's consultation desk with a stethoscope and a blank prescription pad, the doctor's hands only, soft window light",
  "real-estate": "newly built residential apartment towers at golden hour in a growing North Indian city, a construction crane in the far distance",
  "political-leaders": "a public meeting under a shamiana tent at dusk, crowd seen from behind, plain cloth without any party symbols or flags, warm string lights",
  "restaurants-cafes": "a busy local café counter with chai being poured from a kettle, steam rising, earthen cups, warm light",
  "coaching-institutes": "a coaching classroom with rows of students seen from behind, a teacher at a clean whiteboard, evening tube light mixed with daylight",
  "retail-showrooms": "inside a textile showroom, a shopkeeper's hands unfolding a saree on a cushioned counter, shelves of folded fabric behind",
  "gyms-salons": "a neighbourhood gym in early morning light, dumbbell rack in focus, a person tying shoes in the background with face not visible",
  "b2b-manufacturers": "a small factory floor in an industrial area of Kanpur, a worker's gloved hands guiding material through a machine, safety gear",
  professionals: "a chartered accountant's desk with neat files, a laptop and a cup of tea, the professional seen from the shoulder in a formal shirt",
  creators: "a content creator filming on a phone mounted on a small tripod on a rooftop in an old North Indian city at sunset, seen from behind",
  "interiors-fashion-jewellery": "close-up of handcrafted gold jewellery on a deep green velvet display tray in a showroom, soft directional light",
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
    subject: "a busy North Indian market street in Kanpur at golden hour, a shop owner filming a short video of their shop front on a phone, seen from behind",
    type: "illustrative",
    aspects: header,
    alt: "A shop owner filming a short video of their shop on a phone in a busy market street",
    placement: "Full-width band below the home hero. Subject left of centre; calm sky or wall area on the right.",
    focal: { x: 0.4, y: 0.55 },
    icon: "home",
    fallback: false,
  },
  {
    id: "services-header",
    page: "/services",
    purpose: "Header image for the Services page",
    subject: "a content shoot in progress in a small shop: a phone on a tripod filming a product on a wooden counter, a reflector held by a hand, window light",
    type: "illustrative",
    aspects: header,
    alt: "A phone on a tripod filming a product on a wooden shop counter",
    placement: "Page header, beside the headline on desktop.",
    focal: { x: 0.55, y: 0.5 },
    icon: "services",
    fallback: false,
  },
  {
    id: "platforms-header",
    page: "/platforms",
    purpose: "Header image for the Platforms page",
    subject: "two hands holding a smartphone over a chai table, the screen softly out of focus and unreadable, a notebook beside it",
    type: "illustrative",
    aspects: header,
    alt: "Hands holding a smartphone over a table with a cup of chai",
    placement: "Page header, beside the headline on desktop.",
    focal: { x: 0.5, y: 0.5 },
    icon: "platforms",
    fallback: false,
  },
  {
    id: "how-it-works-header",
    page: "/how-it-works",
    purpose: "Header image for How it works",
    subject: "a planning table with a paper wall calendar, printed shot lists and muted sticky notes, a hand writing with a pencil; no readable text",
    type: "illustrative",
    aspects: header,
    alt: "A hand planning content on a paper calendar with shot lists and sticky notes",
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
