/** Upload, source and checklist rules for slot images. Pure functions — used by the admin UI and the server. */
import type { ImageSlot } from "@/data/image-slots";
import { REVIEW_CHECKLIST } from "@/lib/image-prompts";
import { focalCrop } from "@/lib/image-crop";
import type { ImageSource } from "./types";

export const ACCEPTED_TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/** A crop that keeps less than this share of the picture means the original has the wrong shape. */
const MIN_KEPT_AREA = 0.4;

const ratioLabel = (r: [number, number]) => (r[0] === 1200 ? "1200×630" : `${r[0]}:${r[1]}`);

export interface UploadFacts {
  mime: string;
  bytes: number;
  width: number;
  height: number;
}

/** Problems with an upload for this slot, in plain words (empty = fine). */
export function checkUpload(slot: ImageSlot, f: UploadFacts): string[] {
  const errors: string[] = [];
  if (!ACCEPTED_TYPES[f.mime]) errors.push("Use a JPG, PNG or WebP image.");
  if (f.bytes > MAX_UPLOAD_BYTES) errors.push(`The file is ${(f.bytes / 1048576).toFixed(1)} MB; the limit is 25 MB.`);
  if (!(f.width > 0 && f.height > 0)) {
    errors.push("The image could not be read.");
    return errors;
  }
  for (const a of slot.aspects) {
    const crop = focalCrop(f.width, f.height, a.ratio);
    if (crop.width < a.minWidth) {
      errors.push(
        `Too small for the ${ratioLabel(a.ratio)} crop: it needs at least ${a.minWidth}px of width there, this image gives ${crop.width}px. Generate it at 1536×1024 or larger.`,
      );
    }
    const kept = (crop.width * crop.height) / (f.width * f.height);
    if (kept < MIN_KEPT_AREA && !a.media) {
      errors.push(`Wrong shape for the ${ratioLabel(a.ratio)} crop: only ${Math.round(kept * 100)}% of the picture would remain. Use a landscape (3:2) image.`);
    }
  }
  return errors;
}

/** Real-only slots accept real photos only. Returns an error message or null. */
export function checkSource(slot: ImageSlot, source: string): string | null {
  if (source !== "real" && source !== "ai-illustrative") return "Choose whether this is a real photo or an AI illustration.";
  if (slot.type === "real-only" && source !== "real") return "This slot shows real work, people or places: only a real photo is allowed here.";
  return null;
}

/** Every checklist item must be ticked. Returns an error message or null. */
export function checkChecklist(ticks: Record<string, unknown> | null | undefined): string | null {
  const missing = REVIEW_CHECKLIST.filter((c) => ticks?.[c.id] !== true);
  return missing.length ? `Tick every review item before approving (${missing.map((m) => m.label.toLowerCase()).join("; ")}).` : null;
}

export const isImageSource = (s: string): s is ImageSource => s === "real" || s === "ai-illustrative";
