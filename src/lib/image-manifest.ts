/**
 * Image manifest: which processed files exist for each slot, where they came from and who approved them.
 * Written by scripts/images-process.ts today and by the Phase 4 admin panel later — same shape, so
 * components never change when the source of images does.
 */
import manifestJson from "@/data/image-manifest.json";
import type { AspectId } from "@/data/image-slots";

export type ImageSource = "real" | "ai-illustrative";

export interface ManifestVariant {
  w: number;
  h: number;
  avif: string;
  webp: string;
}

export interface ManifestAspect {
  width: number;
  height: number;
  variants: ManifestVariant[];
  blurDataURL: string;
}

export interface ManifestEntry {
  source: ImageSource;
  original: { file: string; width: number; height: number; sha256: string };
  focal: { x: number; y: number };
  aspects: Partial<Record<AspectId, ManifestAspect>>;
  credit?: string;
  approved_by: string | null;
  approved_at: string | null;
  updated_at: string;
}

export interface ImageManifest {
  version: 1;
  slots: Record<string, ManifestEntry>;
}

export const manifest = manifestJson as ImageManifest;

/** An entry is shown on the site only once a person has approved it. */
export function approvedEntry(slotId: string, m: ImageManifest = manifest): ManifestEntry | null {
  const e = m.slots[slotId];
  return e && e.approved_by && e.approved_at ? e : null;
}

/** Smallest variant at least `width` wide (or the largest available). */
export function pickVariant(variants: ManifestVariant[], width: number): ManifestVariant {
  const sorted = [...variants].sort((a, b) => a.w - b.w);
  return sorted.find((v) => v.w >= width) ?? sorted[sorted.length - 1];
}

/** Public URL of the share image for a slot, if one is approved. */
export function ogImageUrl(slotId: string, m: ImageManifest = manifest): string | null {
  const og = approvedEntry(slotId, m)?.aspects.og;
  if (!og?.variants.length) return null;
  return pickVariant(og.variants, 1200).webp;
}
