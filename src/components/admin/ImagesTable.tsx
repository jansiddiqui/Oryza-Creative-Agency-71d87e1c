"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./AdminShell";
import { DataTable, type Column } from "./ui/DataTable";
import { useStored } from "./ui/useStored";

export interface ImageRow {
  id: string;
  purpose: string;
  page: string;
  kind: string;
  source: string;
  status: string;
  pending: boolean;
  thumb: string | null;
  industry: string;
  /** Rendered on the server (the brand icon for slots without a photo yet). */
  placeholder: ReactNode;
}

function Thumb({ r, className }: { r: ImageRow; className: string }) {
  return r.thumb ? (
    // Admin thumbnail from storage (signed URL): next/image cannot optimise it.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={r.thumb} alt="" loading="lazy" className={`${className} object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center bg-cream text-gold-700`}>{r.placeholder}</span>
  );
}

/** Image slots as a grid (default) or a sortable table; views put work that needs review first. */
export function ImagesTable({ rows }: { rows: ImageRow[] }) {
  const router = useRouter();
  const [storedLayout, choose] = useStored("oz_images_layout");
  const layout: "grid" | "table" = storedLayout === "table" ? "table" : "grid";
  const columns: Column<ImageRow>[] = [
    { key: "purpose", label: "Slot", sort: (r) => r.purpose, card: "title", render: (r) => <Link href={`/admin/images/${r.id}`} className="flex items-center gap-3 hover:underline"><Thumb r={r} className="hidden h-10 w-16 shrink-0 rounded-md md:block" /><span><span className="block font-semibold">{r.purpose}</span><span className="block font-mono text-[12px] font-normal text-muted">{r.id}</span></span></Link> },
    { key: "page", label: "Page", sort: (r) => r.page, card: "meta", render: (r) => r.page },
    { key: "kind", label: "Type", sort: (r) => r.kind, card: "meta", render: (r) => r.kind },
    { key: "source", label: "Live source", sort: (r) => r.source, card: "hide", render: (r) => r.source || "—" },
    { key: "status", label: "Status", sort: (r) => (r.pending ? 0 : r.status === "empty" ? 1 : 2), card: "badge", render: (r) => <span className="inline-flex gap-1"><StatusBadge status={r.status} />{r.pending && r.status === "live" && <StatusBadge status="uploaded" />}</span> },
  ];
  const views = [
    { id: "review", label: "Needs review", test: (r: ImageRow) => r.pending },
    { id: "empty", label: "Empty", test: (r: ImageRow) => r.status === "empty" },
    { id: "live", label: "Live", test: (r: ImageRow) => r.status === "live" },
    { id: "all", label: "All", test: () => true },
  ];
  return (
    <>
      <div role="group" aria-label="Layout" className="mb-3 inline-flex rounded-[10px] bg-surface-2 p-[3px]">
        {(["grid", "table"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={layout === v} onClick={() => choose(v)} className={`min-h-10 rounded-lg px-3 text-[13px] font-semibold capitalize md:min-h-8 ${layout === v ? "bg-surface shadow-sm" : "text-text-2"}`}>{v}</button>
        ))}
      </div>
      {layout === "table" ? (
        <DataTable id="images" rows={rows} rowKey={(r) => r.id} columns={columns} views={views} initialSort={{ key: "status", dir: "asc" }} search={(r) => `${r.purpose} ${r.page} ${r.id} ${r.industry}`} onOpen={(r) => router.push(`/admin/images/${r.id}`)} />
      ) : (
        <ImagesGrid rows={rows} views={views} />
      )}
    </>
  );
}

function ImagesGrid({ rows, views }: { rows: ImageRow[]; views: { id: string; label: string; test: (r: ImageRow) => boolean }[] }) {
  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const v = views.find((x) => x.id === view)!;
  const shown = rows.filter((r) => v.test(r) && (!q || `${r.purpose} ${r.page} ${r.id}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => Number(b.pending) - Number(a.pending));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Views" className="flex flex-wrap gap-1.5">
          {views.map((x) => (
            <button key={x.id} type="button" aria-pressed={view === x.id} onClick={() => setView(x.id)} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold md:min-h-8 ${view === x.id ? "border-ink bg-ink text-paper" : "border-edge-strong bg-surface"}`}>
              {x.label}<span className="text-[12px] opacity-75 tabular-nums">{rows.filter(x.test).length}</span>
            </button>
          ))}
        </div>
        <input aria-label="Search slots" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="min-h-11 w-full rounded-lg border px-3 text-base md:ml-auto md:min-h-10 md:w-64 md:text-[14px]" />
      </div>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">No slots match.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/images/${r.id}`} className="flex h-full flex-col overflow-hidden rounded-xl border border-edge bg-surface hover:border-edge-strong">
                <span className="relative block">
                  <Thumb r={r} className="aspect-[16/9] w-full" />
                  <span className="absolute left-2 top-2"><StatusBadge status={r.pending && r.status !== "live" ? "review" : r.status} /></span>
                </span>
                <span className="flex flex-1 flex-col p-3">
                  <span className="text-[14px] font-semibold leading-5">{r.purpose}</span>
                  <span className="mt-1 text-[12px] text-muted">{r.page} · {r.kind}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
