import { categories } from "@/data/categories";
import { IndustryIcon, StrategyIcon } from "@/components/icons";
import type { SlotSummary } from "@/lib/admin/images-data";
import { AdminTitle, sourceLabel } from "./AdminShell";
import { ImagesTable } from "./ImagesTable";

export interface ImageFilters {
  page?: string;
  industry?: string;
  status?: string;
}

export function filterSlots(rows: SlotSummary[], f: ImageFilters): SlotSummary[] {
  return rows.filter(
    (r) =>
      (!f.page || r.slot.page === f.page) &&
      (!f.industry || r.slot.icon === f.industry) &&
      (!f.status || r.status === f.status || (f.status === "review" && r.pending)),
  );
}

/** Every image slot with its status, source and thumbnail (grid or table, views, search). */
export function ImagesListView({ rows, filters = {} }: { rows: SlotSummary[]; filters?: ImageFilters }) {
  const count = (s: string) => rows.filter((r) => r.status === s || (s === "review" && r.pending)).length;
  return (
    <>
      <AdminTitle title="Images" intro={`${count("review")} need review · ${count("live")} live · ${count("empty")} still show the brand fallback. Open a slot to copy its prompt, upload, review and publish.`} />
      <ImagesTable
        rows={filterSlots(rows, filters).map((r) => ({
          id: r.slot.id,
          purpose: r.slot.purpose,
          page: r.slot.page,
          kind: r.slot.deriveFrom ? "Share image" : "Illustrative",
          source: r.live ? sourceLabel(r.live.source) : "",
          status: r.status,
          pending: r.pending,
          thumb: r.thumb,
          industry: r.slot.icon ?? "",
          placeholder: categories.some((c) => c.slug === r.slot.icon) ? <IndustryIcon slug={r.slot.icon!} size={32} accent /> : <StrategyIcon size={32} accent />,
        }))}
      />
    </>
  );
}
