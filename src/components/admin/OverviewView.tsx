import Link from "next/link";
import { AdminTitle, Notice } from "./AdminShell";

export function OverviewView({
  name,
  images,
  leads,
  denied,
}: {
  name: string;
  images: { live: number; review: number; empty: number };
  leads: { new: number; total: number };
  denied?: boolean;
}) {
  const card = "card-lift block rounded-2xl border border-line bg-paper p-6";
  return (
    <>
      <AdminTitle title={`Hello, ${name}`} intro="What needs attention today." />
      {denied && <div className="mb-6"><Notice tone="error">That page is for owners only.</Notice></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/admin/leads?status=new" className={card}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-700">New leads</p>
          <p className="mt-2 font-display text-5xl">{leads.new}</p>
          <p className="mt-1 text-[14px] text-muted">{leads.total} in total</p>
        </Link>
        <Link href="/admin/images?status=review" className={card}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-700">Images to review</p>
          <p className="mt-2 font-display text-5xl">{images.review}</p>
          <p className="mt-1 text-[14px] text-muted">Uploaded, waiting for the checklist</p>
        </Link>
        <Link href="/admin/images" className={card}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-700">Image slots</p>
          <p className="mt-2 font-display text-5xl">{images.live}<span className="text-2xl text-muted"> / {images.live + images.review + images.empty}</span></p>
          <p className="mt-1 text-[14px] text-muted">live · {images.empty} still show the brand fallback</p>
        </Link>
      </div>
    </>
  );
}
