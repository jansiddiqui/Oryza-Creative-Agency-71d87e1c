import { cookies } from "next/headers";
import { Shell } from "@/components/admin/shell/Shell";
import { requireAdmin } from "@/lib/admin/auth";
import { shellCounts } from "@/lib/admin/shell-data";

/** Every page in the admin panel requires an active allow-listed admin (checked on the server). */
export default async function PanelLayout({ children, drawer }: { children: React.ReactNode; drawer?: React.ReactNode }) {
  const admin = await requireAdmin();
  const [counts, jar] = await Promise.all([shellCounts(), cookies()]);
  return (
    <Shell admin={admin} counts={counts} collapsed={jar.get("oz_nav")?.value === "c"}>
      {children}
      {drawer}
    </Shell>
  );
}
