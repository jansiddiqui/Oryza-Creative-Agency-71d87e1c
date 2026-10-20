"use server";

import { adminAction } from "@/lib/admin/action";
import { sessionClient } from "@/lib/supabase/server";

/** Sets or changes the signed-in admin's own password (so email links are optional afterwards). */
export async function setPasswordAction(password: string) {
  return adminAction(async () => {
    if (password.length < 12) throw new Error("short");
    const { error } = await (await sessionClient()).auth.updateUser({ password });
    if (error) throw new Error(error.message);
  });
}
