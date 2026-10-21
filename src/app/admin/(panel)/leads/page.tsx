import { LeadsView } from "@/components/admin/LeadsView";
import { requireAdmin } from "@/lib/admin/auth";
import { listLeads } from "@/lib/leads";

export const metadata = { title: "Leads" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Leads({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireAdmin();
  const { lead } = await searchParams;
  return <LeadsView leads={await listLeads({ limit: 1000 })} openId={lead && UUID.test(lead) ? lead : undefined} />;
}
