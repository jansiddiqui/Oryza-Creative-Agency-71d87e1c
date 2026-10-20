import Link from "next/link";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";
import type { Lead } from "@/lib/leads-format";
import { AdminTitle } from "./AdminShell";
import { LeadCard } from "./LeadCard";

export function LeadsView({ leads, q, status }: { leads: Lead[]; q: string; status: LeadStatus | "" }) {
  const query = new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString();
  return (
    <>
      <AdminTitle
        title="Leads"
        intro="Every contact form and plan builder enquiry, newest first. Saved even when the email could not be sent."
        actions={
          <a href={`/admin/leads/export${query ? `?${query}` : ""}`} className="rounded-full border border-ink/20 px-5 py-2.5 text-[14px] font-semibold hover:border-ink">
            Export CSV
          </a>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="lead-q">Search leads</label>
        <input id="lead-q" name="q" defaultValue={q} placeholder="Search name, phone, business, city…" className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-[15px]" />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper">Search</button>
      </form>
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2 text-[14px]">
        {[{ id: "", label: "All" }, ...LEAD_STATUSES].map((s) => {
          const params = new URLSearchParams({ ...(q && { q }), ...(s.id && { status: s.id }) }).toString();
          return (
            <Link
              key={s.id || "all"}
              href={`/admin/leads${params ? `?${params}` : ""}`}
              aria-current={status === s.id ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 ${status === s.id ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>
      {leads.length === 0 ? (
        <p className="text-muted">{q || status ? "No leads match." : "No leads yet. They appear here as soon as someone sends the contact form or the plan builder."}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-muted">{leads.length} lead{leads.length === 1 ? "" : "s"}</p>
          {leads.map((l) => <LeadCard key={l.id} lead={l} />)}
        </div>
      )}
    </>
  );
}
