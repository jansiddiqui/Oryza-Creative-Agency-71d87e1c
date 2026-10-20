import "server-only";
import { imageSlots, slotById, type ImageSlot } from "@/data/image-slots";
import { BUCKETS, publicImageUrl } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/admin";
import { supabaseImageRepo } from "@/lib/images/supabase-store";
import type { ImageVersion } from "@/lib/images/types";
import { pickVariant } from "@/lib/images/live";

export type SlotStatus = "empty" | "review" | "live";

export interface SlotSummary {
  slot: ImageSlot;
  status: SlotStatus;
  /** A new upload is waiting for review (can be true while another version is live). */
  pending: boolean;
  live: ImageVersion | null;
  thumb: string | null;
  versions: number;
}

export interface VersionView extends ImageVersion {
  thumb: string | null;
  /** Signed URL of the original (uploaded versions only; for the focal editor). */
  originalUrl: string | null;
}

/** Small public thumbnail of an approved version. */
export function approvedThumb(v: ImageVersion): string | null {
  const first = v.aspects && Object.values(v.aspects)[0];
  return first?.variants.length ? publicImageUrl(pickVariant(first.variants, 480).webp) : null;
}

export function summarise(slots: ImageSlot[], versions: ImageVersion[], signed: Map<string, string>): SlotSummary[] {
  return slots.map((slot) => {
    const mine = versions.filter((v) => v.slotId === slot.id);
    const live = mine.find((v) => v.status === "live") ?? null;
    const pendingV = mine.find((v) => v.status === "uploaded") ?? null;
    return {
      slot,
      status: live ? "live" : pendingV ? "review" : "empty",
      pending: Boolean(pendingV),
      live,
      thumb: live ? approvedThumb(live) : pendingV ? (signed.get(pendingV.originalPath) ?? null) : null,
      versions: mine.length,
    };
  });
}

async function signOriginals(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data } = await serviceClient().storage.from(BUCKETS.originals).createSignedUrls(paths, 60 * 30);
  const out = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}

export async function loadSlotSummaries(): Promise<SlotSummary[]> {
  const versions = await supabaseImageRepo(serviceClient()).listAll();
  const pendingPaths = versions.filter((v) => v.status === "uploaded").map((v) => v.originalPath);
  return summarise(imageSlots, versions, await signOriginals(pendingPaths));
}

export async function loadSlotDetail(slotId: string): Promise<{ slot: ImageSlot; versions: VersionView[] } | null> {
  const slot = slotById[slotId];
  if (!slot) return null;
  const versions = await supabaseImageRepo(serviceClient()).listVersions(slotId);
  const signed = await signOriginals(versions.filter((v) => v.status === "uploaded").map((v) => v.originalPath));
  return {
    slot,
    versions: versions.map((v) => {
      const originalUrl = v.status === "uploaded" ? (signed.get(v.originalPath) ?? null) : null;
      return { ...v, originalUrl, thumb: v.aspects ? approvedThumb(v) : originalUrl };
    }),
  };
}
