/**
 * Live images for the public site: read from Supabase's REST API with the public (anon) key — Row Level
 * Security lets it see only live rows and safe columns. Cached under the `slot-images` tag and refreshed
 * when an admin approves, rolls back or removes. Any failure returns no images, so pages show the brand
 * fallback instead of breaking.
 */
import type { ImageSlot } from "@/data/image-slots";
import { publicImageUrl, SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";
import type { LiveImage, ProcessedVariant } from "./types";

export const LIVE_IMAGES_TAG = "slot-images";

type Row = { slot_id: string; version: number; source: LiveImage["source"]; focal_x: number; focal_y: number; aspects: LiveImage["aspects"]; approved_at: string | null };

export async function fetchLiveImages(fetcher: typeof fetch = fetch): Promise<Map<string, LiveImage>> {
  if (!supabaseConfigured()) return new Map();
  try {
    const res = await fetcher(
      `${SUPABASE_URL}/rest/v1/slot_images?select=slot_id,version,source,focal_x,focal_y,aspects,approved_at&status=eq.live`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        cache: "force-cache",
        next: { tags: [LIVE_IMAGES_TAG], revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as Row[];
    return new Map(
      rows
        .filter((r) => r.aspects)
        .map((r) => [r.slot_id, { slotId: r.slot_id, version: r.version, source: r.source, focal: { x: r.focal_x, y: r.focal_y }, aspects: r.aspects, approvedAt: r.approved_at }]),
    );
  } catch (err) {
    console.error("[images] live images unavailable, showing fallbacks:", (err as Error).message);
    return new Map();
  }
}

export async function getLiveImage(slotId: string): Promise<LiveImage | null> {
  return (await fetchLiveImages()).get(slotId) ?? null;
}

/** Smallest variant at least `width` wide (or the largest available). */
export function pickVariant(variants: ProcessedVariant[], width: number): ProcessedVariant {
  const sorted = [...variants].sort((a, b) => a.w - b.w);
  return sorted.find((v) => v.w >= width) ?? sorted[sorted.length - 1];
}

/** Absolute URL of the share image for a slot, if one is live. */
export async function ogImageUrl(slot: Pick<ImageSlot, "id">): Promise<string | null> {
  const og = (await getLiveImage(slot.id))?.aspects.og;
  return og?.variants.length ? publicImageUrl(pickVariant(og.variants, 1200).webp) : null;
}
