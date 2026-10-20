import type { AspectId } from "@/data/image-slots";

export type ImageSource = "real" | "ai-illustrative";
export type ImageStatus = "uploaded" | "live" | "archived";

/** One processed size of one crop. Paths are relative to the public `site-images` bucket. */
export interface ProcessedVariant {
  w: number;
  h: number;
  avif: string;
  webp: string;
}

export interface ProcessedAspect {
  /** Size of the crop taken from the original. */
  width: number;
  height: number;
  variants: ProcessedVariant[];
  blurDataURL: string;
}

export type ProcessedAspects = Partial<Record<AspectId, ProcessedAspect>>;

export interface Focal {
  x: number;
  y: number;
}

/** A version of a slot's image, as stored in `slot_images`. */
export interface ImageVersion {
  id: string;
  slotId: string;
  version: number;
  status: ImageStatus;
  source: ImageSource;
  originalPath: string;
  originalWidth: number;
  originalHeight: number;
  originalSha256: string | null;
  focal: Focal;
  aspects: ProcessedAspects | null;
  derivedFrom: string | null;
  credit: string | null;
  checklist: Record<string, boolean> | null;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/** What the public site needs to show a live image. */
export interface LiveImage {
  slotId: string;
  version: number;
  source: ImageSource;
  focal: Focal;
  aspects: ProcessedAspects;
  approvedAt: string | null;
}
