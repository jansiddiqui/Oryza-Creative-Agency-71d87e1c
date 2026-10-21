import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";

/** Today is the admin home (the old overview's numbers live on Today now). */
export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  await requireAdmin();
  redirect((await searchParams).denied === "1" ? "/admin/today?denied=1" : "/admin/today");
}
