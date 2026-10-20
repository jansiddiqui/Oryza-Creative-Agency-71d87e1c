import type { AspectId, ImageSlot } from "@/data/image-slots";

/** Literal class names so Tailwind generates them. */
const aspectClass: Record<AspectId, string> = {
  "16x9": "aspect-[16/9]",
  "4x5": "aspect-[4/5]",
  "4x3": "aspect-[4/3]",
  og: "aspect-[1200/630]",
};
const mdAspectClass: Record<AspectId, string> = {
  "16x9": "md:aspect-[16/9]",
  "4x5": "md:aspect-[4/5]",
  "4x3": "md:aspect-[4/3]",
  og: "md:aspect-[1200/630]",
};

/** Default crop on wide screens, optional portrait crop on phones. */
export function slotAspects(slot: ImageSlot) {
  const wide = slot.aspects.find((a) => !a.media) ?? slot.aspects[0];
  const narrow = slot.aspects.find((a) => a.media);
  return { wide, narrow };
}

/**
 * Frame classes: the phone crop below md when the slot has one, the default crop from md up.
 * `wideOnly` keeps the default crop on every screen (used by the brand fallback, so an empty slot never
 * takes a tall portrait block on phones).
 */
export function frameClass(slot: ImageSlot, { wideOnly = false } = {}): string {
  const { wide, narrow } = slotAspects(slot);
  return narrow && !wideOnly ? `${aspectClass[narrow.id]} ${mdAspectClass[wide.id]}` : aspectClass[wide.id];
}
