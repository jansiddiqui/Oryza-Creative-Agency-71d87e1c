/**
 * Rule-based image prompts (no AI API). Every illustrative slot gets a complete, ready-to-paste prompt —
 * copy it into ChatGPT, Gemini or Midjourney and nothing needs to be added. Each prompt has the same 11 parts:
 * opening, FORMAT, PURPOSE, SCENE, PEOPLE, COMPOSITION, CAMERA, LIGHT, COLOUR PALETTE AND GRADE,
 * REALISM DETAILS and DO NOT INCLUDE. Slot-specific scenes live in src/data/image-scenes.ts.
 *
 * Every slot shows a prompt: share-image slots made from a page header show the header's prompts
 * (see slotPrompts). The `real-only` slot type remains as a safeguard, but no slot uses it.
 */
import type { AspectSpec, ImageSlot } from "@/data/image-slots";
import { sceneBriefs, type SceneBrief, type SceneVariant } from "@/data/image-scenes";

export const OPENING =
  "Create ONE photorealistic photograph. It must look like a real, unretouched editorial photo taken by a professional documentary photographer — not an illustration or 3D render, and it must not look AI-generated.";

export const FORMAT = "FORMAT: Landscape, 3:2 aspect ratio, 1536 × 1024 pixels. One single image — no collage, border, frame or text.";

export const COLOUR_GRADE =
  "COLOUR PALETTE AND GRADE: Calm, warm, slightly muted. Shadows lean deep forest green (close to #13201C); midtones warm cream and off-white (#F3EDE0, #FBF8F1); sunlit highlights soft warm gold (#E8B84A, #B9811A). Foliage muted toward olive. No saturated reds, bright blues or neon. Graded like Kodak Portra 400: soft contrast, gentle highlight roll-off, true-to-life skin tones.";

/** Applies to every prompt, before the slot's own negatives. */
export const SHARED_NEGATIVES =
  "any text, letters, numbers, signboards, logos, watermarks or emblems; phone screens showing apps; distorted or extra fingers; plastic or airbrushed skin; identical faces; anyone posing or looking at the camera; Western settings; luxury or futuristic elements; dramatic sunsets; heavy vignette; HDR; over-sharpening; cartoon, painting or 3D style";

export const BRAND_HEX = ["#13201C", "#F3EDE0", "#FBF8F1", "#E8B84A", "#B9811A"] as const;

export const PROMPT_SECTIONS = [
  "Create ONE photorealistic photograph",
  "FORMAT:",
  "PURPOSE:",
  "SCENE:",
  "PEOPLE:",
  "COMPOSITION:",
  "CAMERA:",
  "LIGHT:",
  "COLOUR PALETTE AND GRADE:",
  "REALISM DETAILS:",
  "DO NOT INCLUDE:",
] as const;

export type PromptVariant = "main" | "alt";

/** Every image must pass all of these before it can be approved (enforced in the admin and on the server). */
export const REVIEW_CHECKLIST = [
  { id: "hands", label: "Hands and fingers look natural", hint: "Five fingers each, natural joints, nothing fused or floating." },
  { id: "faces", label: "Faces look natural", hint: "Natural skin and eyes; no identifiable children or patients; nobody looks like a specific real person." },
  { id: "text", label: "No text, watermarks or logos", hint: "Zoom in on signs, screens, papers and labels — no lettering, no watermark, no brand marks." },
  { id: "india", label: "The setting is believably Indian", hint: "Clothing, buildings, vehicles, signage shapes and light feel like a real North Indian city." },
  { id: "honest", label: "Nothing misleading", hint: "It is not shown as Oryza's client work, team, office or results." },
  { id: "brand", label: "Matches the brand mood", hint: "Calm, natural, muted warm tones that sit with deep green #13201C and gold #B9811A; no neon or heavy saturation." },
] as const;

export type ChecklistId = (typeof REVIEW_CHECKLIST)[number]["id"];

const fmtRatio = (a: AspectSpec) => (a.id === "og" ? "1200×630 (1.91:1)" : `${a.ratio[0]}:${a.ratio[1]}`);

/** Smallest source that covers every crop the slot needs (no upscaling). */
export function requiredSource(slot: ImageSlot): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const a of slot.aspects) {
    width = Math.max(width, a.minWidth);
    height = Math.max(height, Math.ceil((a.minWidth * a.ratio[1]) / a.ratio[0]));
  }
  return { width, height };
}

/** What to ask the image tool for: 3:2 landscape at 1536×1024 (what common tools produce) whenever that covers every crop. */
export function sourceSize(slot: ImageSlot): { width: number; height: number; ratio: string } {
  const need = requiredSource(slot);
  if (need.width <= 1536 && need.height <= 1024) return { width: 1536, height: 1024, ratio: "3:2 landscape" };
  return { ...need, ratio: `${need.width}:${need.height}` };
}

