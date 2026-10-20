import { UsersView, type AdminUserRow } from "@/components/admin/UsersView";
import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/admin";

export const metadata = { title: "Users" };

export default async function Users() {
  const admin = await requireAdmin("owner");
  const { data } = await serviceClient().from("admin_users").select("email, role, active, added_by, created_at").order("created_at");
  return <UsersView users={(data ?? []) as AdminUserRow[]} me={admin.email} />;
}
