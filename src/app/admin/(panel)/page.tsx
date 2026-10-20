import { OverviewView } from "@/components/admin/OverviewView";
import { requireAdmin } from "@/lib/admin/auth";
import { loadSlotSummaries } from "@/lib/admin/images-data";
import { serviceClient } from "@/lib/supabase/admin";

export const metadata = { title: "Overview" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requireAdmin();
  const [slots, newLeads, allLeads] = await Promise.all([
    loadSlotSummaries(),
    serviceClient().from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    serviceClient().from("leads").select("id", { count: "exact", head: true }),
  ]);
  return (
    <OverviewView
      name={admin.email.split("@")[0]}
      denied={(await searchParams).denied === "1"}
      images={{
        live: slots.filter((s) => s.status === "live").length,
        review: slots.filter((s) => s.pending).length,
        empty: slots.filter((s) => s.status === "empty").length,
      }}
      leads={{ new: newLeads.count ?? 0, total: allLeads.count ?? 0 }}
    />
  );
}
