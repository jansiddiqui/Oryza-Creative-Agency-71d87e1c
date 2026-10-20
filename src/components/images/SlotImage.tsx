import { getImageProps, type ImageLoader } from "next/image";
import { slotById, type ImageSlot } from "@/data/image-slots";
import { approvedEntry, pickVariant, type ManifestAspect, type ManifestEntry } from "@/lib/image-manifest";
import { BrandFallback } from "./BrandFallback";
import { frameClass, slotAspects } from "./frame";

// next/image hands each requested width to this loader; we answer with the nearest pre-built file.
const loaderFor =
  (aspect: ManifestAspect, format: "avif" | "webp"): ImageLoader =>
  ({ width }) =>
    pickVariant(aspect.variants, width)[format];

function srcSets(aspect: ManifestAspect, alt: string, sizes: string, priority: boolean) {
  const largest = aspect.variants[aspect.variants.length - 1];
  const common = { alt, sizes, width: largest.w, height: largest.h, priority, src: largest.webp };
  const avif = getImageProps({ ...common, loader: loaderFor(aspect, "avif") }).props;
  const webp = getImageProps({ ...common, loader: loaderFor(aspect, "webp") }).props;
  return { avif, webp };
}

/** Renders an approved manifest entry as an art-directed <picture> (AVIF + WebP, portrait crop on phones). */
export function SlotPicture({
  slot,
  entry,
  sizes,
  priority = false,
  className = "",
}: {
  slot: ImageSlot;
  entry: ManifestEntry;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const { wide, narrow } = slotAspects(slot);
  const wideA = entry.aspects[wide.id];
  if (!wideA) return null;
  const narrowA = narrow ? entry.aspects[narrow.id] : undefined;
  const w = srcSets(wideA, slot.alt, sizes, priority);
  const n = narrowA && narrow?.media ? srcSets(narrowA, slot.alt, sizes, priority) : null;
  const { style: _ignored, ...img } = w.webp;
  void _ignored;
  return (
    <picture className={`block overflow-hidden ${frameClass(slot)} ${className}`}>
      {n && <source media={narrow!.media} type="image/avif" srcSet={n.avif.srcSet} sizes={sizes} />}
      {n && <source media={narrow!.media} type="image/webp" srcSet={n.webp.srcSet} sizes={sizes} />}
      <source type="image/avif" srcSet={w.avif.srcSet} sizes={sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from the slot via getImageProps */}
      <img
        {...img}
        className="h-full w-full object-cover"
        style={{
          objectPosition: `${entry.focal.x * 100}% ${entry.focal.y * 100}%`,
          backgroundImage: `url("${wideA.blurDataURL}")`,
          backgroundSize: "cover",
        }}
      />
    </picture>
  );
}

/**
 * The one way pages show photos. Looks the slot up in the registry and the approved manifest entry:
 * - approved image → responsive <picture>, lazy unless `priority` (heroes only), blur placeholder;
 * - no image yet → the brand fallback (if the slot allows it) or nothing — never a broken image or stock photo.
 */
export function SlotImage({
  slot: slotId,
  sizes = "100vw",
  priority = false,
  className = "",
}: {
  slot: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const slot = slotById[slotId];
  if (!slot) throw new Error(`Unknown image slot "${slotId}" — add it to src/data/image-slots.ts`);
  const entry = approvedEntry(slotId);
  if (entry) return <SlotPicture slot={slot} entry={entry} sizes={sizes} priority={priority} className={className} />;
  if (!slot.fallback) return null;
  return <BrandFallback slot={slot} className={className} />;
}

/** True when the slot has an approved image, for layouts that only reserve space when there is one. */
export function hasSlotImage(slotId: string): boolean {
  return approvedEntry(slotId) !== null;
}

/** Header media for a slot, or undefined so the header stays single-column until an image is approved. */
export function slotMedia(slotId: string, sizes = "(min-width: 1024px) 40vw, 100vw") {
  return hasSlotImage(slotId) ? <SlotImage slot={slotId} sizes={sizes} priority /> : undefined;
}
