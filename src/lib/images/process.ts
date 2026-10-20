import sharp from "sharp";
import type { ImageSlot } from "@/data/image-slots";
import { focalCrop, outputWidths } from "@/lib/image-crop";
import type { Focal, ProcessedAspects, ProcessedVariant } from "./types";

export interface RenderedFile {
  /** Path inside the public bucket. */
  path: string;
  body: Buffer;
  contentType: "image/avif" | "image/webp";
}

/**
 * Crops the original for every aspect the slot needs (centred on the focal point), resizes to each
 * output width (never upscaling) and encodes AVIF + WebP. sharp drops EXIF/GPS/ICC metadata by default.
 */
export async function renderSlotImages(
  original: Buffer,
  slot: ImageSlot,
  focal: Focal,
  version: number,
): Promise<{ files: RenderedFile[]; aspects: ProcessedAspects }> {
  const { data, info } = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
  const files: RenderedFile[] = [];
  const aspects: ProcessedAspects = {};
  const dir = `slots/${slot.id}/v${version}`;

  for (const a of slot.aspects) {
    const rect = focalCrop(info.width, info.height, a.ratio, focal);
    if (rect.width < a.minWidth) throw new Error(`${slot.id}: the ${a.id} crop is ${rect.width}px wide; it needs ${a.minWidth}px`);
    const variants: ProcessedVariant[] = [];
    for (const w of outputWidths(rect.width, a.widths)) {
      const h = Math.round((w * a.ratio[1]) / a.ratio[0]);
      const base = sharp(data).extract(rect).resize(w, h, { fit: "cover" });
      const name = `${dir}/${a.id}-${w}`;
      const [avif, webp] = await Promise.all([
        base.clone().avif({ quality: 55, effort: 2 }).toBuffer(),
        base.clone().webp({ quality: 78 }).toBuffer(),
      ]);
      files.push({ path: `${name}.avif`, body: avif, contentType: "image/avif" }, { path: `${name}.webp`, body: webp, contentType: "image/webp" });
      variants.push({ w, h, avif: `${name}.avif`, webp: `${name}.webp` });
    }
    const blur = await sharp(data).extract(rect).resize(16).webp({ quality: 40 }).toBuffer();
    aspects[a.id] = { width: rect.width, height: rect.height, variants, blurDataURL: `data:image/webp;base64,${blur.toString("base64")}` };
  }
  return { files, aspects };
}

/** Reads the real format and size of an uploaded file (never trusts the browser's claim). */
export async function inspectImage(buf: Buffer): Promise<{ mime: string; width: number; height: number }> {
  try {
    const m = await sharp(buf).metadata();
    const rotated = m.orientation && m.orientation >= 5;
    const mime = m.format === "jpeg" ? "image/jpeg" : m.format === "png" ? "image/png" : m.format === "webp" ? "image/webp" : `image/${m.format}`;
    return { mime, width: (rotated ? m.height : m.width) ?? 0, height: (rotated ? m.width : m.height) ?? 0 };
  } catch {
    return { mime: "unknown", width: 0, height: 0 };
  }
}
