import { AuditView, type AuditRow } from "@/components/admin/AuditView";
import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/admin";

export const metadata = { title: "Activity" };

export default async function Audit() {
  await requireAdmin();
  const { data } = await serviceClient().from("audit_log").select("*").order("at", { ascending: false }).limit(200);
  return <AuditView rows={(data ?? []) as AuditRow[]} />;
}
