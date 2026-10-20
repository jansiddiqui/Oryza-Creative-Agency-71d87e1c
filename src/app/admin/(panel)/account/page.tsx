import { AccountView } from "@/components/admin/AccountView";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Account" };

export default async function Account() {
  return <AccountView admin={await requireAdmin()} />;
}
