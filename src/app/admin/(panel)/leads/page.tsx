import { LeadsView } from "@/components/admin/LeadsView";
import { requireAdmin } from "@/lib/admin/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";
import { listLeads } from "@/lib/leads";

export const metadata = { title: "Leads" };

export default async function Leads({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = LEAD_STATUSES.some((s) => s.id === sp.status) ? (sp.status as LeadStatus) : "";
  const q = (sp.q ?? "").slice(0, 80);
  return <LeadsView leads={await listLeads({ q, status: status || undefined })} q={q} status={status} />;
}
