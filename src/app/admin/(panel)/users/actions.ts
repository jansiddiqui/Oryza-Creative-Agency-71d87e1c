"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { serviceClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/lib/admin/types";

const role = (r: string): AdminRole => (r === "owner" ? "owner" : "editor");

/** Owners add someone to the allow-list. Their login itself is created in Supabase (docs/supabase-setup.md). */
export async function addUserAction(email: string, r: string) {
  return adminAction(async (admin) => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error("invalid email");
    const { error } = await serviceClient().from("admin_users").upsert({ email: e, role: role(r), active: true, added_by: admin.email, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await audit(admin.email, "user.add", e, { role: role(r) });
    revalidatePath("/admin/users");
  }, "owner");
}

/** Change role or switch access off. Owners cannot demote or lock out themselves (no accidental lock-out). */
export async function updateUserAction(email: string, patch: { role?: string; active?: boolean }) {
  return adminAction(async (admin) => {
    if (email === admin.email && (patch.active === false || (patch.role && patch.role !== "owner"))) throw new Error("self");
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.role) update.role = role(patch.role);
    if (patch.active !== undefined) update.active = patch.active;
    const { error } = await serviceClient().from("admin_users").update(update).eq("email", email);
    if (error) throw new Error(error.message);
    await audit(admin.email, "user.update", email, update);
    revalidatePath("/admin/users");
  }, "owner");
}
