import { NextResponse } from "next/server";
import { AdminAuthError, assertAdmin } from "@/lib/admin/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";
import { listLeads } from "@/lib/leads";
import { leadsToCsv } from "@/lib/leads-format";

/** CSV of leads (same filters as the Leads page). Admins only. */
export async function GET(req: Request) {
  try {
    await assertAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: e.status, headers: { "Cache-Control": "no-store" } });
    throw e;
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "";
  const leads = await listLeads({
    q: url.searchParams.get("q") ?? undefined,
    status: LEAD_STATUSES.some((s) => s.id === status) ? (status as LeadStatus) : undefined,
    limit: 5000,
  });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(leadsToCsv(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oryza-leads-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
