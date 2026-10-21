import Link from "next/link";
import { categories } from "@/data/categories";
import { IndustryIcon, StrategyIcon } from "@/components/icons";
import type { SlotSummary } from "@/lib/admin/images-data";
import { AdminTitle, StatusBadge, sourceLabel } from "./AdminShell";

export interface ImageFilters {
  page?: string;
  industry?: string;
  status?: string;
}

const select = "rounded-lg border border-line bg-paper px-3 py-2 text-[14px]";

export function filterSlots(rows: SlotSummary[], f: ImageFilters): SlotSummary[] {
  return rows.filter(
    (r) =>
      (!f.page || r.slot.page === f.page) &&
      (!f.industry || r.slot.icon === f.industry) &&
      (!f.status || r.status === f.status || (f.status === "review" && r.pending)),
  );
}

/** Every image slot with its status, source and thumbnail; filter by page, industry and status. */
export function ImagesListView({ rows, filters }: { rows: SlotSummary[]; filters: ImageFilters }) {
  const pages = [...new Set(rows.map((r) => r.slot.page))].sort();
  const shown = filterSlots(rows, filters);
  const count = (s: string) => rows.filter((r) => r.status === s || (s === "review" && r.pending)).length;
  return (
    <>
      <AdminTitle
        title="Images"
        intro="Every place on the site that can show a photo. Open a slot to copy its prompt, upload, review and publish."
      />
      <dl className="mb-6 flex flex-wrap gap-3 text-[14px]">
        {[["live", "Live"], ["review", "Needs review"], ["empty", "Empty"]].map(([k, l]) => (
          <div key={k} className="rounded-xl border border-line px-4 py-2">
            <dt className="inline text-muted">{l}: </dt>
            <dd className="inline font-semibold">{count(k)}</dd>
          </div>
        ))}
      </dl>
      <form className="mb-8 flex flex-wrap items-end gap-3" method="get">
        <label className="text-[13px] font-semibold">
          <span className="mb-1 block">Page</span>
          <select name="page" defaultValue={filters.page ?? ""} className={select}>
            <option value="">All pages</option>
            {pages.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-[13px] font-semibold">
          <span className="mb-1 block">Industry</span>
          <select name="industry" defaultValue={filters.industry ?? ""} className={select}>
            <option value="">All industries</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-[13px] font-semibold">
          <span className="mb-1 block">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className={select}>
            <option value="">Any status</option>
            <option value="empty">Empty</option>
            <option value="review">Needs review</option>
            <option value="live">Live</option>
          </select>
        </label>
        <button className="rounded-full bg-ink px-5 py-2 text-[14px] font-semibold text-paper">Filter</button>
        {(filters.page || filters.industry || filters.status) && <Link href="/admin/images" className="py-2 text-[14px] underline">Clear</Link>}
      </form>

      {shown.length === 0 ? (
        <p className="text-muted">No slots match these filters.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
            <li key={r.slot.id}>
              <Link href={`/admin/images/${r.slot.id}`} className="card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper">
                <div className="relative aspect-[16/9] bg-cream">
                  {r.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from storage
                    <img src={r.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-gold-700">
                      {categories.some((c) => c.slug === r.slot.icon) ? <IndustryIcon slug={r.slot.icon!} size={36} accent /> : <StrategyIcon size={36} accent />}
                    </span>
                  )}
                  <span className="absolute left-3 top-3"><StatusBadge status={r.status} /></span>
                  {r.pending && r.status === "live" && <span className="absolute right-3 top-3"><StatusBadge status="uploaded" /></span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold">{r.slot.purpose}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    {r.slot.page} · {r.slot.deriveFrom ? "Share image" : "Illustrative"}
                    {r.live ? ` · ${sourceLabel(r.live.source)}` : ""}
                  </p>
                  <p className="mt-auto pt-3 font-mono text-[12px] text-muted">{r.slot.id}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
