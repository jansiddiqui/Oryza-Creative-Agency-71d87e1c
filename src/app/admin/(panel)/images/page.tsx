import { ImagesListView } from "@/components/admin/ImagesListView";
import { requireAdmin } from "@/lib/admin/auth";
import { loadSlotSummaries } from "@/lib/admin/images-data";

export const metadata = { title: "Images" };

export default async function Images({ searchParams }: { searchParams: Promise<{ page?: string; industry?: string; status?: string }> }) {
  await requireAdmin();
  return <ImagesListView rows={await loadSlotSummaries()} filters={await searchParams} />;
}
