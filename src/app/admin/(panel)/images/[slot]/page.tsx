import { notFound } from "next/navigation";
import { SlotDetailView } from "@/components/admin/SlotDetailView";
import { requireAdmin } from "@/lib/admin/auth";
import { loadSlotDetail } from "@/lib/admin/images-data";

export const metadata = { title: "Image slot" };
/** Approving processes every size with sharp (AVIF is slow), so allow up to a minute. */
export const maxDuration = 60;

export default async function SlotPage({ params }: { params: Promise<{ slot: string }> }) {
  await requireAdmin();
  const detail = await loadSlotDetail((await params).slot);
  if (!detail) notFound();
  return <SlotDetailView slot={detail.slot} versions={detail.versions} />;
}