function assemble(b: SceneBrief, v: SceneVariant): string {
  const other = b.textSide === "left" ? "left" : "right";
  return [
    OPENING,
    FORMAT,
    `PURPOSE: ${b.purpose}`,
    `SCENE: ${v.scene}`,
    `PEOPLE: ${v.people}`,
    `COMPOSITION: ${v.placement} Keep the ${other} third calm (${v.calm}) so text can sit there. Keep all important content inside the central 60% of the frame so it also crops to a 4:5 portrait and a 1.91:1 banner. ${v.angle}`,
    `CAMERA: Full-frame camera, ${b.camera} Very subtle film grain.`,
    `LIGHT: ${v.light} No flash, no studio light, no HDR.`,
    COLOUR_GRADE,
    `REALISM DETAILS: ${v.realism} Lived-in and imperfect — nothing glossy.`,
    `DO NOT INCLUDE: ${SHARED_NEGATIVES}; ${b.negatives}.`,
  ].join("\n\n");
}

/** The scene brief behind a slot's prompt, if it gets one. */
export function briefFor(slot: ImageSlot): SceneBrief | null {
  if (slot.type === "real-only" || slot.deriveFrom) return null;
  return sceneBriefs[slot.id] ?? null;
}

/**
 * Complete prompt for a slot (main scene or alternative scene), or null when the slot gets none:
 * real-only slots (real photos only) and share images made from a page header.
 */
export function buildPrompt(slot: ImageSlot, variant: PromptVariant = "main"): string | null {
  const b = briefFor(slot);
  return b ? assemble(b, b[variant]) : null;
}

/**
 * The prompts to show for a slot: its own, or — for a share image made from a page header — the header's,
 * with `from` naming that header slot.
 */
export function slotPrompts(slot: ImageSlot, all: Record<string, ImageSlot>): { main: string; alt: string; from: string | null } | null {
  const source = slot.deriveFrom ? all[slot.deriveFrom] : slot;
  if (!source) return null;
  const main = buildPrompt(source, "main");
  const alt = buildPrompt(source, "alt");
  return main && alt ? { main, alt, from: slot.deriveFrom ?? null } : null;
}

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Markdown for docs/image-prompts.md: every slot, its sizes and both prompts. */
export function promptsMarkdown(slots: ImageSlot[]): string {
  const byId = Object.fromEntries(slots.map((x) => [x.id, x]));
  const lines: string[] = [
    "# Image prompts",
    "",
    "Generated by `npm run images:prompts` from `src/data/image-slots.ts` and `src/data/image-scenes.ts` — do not edit by hand.",
    "",
    "## How to use",
    "",
    "Copy a prompt → paste into ChatGPT, Gemini or Midjourney → generate 3–4 versions → pick the most natural one → upload it in **/admin/images** (guide: `docs/admin-images.md`). Nothing needs to be added to the prompt.",
    "",
    "- Every slot has a prompt and an alternative scene. AI-generated images are decorative or concept scenes only — never shown as Oryza's office, team, clients or results.",
    "- A **real photo** can be uploaded to any slot at any time and replaces the AI image.",
    "- Share images (OG) are made automatically from their page header; their section repeats the header's prompts in case you want your own.",
    "",
    "## Human review checklist (before approving)",
    "",
    REVIEW_CHECKLIST.map((c) => `- [ ] **${c.label}** — ${c.hint}`).join("\n"),
    "",
    "## Slots",
    "",
  ];
  for (const s of slots) {
    const size = sourceSize(s);
    lines.push(`### \`${s.id}\``, "");
    lines.push(`- **Page:** ${s.page}`);
    lines.push(`- **Purpose:** ${s.purpose}`);
    lines.push(`- **Type:** ${s.deriveFrom ? `share image, made from \`${s.deriveFrom}\`` : "illustrative (a real photo can replace it at any time)"}`);
    lines.push(`- **Crops:** ${s.aspects.map((a) => `${fmtRatio(a)} (${a.widths.join(", ")} px${a.media ? `, ${a.media}` : ""})`).join("; ")}`);
    lines.push(`- **Source needed:** at least ${size.width}×${size.height}px`);
    lines.push(`- **Placement:** ${s.placement}`);
    lines.push(`- **Alt text:** ${s.alt}`);
    lines.push("");
    const p = slotPrompts(s, byId);
    if (p?.from) lines.push(`> Made automatically from the header image \`${p.from}\` — you can also upload your own. The header's prompts:`, "");
    if (p) lines.push("**Prompt**", "", "```text", p.main, "```", "", "**Alternative scene**", "", "```text", p.alt, "```", "");
  }
  return lines.join("\n");
}
